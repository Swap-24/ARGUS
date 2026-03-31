import { useNavigate } from 'react-router-dom'

const FinishedScreen = ({ finalResult, nameA, nameB }) => {
  const navigate = useNavigate()
  const elo = finalResult.eloUpdate

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center
                    gap-6 font-mono-plex px-4">
      <div className="fixed inset-0 opacity-30 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
             backgroundSize: '60px 60px'
           }} />
      <span className="text-5xl relative z-10">🏛</span>
      <h1 className="font-cinzel text-3xl text-yellow-400 tracking-[0.2em] relative z-10">
        DEBATE CONCLUDED
      </h1>
      {finalResult.reason && (
        <p className="text-neutral-600 text-[0.65rem] tracking-widest relative z-10 uppercase">
          {finalResult.reason}
        </p>
      )}
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

      {/* ── Elo Rating Changes ──────────────────────────────────────────────── */}
      {elo && (
        <div className="relative z-10 mt-2 border border-neutral-800 bg-neutral-950 px-8 py-5
                        animate-fade-up w-full max-w-md">
          <div className="text-[0.6rem] tracking-[0.3em] text-neutral-600 text-center mb-4 uppercase">
            Rating Changes
          </div>
          <div className="flex justify-between items-center gap-4">
            {/* Player A Elo */}
            <div className="flex-1 text-center">
              <div className="text-[0.65rem] text-neutral-500 tracking-widest mb-1">{elo.eloA.username}</div>
              <div className="font-cinzel text-2xl text-yellow-400">{elo.eloA.elo}</div>
              <div className={`text-sm font-bold tracking-wider mt-1 ${
                elo.eloA.change > 0 ? 'text-emerald-400' : elo.eloA.change < 0 ? 'text-red-400' : 'text-neutral-600'
              }`}>
                {elo.eloA.change > 0 ? `▲ +${elo.eloA.change}` : elo.eloA.change < 0 ? `▼ ${elo.eloA.change}` : '— 0'}
              </div>
            </div>

            <div className="text-neutral-800 text-xs">|</div>

            {/* Player B Elo */}
            <div className="flex-1 text-center">
              <div className="text-[0.65rem] text-neutral-500 tracking-widest mb-1">{elo.eloB.username}</div>
              <div className="font-cinzel text-2xl text-sky-400">{elo.eloB.elo}</div>
              <div className={`text-sm font-bold tracking-wider mt-1 ${
                elo.eloB.change > 0 ? 'text-emerald-400' : elo.eloB.change < 0 ? 'text-red-400' : 'text-neutral-600'
              }`}>
                {elo.eloB.change > 0 ? `▲ +${elo.eloB.change}` : elo.eloB.change < 0 ? `▼ ${elo.eloB.change}` : '— 0'}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default FinishedScreen