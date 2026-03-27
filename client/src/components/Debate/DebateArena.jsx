import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useDebate } from '../../context/DebateContext'
import { useSocket } from '../../hooks/useSocket'

import ScoreBar from './ScoreBar'
import ArgumentFeed from './ArgumentFeed'
import FallacyBadge from './FallacyBadge'
import TopBar from './TopBar'
import BottomControls from './Bottomcontrols'
import WaitingScreen from './Waitingscreen'
import FinishedScreen from './Finishedscreen'
import AdmitDefeatModal from './Admitdefeatmodal'

const DebateArena = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId: roomIdParam } = useParams()
  const nav = location.state || {}

  const { username, role, topic, roomId, duration, turnDuration } = useDebate()
  const effectiveUsername     = nav.username     || username
  const effectiveRole         = nav.role         || role
  const effectiveTopic        = nav.topic        || topic
  const effectiveRoomId       = roomIdParam      || nav.roomId || roomId
  const effectiveDuration     = nav.duration     || duration
  const effectiveTurnDuration = nav.turnDuration !== undefined ? nav.turnDuration : turnDuration

  useEffect(() => {
    const t = setTimeout(() => {
      if (!effectiveUsername || !effectiveRole) navigate('/')
    }, 100)
    return () => clearTimeout(t)
  }, [effectiveUsername, effectiveRole, navigate])

  // ── State ─────────────────────────────────────────────────────────────────
  const [status, setStatus]               = useState('waiting')
  const [args, setArgs]                   = useState([])
  const [inputText, setInputText]         = useState('')
  const [currentTurn, setCurrentTurn]     = useState('debater_a')
  const [localTurnDuration, setLocalTurnDuration] = useState(effectiveTurnDuration === 0 ? 0 : (effectiveTurnDuration || 30))
  const [turnTimeLeft, setTurnTimeLeft]   = useState(effectiveTurnDuration === 0 ? -1 : (effectiveTurnDuration || 30))
  const [debateTimeLeft, setDebateTimeLeft] = useState(effectiveDuration || 300)
  const [scoreA, setScoreA]               = useState(0)
  const [scoreB, setScoreB]               = useState(0)
  const [chargeA, setChargeA]             = useState(0)
  const [chargeB, setChargeB]             = useState(0)
  const [nameA, setNameA]                 = useState(effectiveRole === 'debater_a' ? effectiveUsername : '...')
  const [nameB, setNameB]                 = useState(effectiveRole === 'debater_b' ? effectiveUsername : '...')
  const [lastFallacy, setLastFallacy]     = useState(null)
  const [lastFallacySpeaker, setLastFallacySpeaker] = useState(null)
  const [interjected, setInterjected]     = useState(false)
  const [disconnectMsg, setDisconnectMsg] = useState(null)
  const [finalResult, setFinalResult]     = useState(null)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [currentTopic, setCurrentTopic]   = useState(effectiveTopic || '')
  const [showConfirm, setShowConfirm]     = useState(false)

  const isMyTurn = effectiveRole === currentTurn
  const myCharge = effectiveRole === 'debater_a' ? chargeA : chargeB
  const isCharged = myCharge >= 100

  // ── Socket handlers ───────────────────────────────────────────────────────
  const handleRoomState = useCallback((data) => {
    setDebateTimeLeft(data.debateTimeLeft)
    setCurrentTurn(data.currentTurn)
    if (data.topic) setCurrentTopic(data.topic)
    if (data.turnDuration !== undefined) {
      setLocalTurnDuration(data.turnDuration)
      setTurnTimeLeft(data.turnDuration === 0 ? -1 : data.turnDuration)
    }
    setScoreA(data.scores.debater_a)
    setScoreB(data.scores.debater_b)
    setChargeA(data.charges.debater_a)
    setChargeB(data.charges.debater_b)
    setArgs(data.args)
    setStatus(data.status)
    if (data.players.debater_a) setNameA(data.players.debater_a)
    if (data.players.debater_b) setNameB(data.players.debater_b)
  }, [])

  const handleDebateStart = useCallback((data) => {
    setStatus('active')
    if (data.topic) setCurrentTopic(data.topic)
    setNameA(data.players.debater_a)
    setNameB(data.players.debater_b)
    setCurrentTurn(data.currentTurn)
    if (data.turnDuration !== undefined) {
      setLocalTurnDuration(data.turnDuration)
      setTurnTimeLeft(data.turnDuration === 0 ? -1 : data.turnDuration)
    }
  }, [])

  const handlePlayerJoined = useCallback(({ username: name, role: r }) => {
    if (r === 'debater_a') setNameA(name)
    if (r === 'debater_b') setNameB(name)
  }, [])

  const handleArgumentScored = useCallback(({ arg, scores, charges }) => {
    setArgs(prev => [...prev, arg])
    setScoreA(scores.debater_a)
    setScoreB(scores.debater_b)
    setChargeA(charges.debater_a)
    setChargeB(charges.debater_b)
    setIsSubmitting(false)
    setInputText('')
    if (arg.fallacies?.length > 0) {
      setLastFallacy(arg.fallacies[0])
      setLastFallacySpeaker(arg.speaker)
      setTimeout(() => setLastFallacy(null), 3200)
    }
  }, [])

  const localTurnDurationRef = useRef(localTurnDuration)
  useEffect(() => { localTurnDurationRef.current = localTurnDuration }, [localTurnDuration])

  const handleTurnChanged = useCallback(({ currentTurn: turn }) => {
    setCurrentTurn(turn)
    const td = localTurnDurationRef.current
    setTurnTimeLeft(td === 0 ? -1 : td)
  }, [])

  const handleTurnTick    = useCallback(({ turnTimeLeft: t }) => setTurnTimeLeft(t), [])
  const handleDebateTick  = useCallback(({ debateTimeLeft: t }) => setDebateTimeLeft(t), [])

  const handleInterjected = useCallback(({ charges }) => {
    setChargeA(charges.debater_a)
    setChargeB(charges.debater_b)
    setInterjected(true)
    setTimeout(() => setInterjected(false), 1500)
  }, [])

  const handleDebateEnded = useCallback((data) => {
    setStatus('finished')
    setFinalResult(data)
  }, [])

  const handleOpponentDisconnected = useCallback(({ username: name }) => {
    setDisconnectMsg(`${name} disconnected. Waiting 30s for reconnect...`)
  }, [])

  // ── Socket connection ─────────────────────────────────────────────────────
  const { emit } = useSocket(
    { roomId: effectiveRoomId, username: effectiveUsername, role: effectiveRole,
      topic: effectiveTopic, duration: effectiveDuration, turnDuration: localTurnDuration },
    {
      room_state:            handleRoomState,
      debate_start:          handleDebateStart,
      player_joined:         handlePlayerJoined,
      argument_scored:       handleArgumentScored,
      turn_changed:          handleTurnChanged,
      turn_tick:             handleTurnTick,
      debate_tick:           handleDebateTick,
      interject_used:        handleInterjected,
      debate_ended:          handleDebateEnded,
      opponent_disconnected: handleOpponentDisconnected,
    }
  )

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!inputText.trim() || !isMyTurn || isSubmitting || status !== 'active') return
    setIsSubmitting(true)
    emit('submit_argument', { roomId: effectiveRoomId, text: inputText.trim(), speaker: effectiveRole })
  }

  const handleInterject = () => {
    if (!isCharged || isMyTurn || status !== 'active') return
    emit('interject', { roomId: effectiveRoomId, role: effectiveRole })
  }

  // ── Screens ───────────────────────────────────────────────────────────────
  if (status === 'waiting')
    return <WaitingScreen roomId={effectiveRoomId} topic={currentTopic} />

  if (status === 'finished' && finalResult)
    return <FinishedScreen finalResult={finalResult} nameA={nameA} nameB={nameB} />

  // ── Main arena ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#080808] font-mono-plex flex flex-col overflow-hidden">

      {showConfirm && (
        <AdmitDefeatModal
          onConfirm={() => {
            setShowConfirm(false)
            emit('admit_defeat', { roomId: effectiveRoomId, role: effectiveRole, username: effectiveUsername })
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <FallacyBadge fallacy={lastFallacy} speaker={lastFallacySpeaker} />

      {disconnectMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 border border-red-500/30
                        bg-red-500/10 text-red-400 font-mono-plex text-xs tracking-wider px-4 py-2">
          ⚠ {disconnectMsg}
        </div>
      )}

      {interjected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="font-cinzel text-4xl text-red-400 tracking-[0.3em] animate-fade-up
                          border border-red-500/30 px-8 py-4 bg-red-500/10">
            ⚡ INTERJECTED!
          </div>
        </div>
      )}

      <TopBar
        roomId={effectiveRoomId}
        topic={currentTopic}
        debateTimeLeft={debateTimeLeft}
        onAdmitDefeat={() => setShowConfirm(true)}
      />

      <ScoreBar
        scoreA={scoreA} scoreB={scoreB}
        nameA={nameA} nameB={nameB}
        currentTurn={currentTurn}
      />

      <ArgumentFeed arguments={args} nameA={nameA} nameB={nameB} />

      <BottomControls
        chargeA={chargeA} chargeB={chargeB}
        turnTimeLeft={turnTimeLeft} localTurnDuration={localTurnDuration}
        isMyTurn={isMyTurn} isCharged={isCharged} role={effectiveRole}
        inputText={inputText} isSubmitting={isSubmitting}
        onInterject={handleInterject}
        onSubmit={handleSubmit}
        onInputChange={e => setInputText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
        }}
      />
    </div>
  )
}

export default DebateArena