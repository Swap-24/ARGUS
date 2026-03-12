const ScoreBar = ({ scoreA, scoreB, nameA, nameB, currentTurn }) => {
  const total = scoreA + scoreB || 1
  const pctA = (scoreA / total) * 100

  return (
    <div className="w-full px-6 py-4 bg-neutral-950 border-b border-neutral-800">
      <div className="flex items-center justify-between mb-2">
        {/* Debater A */}
        <div className={`flex flex-col items-start transition-opacity
                         ${currentTurn === 'debater_a' ? 'opacity-100' : 'opacity-50'}`}>
          <span className="font-cinzel text-xs tracking-widest text-yellow-400">{nameA}</span>
          <span className="text-[0.65rem] text-neutral-600">DEBATER A</span>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3">
          <span className="font-cinzel text-2xl font-bold text-yellow-400">{scoreA}</span>
          <span className="text-neutral-700 text-xs">vs</span>
          <span className="font-cinzel text-2xl font-bold text-sky-400">{scoreB}</span>
        </div>

        {/* Debater B */}
        <div className={`flex flex-col items-end transition-opacity
                         ${currentTurn === 'debater_b' ? 'opacity-100' : 'opacity-50'}`}>
          <span className="font-cinzel text-xs tracking-widest text-sky-400">{nameB}</span>
          <span className="text-[0.65rem] text-neutral-600">DEBATER B</span>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-1.5 bg-neutral-800 flex overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-700 ease-in-out"
          style={{ width: `${pctA}%` }}
        />
        <div
          className="h-full bg-sky-400 transition-all duration-700 ease-in-out"
          style={{ width: `${100 - pctA}%` }}
        />
      </div>

      {/* Active turn indicator */}
      <div className="flex justify-between mt-1.5">
        <div className={`w-1.5 h-1.5 rounded-full transition-all
                         ${currentTurn === 'debater_a' ? 'bg-yellow-400 shadow-[0_0_6px_#f5c842]' : 'bg-transparent'}`} />
        <div className={`w-1.5 h-1.5 rounded-full transition-all
                         ${currentTurn === 'debater_b' ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-transparent'}`} />
      </div>
    </div>
  )
}

export default ScoreBar