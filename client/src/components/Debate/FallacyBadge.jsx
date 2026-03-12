import { useEffect, useState } from 'react'

const FALLACY_MAP = {
  ad_hominem:        { label: 'Ad Hominem',         icon: '🗡', color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  straw_man:         { label: 'Straw Man',           icon: '🌾', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  appeal_to_authority: { label: 'Appeal to Authority', icon: '👑', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  false_dichotomy:   { label: 'False Dichotomy',    icon: '⚖',  color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
  slippery_slope:    { label: 'Slippery Slope',     icon: '📉', color: 'text-pink-400 border-pink-500/40 bg-pink-500/10' },
}

const FallacyBadge = ({ fallacy, speaker }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!fallacy) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [fallacy])

  if (!fallacy || !visible) return null

  const info = FALLACY_MAP[fallacy] || { label: fallacy, icon: '⚠', color: 'text-neutral-400 border-neutral-500/40 bg-neutral-500/10' }

  return (
    <div className={`fixed top-24 ${speaker === 'debater_a' ? 'left-6' : 'right-6'}
                     z-50 animate-fade-up`}>
      <div className={`border px-4 py-3 flex flex-col gap-1 min-w-40 ${info.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{info.icon}</span>
          <span className="font-cinzel text-[0.7rem] tracking-widest">FALLACY</span>
        </div>
        <span className="font-mono-plex text-xs opacity-90">{info.label}</span>
      </div>
    </div>
  )
}

export default FallacyBadge