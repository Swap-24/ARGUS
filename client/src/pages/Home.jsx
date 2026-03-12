import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebate } from '../context/DebateContext'

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

const DURATIONS = [          // ← add this block here
  { label: '3 MIN',  value: 180 },
  { label: '5 MIN',  value: 300 },
  { label: '10 MIN', value: 600 },
  { label: '15 MIN', value: 900 },
]


// ─── Username Gate ────────────────────────────────────────────────────────────
const UsernameGate = ({ onConfirm }) => {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)

  const handleConfirm = () => {
    if (input.trim().length < 2) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    onConfirm(input.trim())
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <span className="text-[0.65rem] tracking-[0.35em] text-neutral-600 uppercase">
        Identify Yourself
      </span>
      <div className={`flex items-center gap-3 border border-yellow-500/30 bg-neutral-900
                       px-5 py-3 w-full max-w-md focus-within:border-yellow-400
                       focus-within:shadow-[0_0_20px_#f5c84215] transition-all
                       ${shake ? 'animate-shake' : ''}`}>
        <span className="text-yellow-400 text-xs">▶</span>
        <input
          className="flex-1 bg-transparent border-none outline-none text-neutral-200
                     font-mono-plex text-base placeholder-neutral-600 caret-yellow-400"
          type="text"
          placeholder="Enter your name..."
          maxLength={20}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        <button
          onClick={handleConfirm}
          className="bg-yellow-400 text-black px-4 py-1.5 text-[0.7rem] tracking-widest
                     font-mono-plex font-medium hover:bg-white transition-colors cursor-pointer"
        >
          ENTER
        </button>
      </div>
    </div>
  )
}

// ─── Create Panel ─────────────────────────────────────────────────────────────
const CreatePanel = ({ username }) => {
  const [topicInput, setTopicInput] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(300)
  const [customMinutes, setCustomMinutes] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [copied, setCopied] = useState(false)
  const { setRoomId, setRole, setTopic, setUsername, setDuration } = useDebate()
  const navigate = useNavigate()
  

  const handleGenerate = () => {
    if (!topicInput.trim()) return
    setGeneratedCode(generateRoomCode())
    setCopied(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

 const handleStart = () => {
  if (!generatedCode || !topicInput.trim()) return
  const finalDuration = useCustom
    ? Math.max(60, Math.min(7200, parseInt(customMinutes) * 60)) // clamp 1min–2hrs
    : selectedDuration
  setUsername(username)
  setRoomId(generatedCode)
  setRole('debater_a')
  setTopic(topicInput.trim())
  setDuration(finalDuration)
  navigate(`/debate/${generatedCode}`)
}

  


  return (
    <div className="flex-1 bg-neutral-950 border border-neutral-800 p-8
                    hover:bg-[#0d0d0d] hover:border-yellow-500/30 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7 pb-4 border-b border-yellow-500/20">
        <span className="text-lg">⚔</span>
        <span className="font-cinzel text-[0.8rem] tracking-[0.25em] text-yellow-400">
          CREATE ROOM
        </span>
      </div>

      {/* Topic */}
      <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
        Debate Topic
      </label>
      <textarea
        className="w-full bg-[#0a0a0a] border border-neutral-800 text-neutral-300
                   font-mono-plex text-sm p-3 resize-none outline-none
                   focus:border-yellow-500/40 caret-yellow-400 transition-colors
                   placeholder-neutral-700"
        placeholder="e.g. AI will cause more harm than good to society..."
        rows={3}
        maxLength={200}
        value={topicInput}
        onChange={e => setTopicInput(e.target.value)}
      />
      <div className="text-right text-[0.6rem] text-neutral-700 mt-1 mb-5">
        {topicInput.length}/200
      </div>

      {/* Duration picker */}
      <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
  Debate Duration
</label>
<div className="flex gap-2 mb-2">
  {DURATIONS.map(opt => (
    <button
      key={opt.value}
      onClick={() => { setSelectedDuration(opt.value); setUseCustom(false) }}
      className={`flex-1 py-2 border font-mono-plex text-[0.65rem] tracking-wider
                  transition-all cursor-pointer
                  ${!useCustom && selectedDuration === opt.value
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                    : 'border-neutral-800 text-neutral-600 hover:border-yellow-500/30 hover:text-yellow-500'}`}
    >
      {opt.label}
    </button>
  ))}
  <button
    onClick={() => setUseCustom(true)}
    className={`flex-1 py-2 border font-mono-plex text-[0.65rem] tracking-wider
                transition-all cursor-pointer
                ${useCustom
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-neutral-800 text-neutral-600 hover:border-yellow-500/30 hover:text-yellow-500'}`}
  >
    CUSTOM
  </button>
</div>

{/* Custom input — slides in when CUSTOM is selected */}
{useCustom && (
  <div className="flex items-center gap-3 mb-5 border border-yellow-500/20
                  bg-yellow-400/5 px-4 py-2.5 animate-fade-up">
    <input
      type="number"
      min={1}
      max={120}
      value={customMinutes}
      onChange={e => setCustomMinutes(e.target.value)}
      placeholder="30"
      className="w-16 bg-transparent outline-none text-yellow-400 font-cinzel
                 text-lg text-center caret-yellow-400 placeholder-neutral-700
                 [appearance:textfield]"
    />
    <span className="text-[0.65rem] tracking-widest text-neutral-600">MINUTES</span>
    {customMinutes && (
      <span className="ml-auto text-[0.6rem] text-neutral-600">
        = {Math.floor(customMinutes / 60) > 0 ? `${Math.floor(customMinutes / 60)}h ` : ''}
        {customMinutes % 60 > 0 ? `${customMinutes % 60}m` : ''}
      </span>
    )}
  </div>
)}
{!useCustom && <div className="mb-5" />}

      <button
        onClick={handleGenerate}
        disabled={!topicInput.trim()}
        className={`w-full py-3 border font-mono-plex text-[0.75rem] tracking-widest
                    transition-all cursor-pointer
                    ${topicInput.trim()
                      ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_30px_#f5c84230]'
                      : 'border-neutral-800 text-neutral-700 cursor-not-allowed'}`}
      >
        GENERATE ROOM CODE
      </button>

      {/* Generated code */}
      {generatedCode && (
        <div className="mt-5 p-4 border border-yellow-500/25 bg-yellow-400/5 animate-fade-up">
          <div className="text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
            Your Room Code
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-cinzel text-3xl font-bold text-yellow-400 tracking-[0.3em]">
              {generatedCode}
            </span>
            <button
              onClick={handleCopy}
              className="border border-yellow-500/25 text-neutral-500 font-mono-plex
                         text-[0.6rem] tracking-wider px-3 py-1.5
                         hover:border-yellow-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <div className="text-[0.6rem] text-neutral-700 mb-4">
            Share this code with your opponent
          </div>
          <button
            onClick={handleStart}
            className="w-full py-3 bg-yellow-400 text-black font-mono-plex text-[0.75rem]
                       font-medium tracking-widest hover:bg-white
                       hover:shadow-[0_0_30px_#f5c84250] transition-all cursor-pointer"
          >
            START AS DEBATER A →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Join Panel ───────────────────────────────────────────────────────────────
const JoinPanel = ({ username }) => {
  const [code, setCode] = useState('')
  const [selectedRole, setSelectedRole] = useState('debater_b')
  const [error, setError] = useState('')
  const { setRoomId, setRole, setUsername } = useDebate()
  const navigate = useNavigate()

  const handleJoin = () => {
    if (code.trim().length !== 6) {
      setError('Room code must be 6 characters')
      return
    }
    setUsername(username)
    setRoomId(code.toUpperCase())
    setRole(selectedRole)
    navigate(`/debate/${code.toUpperCase()}`)
  }

  return (
    <div className="flex-1 bg-neutral-950 border border-neutral-800 p-8
                    hover:bg-[#0d0d0d] hover:border-sky-500/25 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7 pb-4 border-b border-sky-500/20">
        <span className="text-lg">🛡</span>
        <span className="font-cinzel text-[0.8rem] tracking-[0.25em] text-sky-400">
          JOIN ROOM
        </span>
      </div>

      {/* Code input */}
      <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
        Room Code
      </label>
      <input
        className="w-full bg-[#0a0a0a] border border-neutral-800 text-sky-300
                   font-cinzel text-2xl tracking-[0.5em] text-center py-3
                   outline-none focus:border-sky-500/40 caret-sky-400
                   transition-colors placeholder-neutral-800 uppercase"
        type="text"
        placeholder="XXXXXX"
        maxLength={6}
        value={code}
        onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
        onKeyDown={e => e.key === 'Enter' && handleJoin()}
      />
      {error && (
        <div className="text-[0.7rem] text-red-500 mt-2 tracking-wide">{error}</div>
      )}

      {/* Role selector */}
      <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mt-6 mb-2 uppercase">
        Join As
      </label>
      <div className="flex gap-2">
        {[
          { id: 'debater_b', label: '⚔ DEBATER B' },
          { id: 'spectator', label: '👁 SPECTATOR' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id)}
            className={`flex-1 py-2.5 border font-mono-plex text-[0.7rem] tracking-wider
                        transition-all cursor-pointer
                        ${selectedRole === r.id
                          ? 'border-sky-400 text-sky-400 bg-sky-400/10'
                          : 'border-neutral-800 text-neutral-600 hover:border-sky-500/40 hover:text-sky-500'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleJoin}
        disabled={!code.trim()}
        className={`w-full py-3 mt-8 border font-mono-plex text-[0.75rem] tracking-widest
                    transition-all cursor-pointer
                    ${code.trim()
                      ? 'border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black hover:shadow-[0_0_30px_#5bb8f520]'
                      : 'border-neutral-800 text-neutral-700 cursor-not-allowed'}`}
      >
        JOIN ROOM →
      </button>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const [username, setUsername] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="min-h-screen bg-[#080808] font-mono-plex text-neutral-200
                    flex flex-col items-center relative overflow-hidden px-4 pb-16">

      {/* Background grid */}
      <div className="fixed inset-0 opacity-40 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
             backgroundSize: '60px 60px'
           }} />

      {/* Gold glow */}
      <div className="fixed -top-50 left-1/2 -translate-x-1/2 w-150 h-150
                      rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, #f5c84210 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="relative z-10 text-center mt-12 mb-12">
        <span className="block text-4xl mb-2 animate-pulse-eye">👁</span>
        <h1 className="font-cinzel font-black text-yellow-400 tracking-[0.3em] text-6xl leading-none"
            style={{ textShadow: '0 0 60px #f5c84240' }}>
          ARGUS
        </h1>
        <p className="text-[0.65rem] tracking-[0.4em] text-neutral-600 mt-3 uppercase">
          The All-Seeing Debate Arena
        </p>
      </header>

      {/* Main */}
      <main className="relative z-10 w-full max-w-3xl">
        {!confirmed ? (
          <UsernameGate onConfirm={name => { setUsername(name); setConfirmed(true) }} />
        ) : (
          <div className="animate-fade-up">
            <p className="text-center text-[0.75rem] tracking-[0.15em] text-neutral-500 mb-8">
              Welcome, <span className="text-yellow-400 font-medium">{username}</span>. Choose your path.
            </p>
            <div className="flex items-stretch">
              <CreatePanel username={username} />
              <div className="flex flex-col items-center justify-center gap-3 px-5">
                <div className="w-px flex-1 bg-neutral-800" />
                <span className="text-[0.6rem] tracking-[0.2em] text-neutral-700">OR</span>
                <div className="w-px flex-1 bg-neutral-800" />
              </div>
              <JoinPanel username={username} />
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 mt-16 text-[0.6rem] tracking-[0.2em] text-neutral-700 text-center">
        ARGUS v0.1 · Where arguments are weighed, not won by volume
      </footer>
    </div>
  )
}

export default Home