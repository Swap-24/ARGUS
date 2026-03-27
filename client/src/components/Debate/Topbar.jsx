const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const TopBar = ({ roomId, topic, debateTimeLeft, onAdmitDefeat }) => (
  <>
    <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-yellow-400 text-sm animate-pulse-eye">👁</span>
        <span className="font-cinzel text-yellow-400 text-sm tracking-widest">ARGUS</span>
        <span className="text-neutral-700 text-xs">·</span>
        <span className="text-neutral-600 text-[0.65rem] tracking-wider">
          ROOM <span className="text-neutral-400">{roomId}</span>
        </span>
      </div>
      <div className={`font-cinzel text-lg tracking-widest transition-colors mr-1.5
                       ${debateTimeLeft <= 30 ? 'text-red-400' : 'text-neutral-400'}`}>
        {formatTime(debateTimeLeft)}
      </div>
      <button
        onClick={onAdmitDefeat}
        className="text-[0.6rem] tracking-widest font-cinzel border border-red-500/20
                   text-red-500/50 px-3 py-1.5 hover:border-red-500 hover:text-red-400
                   transition-all cursor-pointer"
      >
        ADMIT DEFEAT
      </button>
    </div>
    <div className="px-6 py-2 bg-[#0a0a0a] border-b border-neutral-800 shrink-0">
      <p className="text-[0.7rem] text-neutral-500 text-center truncate italic">
        "{topic || 'No topic set'}"
      </p>
    </div>
  </>
)

export default TopBar