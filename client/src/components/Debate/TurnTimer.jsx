const TOTAL = 30
const R = 20
const CIRCUMFERENCE = 2 * Math.PI * R

const TurnTimer = ({ timeLeft, isMyTurn }) => {
  const progress = timeLeft / TOTAL
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const isUrgent = timeLeft <= 10

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          {/* Track */}
          <circle
            cx="24" cy="24" r={R}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx="24" cy="24" r={R}
            fill="none"
            stroke={isUrgent ? '#ef4444' : isMyTurn ? '#f5c842' : '#3b82f6'}
            strokeWidth="3"
            strokeLinecap="butt"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center
                          font-cinzel font-bold text-sm
                          ${isUrgent ? 'text-red-400' : isMyTurn ? 'text-yellow-400' : 'text-sky-400'}`}>
          {timeLeft}
        </span>
      </div>
      <span className="text-[0.55rem] tracking-widest text-neutral-600 uppercase">
        {isMyTurn ? 'YOUR TURN' : 'THEIR TURN'}
      </span>
    </div>
  )
}

export default TurnTimer