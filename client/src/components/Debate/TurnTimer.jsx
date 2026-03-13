const CIRCUMFERENCE = 2 * Math.PI * 20

const TurnTimer = ({ timeLeft, isMyTurn, turnDuration }) => {
  const infinite = timeLeft === -1 || turnDuration === 0
  const progress = infinite ? 1 : timeLeft / (turnDuration || 30)
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const isUrgent = !infinite && timeLeft <= 10

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#1a1a1a" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={isUrgent ? '#ef4444' : isMyTurn ? '#f5c842' : '#3b82f6'}
            strokeWidth="3"
            strokeLinecap="butt"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={infinite ? 0 : dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center
                          font-cinzel font-bold text-sm
                          ${isUrgent ? 'text-red-400' : isMyTurn ? 'text-yellow-400' : 'text-sky-400'}`}>
          {infinite ? '∞' : timeLeft}
        </span>
      </div>
      <span className="text-[0.55rem] tracking-widest text-neutral-600 uppercase">
        {isMyTurn ? 'YOUR TURN' : 'THEIR TURN'}
      </span>
    </div>
  )
}

export default TurnTimer