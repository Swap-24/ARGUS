import { useEffect, useRef } from 'react'

const ScorePill = ({ score }) => {
  const color = score >= 75 ? 'text-green-400 border-green-500/30'
              : score >= 50 ? 'text-yellow-400 border-yellow-500/30'
              : 'text-red-400 border-red-500/30'
  return (
    <span className={`border font-cinzel text-xs px-2 py-0.5 ${color}`}>
      {score}
    </span>
  )
}

const ArgumentFeed = ({ arguments: args, nameA, nameB }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [args])

  if (args.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-700">
        <span className="text-4xl opacity-30">👁</span>
        <span className="font-cinzel text-xs tracking-widest">AWAITING FIRST ARGUMENT</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
      {args.map((arg, i) => {
        const isA = arg.speaker === 'debater_a'
        return (
          <div
            key={i}
            className={`flex flex-col gap-1.5 animate-fade-up
                         ${isA ? 'items-start' : 'items-end'}`}
          >
            {/* Speaker label */}
            <div className={`flex items-center gap-2 text-[0.6rem] tracking-widest
                             ${isA ? 'text-yellow-500/60' : 'text-sky-500/60'}`}>
              <span>{isA ? nameA : nameB}</span>
              {arg.round && <span className="text-neutral-700">· R{arg.round}</span>}
            </div>

            {/* Argument bubble */}
            <div className={`max-w-[80%] px-4 py-3 border font-mono-plex text-sm
                             leading-relaxed text-neutral-300
                             ${isA
                               ? 'border-yellow-500/20 bg-yellow-400/5 rounded-tr-lg'
                               : 'border-sky-500/20 bg-sky-400/5 rounded-tl-lg'}`}>
              {arg.text}
            </div>

            {/* Score row — only shown if scored */}
            {arg.finalScore !== undefined && (
              <div className="flex items-center gap-2 flex-wrap">
                <ScorePill score={arg.finalScore} />
                {arg.fallacies?.length > 0 && (
                  <span className="text-[0.6rem] text-red-400/70 border border-red-500/20 px-2 py-0.5">
                    ⚠ {arg.fallacies[0].replace(/_/g, ' ')}
                  </span>
                )}
                {arg.feedback && (
                  <span className="text-[0.6rem] text-neutral-600 italic">
                    "{arg.feedback}"
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default ArgumentFeed