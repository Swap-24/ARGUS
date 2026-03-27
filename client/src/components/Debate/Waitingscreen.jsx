const WaitingScreen = ({ roomId, topic }) => (
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
      <span className="font-cinzel text-2xl text-yellow-400 tracking-[0.3em]">{roomId}</span>
      <button
        onClick={() => navigator.clipboard.writeText(roomId)}
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
      "{topic || 'No topic set'}"
    </div>
  </div>
)

export default WaitingScreen