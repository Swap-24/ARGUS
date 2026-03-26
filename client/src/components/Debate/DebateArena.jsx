/**
 * DebateArena.jsx
 * All game state is now driven by socket events from the server.
 * This component is purely reactive — it listens and renders.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useDebate } from '../../context/DebateContext'
import { useSocket } from '../../hooks/useSocket'
import ScoreBar from './ScoreBar'
import ArgumentFeed from './ArgumentFeed'
import TurnTimer from './TurnTimer'
import FallacyBadge from './FallacyBadge'
import InterjectionCharge from './InterjectionCharge'

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const DebateArena = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId: roomIdParam } = useParams()
  const nav = location.state || {}

  // Read from navigation state (reliable) with context as fallback
  const { username, role, topic, roomId, duration, turnDuration } = useDebate()
  const effectiveUsername     = nav.username    || username
  const effectiveRole         = nav.role        || role
  const effectiveTopic        = nav.topic       || topic
  // Prefer URL param so the room ID is always correct even on refresh
  const effectiveRoomId       = roomIdParam     || nav.roomId || roomId
  const effectiveDuration     = nav.duration    || duration
  const effectiveTurnDuration = nav.turnDuration !== undefined ? nav.turnDuration : turnDuration

  // Redirect to home (not login) only if truly missing — use a small delay
  // so navigation state has time to be read on first render.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!effectiveUsername || !effectiveRole) {
        navigate('/home')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [effectiveUsername, effectiveRole, navigate])

  // ── Game state — all driven by server events ──────────────────────────────
  const [status, setStatus] = useState('waiting') // 'waiting' | 'active' | 'finished'
  const [args, setArgs] = useState([])
  const [inputText, setInputText] = useState('')
  const [currentTurn, setCurrentTurn] = useState('debater_a')
  // localTurnDuration starts from context (creator) but gets synced from
  // server for Debater B who never set it via the lobby
  const [localTurnDuration, setLocalTurnDuration] = useState(effectiveTurnDuration === 0 ? 0 : (effectiveTurnDuration || 30))
  const [turnTimeLeft, setTurnTimeLeft] = useState(effectiveTurnDuration === 0 ? -1 : (effectiveTurnDuration || 30))
  const [debateTimeLeft, setDebateTimeLeft] = useState(effectiveDuration || 300)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [chargeA, setChargeA] = useState(0)
  const [chargeB, setChargeB] = useState(0)
  const [nameA, setNameA] = useState(effectiveRole === 'debater_a' ? effectiveUsername : '...')
  const [nameB, setNameB] = useState(effectiveRole === 'debater_b' ? effectiveUsername : '...')
  const [lastFallacy, setLastFallacy] = useState(null)
  const [lastFallacySpeaker, setLastFallacySpeaker] = useState(null)
  const [interjected, setInterjected] = useState(false)
  const [disconnectMsg, setDisconnectMsg] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localTopic,setLocalTopic] = useState(effectiveTopic || "")

  const isMyTurn = effectiveRole === currentTurn
  const myCharge = effectiveRole === 'debater_a' ? chargeA : chargeB
  const isCharged = myCharge >= 100

  // ── Socket event handlers ─────────────────────────────────────────────────
  const handleRoomState = useCallback((data) => {
    if(data.topic){
      setLocalTopic(data.topic)
    }
    // Sync state when joining an in-progress room
    setDebateTimeLeft(data.debateTimeLeft)
    setCurrentTurn(data.currentTurn)
    if (data.topic) {
      setCurrentTopic(data.topic)
    }
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
    if (data.topic) {
      setCurrentTopic(data.topic)
    }
    setNameA(data.players.debater_a)
    setNameB(data.players.debater_b)
    setCurrentTurn(data.currentTurn)
    if(data.topic){
      setLocalTopic(data.topic)
    }
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

  const handleTurnTick = useCallback(({ turnTimeLeft: t }) => {
    setTurnTimeLeft(t)
  }, [])

  const handleDebateTick = useCallback(({ debateTimeLeft: t }) => {
    setDebateTimeLeft(t)
  }, [])

  const handleInterjected = useCallback(({ by, charges }) => {
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

  // ── Register socket + join room ───────────────────────────────────────────
  const { emit } = useSocket(
    { roomId: effectiveRoomId, username: effectiveUsername, role: effectiveRole, topic: effectiveTopic, duration: effectiveDuration, turnDuration: localTurnDuration },
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

  const handleAdmitDefeat = () => {
    if (status !== 'active') return
    setShowConfirm(true)
  }

  const confirmDefeat = () => {
    setShowConfirm(false)
    emit('admit_defeat', {
      roomId: effectiveRoomId,
      role: effectiveRole,
      username: effectiveUsername
    })
  }

  const cancelDefeat = () => {
    setShowConfirm(false)
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (status === 'finished' && finalResult) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 font-mono-plex px-4">
        <div className="fixed inset-0 opacity-30 pointer-events-none"
             style={{
               backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
               backgroundSize: '60px 60px'
             }} />
        <span className="text-5xl relative z-10">🏛</span>
        <h1 className="font-cinzel text-3xl text-yellow-400 tracking-[0.2em] relative z-10">
          DEBATE CONCLUDED
        </h1>
        {finalResult.winner
          ? <p className="text-neutral-400 text-sm tracking-widest relative z-10">
              VICTOR: <span className="text-yellow-400 font-bold">{finalResult.winner}</span>
            </p>
          : <p className="text-neutral-500 text-sm tracking-widest relative z-10">A DRAW</p>
        }
        <div className="flex gap-8 relative z-10">
          <div className="text-center">
            <div className="font-cinzel text-3xl text-yellow-400">{finalResult.scores.debater_a}</div>
            <div className="text-[0.65rem] text-neutral-600 tracking-widest">{nameA}</div>
          </div>
          <div className="text-neutral-700 self-center font-cinzel">VS</div>
          <div className="text-center">
            <div className="font-cinzel text-3xl text-sky-400">{finalResult.scores.debater_b}</div>
            <div className="text-[0.65rem] text-neutral-600 tracking-widest">{nameB}</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="relative z-10 mt-4 px-6 py-2.5 border border-yellow-500/30
                     text-yellow-400 font-cinzel text-xs tracking-widest
                     hover:bg-yellow-400 hover:text-black transition-all cursor-pointer"
        >
          RETURN TO LOBBY
        </button>
      </div>
    )
  }

  // ── Waiting for opponent ──────────────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-5 font-mono-plex">
        <div className="fixed inset-0 opacity-30 pointer-events-none"
             style={{
               backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
               backgroundSize: '60px 60px'
             }} />
        <span className="text-4xl animate-pulse-eye relative z-10">👁</span>
        <h1 className="font-cinzel text-xl text-yellow-400 tracking-widest relative z-10">
          WAITING FOR OPPONENT
        </h1>
        <div className="relative z-10 flex items-center gap-3 border border-yellow-500/20
                        bg-yellow-400/5 px-6 py-3">
          <span className="font-cinzel text-2xl text-yellow-400 tracking-[0.3em]">{effectiveRoomId}</span>
          <button
            onClick={() => navigator.clipboard.writeText(effectiveRoomId)}
            className="text-[0.6rem] text-neutral-600 border border-neutral-800 px-2 py-1
                       hover:border-yellow-500/30 hover:text-yellow-500 transition-all cursor-pointer font-mono-plex"
          >
            COPY
          </button>
        </div>
        <p className="text-[0.7rem] text-neutral-600 tracking-widest relative z-10">
          Share the room code with your opponent
        </p>
        <div className="relative z-10 text-[0.65rem] text-neutral-700 max-w-xs text-center italic">
          "{localTopic || 'No topic set'}"
        </div>
      </div>
    )
  }

  // ── Main arena ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#080808] font-mono-plex flex flex-col overflow-hidden">
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="border border-red-500/30 bg-[#0a0a0a] px-8 py-6 text-center shadow-lg">
            <p className="text-red-400 font-cinzel tracking-widest mb-4">
              ADMIT DEFEAT?
            </p>
            <p className="text-neutral-500 text-sm mb-6">
              This will instantly end the debate.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmDefeat}
                className="px-5 py-2 border border-red-500 text-red-400
                           hover:bg-red-500 hover:text-black transition-all"
              >
                YES
              </button>
              <button
                onClick={cancelDefeat}
                className="px-5 py-2 border border-neutral-700 text-neutral-400
                           hover:border-white hover:text-white transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <FallacyBadge fallacy={lastFallacy} speaker={lastFallacySpeaker} />

      {/* Disconnect warning */}
      {disconnectMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 border border-red-500/30
                        bg-red-500/10 text-red-400 font-mono-plex text-xs tracking-wider px-4 py-2">
          ⚠ {disconnectMsg}
        </div>
      )}

      {/* Interject flash */}
      {interjected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="font-cinzel text-4xl text-red-400 tracking-[0.3em] animate-fade-up
                          border border-red-500/30 px-8 py-4 bg-red-500/10">
            ⚡ INTERJECTED!
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 text-sm animate-pulse-eye">👁</span>
          <span className="font-cinzel text-yellow-400 text-sm tracking-widest">ARGUS</span>
          <span className="text-neutral-700 text-xs">·</span>
          <span className="text-neutral-600 text-[0.65rem] tracking-wider">
            ROOM <span className="text-neutral-400">{effectiveRoomId}</span>
          </span>
        </div>
        <div className={`font-cinzel text-lg tracking-widest transition-colors
                         ${debateTimeLeft <= 30 ? 'text-red-400' : 'text-neutral-400'}`}>
          {formatTime(debateTimeLeft)}
        </div>
      </div>

      {/* Topic bar */}
      <div className="px-6 py-2 bg-[#0a0a0a] border-b border-neutral-800 shrink-0">
        <p className="text-[0.7rem] text-neutral-500 text-center truncate italic">
          "{localTopic || 'No topic set'}"
        </p>
      </div>

      {/* Score bar */}
      <ScoreBar
        scoreA={scoreA} scoreB={scoreB}
        nameA={nameA} nameB={nameB}
        currentTurn={currentTurn}
      />

      {/* Argument feed */}
      <ArgumentFeed arguments={args} nameA={nameA} nameB={nameB} />

      {/* Bottom controls */}
      <div className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-4 pt-3 pb-4">
        <div className="flex justify-between items-end mb-3 px-1">
          <InterjectionCharge
            charge={chargeA}
            onInterject={handleInterject}
            isMyTurn={isMyTurn}
            isCharged={effectiveRole === 'debater_a' && isCharged}
            side="debater_a"
          />
          <TurnTimer timeLeft={turnTimeLeft} isMyTurn={isMyTurn} turnDuration={localTurnDuration} />
          <InterjectionCharge
            charge={chargeB}
            onInterject={handleInterject}
            isMyTurn={isMyTurn}
            isCharged={effectiveRole === 'debater_b' && isCharged}
            side="debater_b"
          />
        </div>

        <div className='flex justify-center items-center mb-3 w-full'>
          <button
            onClick={handleAdmitDefeat}
            className="px-4 py-2 text-[0.65rem] tracking-widest font-cinzel
                       border border-red-500/30 text-red-400
                       hover:bg-red-500 hover:text-black transition-all"
          >
            ADMIT DEFEAT
          </button>
        </div>

        <div className={`flex gap-2 items-end border transition-all
                         ${isMyTurn
                           ? 'border-yellow-500/30 focus-within:border-yellow-400'
                           : 'border-neutral-800 opacity-50'}`}>
          <textarea
            className="flex-1 bg-transparent px-4 py-3 text-sm text-neutral-300 outline-none
                       resize-none placeholder-neutral-700 font-mono-plex caret-yellow-400 leading-relaxed"
            placeholder={isMyTurn ? 'State your argument...' : 'Waiting for opponent...'}
            rows={2}
            maxLength={500}
            value={inputText}
            disabled={!isMyTurn || isSubmitting}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!isMyTurn || !inputText.trim() || isSubmitting}
            className={`px-5 py-3 self-stretch font-cinzel text-xs tracking-widest
                        transition-all cursor-pointer border-l border-neutral-800
                        ${isMyTurn && inputText.trim() && !isSubmitting
                          ? 'text-yellow-400 hover:bg-yellow-400 hover:text-black'
                          : 'text-neutral-700 cursor-not-allowed'}`}
          >
            {isSubmitting ? '...' : 'ARGUE'}
          </button>
        </div>

        <div className="flex justify-between mt-1.5 px-1">
          <span className="text-[0.55rem] text-neutral-700">
            {isMyTurn ? 'ENTER to submit · SHIFT+ENTER for new line' : ''}
          </span>
          <span className="text-[0.55rem] text-neutral-700">{inputText.length}/500</span>
        </div>
      </div>
    </div>
  )
}

export default DebateArena