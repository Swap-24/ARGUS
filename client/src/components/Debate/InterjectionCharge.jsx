const InterjectionCharge = ({ charge, onInterject, isMyTurn, isCharged, side }) => {
  const isA = side === 'debater_a'
  const color = isA ? 'bg-yellow-400' : 'bg-sky-400'
  const borderColor = isA ? 'border-yellow-500/30' : 'border-sky-500/30'
  const textColor = isA ? 'text-yellow-400' : 'text-sky-400'
  const glowColor = isA ? 'shadow-[0_0_20px_#f5c84250]' : 'shadow-[0_0_20px_#38bdf850]'

  const segments = 3
  const filledSegments = Math.floor((charge / 100) * segments)

  return (
    <div className={`flex flex-col gap-1.5 ${isA ? 'items-start' : 'items-end'}`}>
      <span className="text-[0.55rem] tracking-[0.3em] text-neutral-600 uppercase">
        Interject
      </span>

      {/* Segmented charge bar */}
      <div className={`flex gap-0.5 ${isA ? 'flex-row' : 'flex-row-reverse'}`}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-6 border transition-all duration-300
                         ${i < filledSegments
                           ? `${color} border-transparent ${i === filledSegments - 1 && isCharged ? glowColor : ''}`
                           : `bg-neutral-900 ${borderColor}`}`}
          />
        ))}
      </div>

      {/* Button - only lights up when charged and it's NOT your turn */}
      <button
        onClick={onInterject}
        disabled={!isCharged || isMyTurn}
        className={`px-3 py-1 border font-cinzel text-[0.65rem] tracking-widest
                    transition-all cursor-pointer
                    ${isCharged && !isMyTurn
                      ? `${textColor} ${borderColor} hover:bg-yellow-400/10 ${glowColor} animate-pulse-eye`
                      : 'text-neutral-700 border-neutral-800 cursor-not-allowed opacity-40'}`}
      >
        ⚡ INTERJECT
      </button>
    </div>
  )
}

export default InterjectionCharge