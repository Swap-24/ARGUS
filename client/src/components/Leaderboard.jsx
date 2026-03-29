import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const RANK_TIERS = [
  { min: 2000, label: 'GRANDMASTER', color: '#f59e0b', glow: '#f59e0b40' },
  { min: 1800, label: 'MASTER',      color: '#a855f7', glow: '#a855f740' },
  { min: 1600, label: 'DIAMOND',     color: '#38bdf8', glow: '#38bdf840' },
  { min: 1400, label: 'PLATINUM',    color: '#2dd4bf', glow: '#2dd4bf40' },
  { min: 1200, label: 'GOLD',        color: '#fbbf24', glow: '#fbbf2440' },
  { min: 1000, label: 'SILVER',      color: '#94a3b8', glow: '#94a3b840' },
  { min: 0,    label: 'BRONZE',      color: '#b45309', glow: '#b4530940' },
]

const getTier = (elo) => RANK_TIERS.find(t => elo >= t.min) || RANK_TIERS[RANK_TIERS.length - 1]

const RANK_BADGES = ['👑', '⚔️', '🛡️']

const Leaderboard = ({ currentUsername }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API}/api/elo/leaderboard`)
        const data = await res.json()
        if (res.ok) {
          setLeaderboard(data.leaderboard)
        } else {
          setError(data.error || 'Failed to fetch')
        }
      } catch {
        setError('Could not connect to server')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-10 border border-neutral-800 bg-neutral-950 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏆</span>
          <span className="font-cinzel text-[0.8rem] tracking-[0.25em] text-yellow-400">
            LEADERBOARD
          </span>
        </div>
        <span className="text-[0.55rem] tracking-[0.3em] text-neutral-700 uppercase">
          Top Debaters
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[60px_1fr_100px_80px_80px_80px] px-6 py-2.5
                      border-b border-neutral-800/60 text-[0.55rem] tracking-[0.3em]
                      text-neutral-700 uppercase">
        <span>Rank</span>
        <span>Debater</span>
        <span className="text-center">Tier</span>
        <span className="text-center">Rating</span>
        <span className="text-center">W/L/D</span>
        <span className="text-center">Win %</span>
      </div>

      {/* Body */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-neutral-600">
              <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              <span className="text-[0.65rem] tracking-widest">LOADING RANKINGS...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500/70 text-[0.65rem] tracking-wider">
            ⚠ {error}
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="text-center py-12 text-neutral-700 text-[0.65rem] tracking-wider">
            No players ranked yet. Be the first!
          </div>
        )}

        {!loading && !error && leaderboard.map((player, i) => {
          const tier = getTier(player.elo)
          const totalGames = player.wins + player.losses + player.draws
          const winRate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0
          const isMe = player.username === currentUsername

          return (
            <div
              key={player._id || player.username}
              className={`grid grid-cols-[60px_1fr_100px_80px_80px_80px] px-6 py-3
                         border-b border-neutral-800/30 items-center transition-all
                         hover:bg-neutral-900/80
                         ${isMe ? 'bg-yellow-400/5 border-l-2 border-l-yellow-400/40' : ''}
                         ${i < 3 ? 'bg-neutral-900/30' : ''}`}
            >
              {/* Rank */}
              <div className="flex items-center gap-1.5">
                {i < 3 ? (
                  <span className="text-base">{RANK_BADGES[i]}</span>
                ) : (
                  <span className="text-[0.75rem] text-neutral-600 font-cinzel font-bold w-6 text-center">
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Username */}
              <div className="flex items-center gap-2">
                <span className={`text-sm tracking-wide ${
                  isMe ? 'text-yellow-400 font-medium' : 'text-neutral-300'
                }`}>
                  {player.username}
                </span>
                {isMe && (
                  <span className="text-[0.5rem] tracking-[0.2em] text-yellow-400/60 border border-yellow-400/20
                                   px-1.5 py-0.5 uppercase">
                    YOU
                  </span>
                )}
              </div>

              {/* Tier */}
              <div className="flex items-center justify-center">
                <span
                  className="text-[0.55rem] tracking-[0.15em] font-bold px-2 py-0.5 border"
                  style={{
                    color: tier.color,
                    borderColor: tier.color + '40',
                    backgroundColor: tier.color + '10',
                    textShadow: `0 0 10px ${tier.glow}`,
                  }}
                >
                  {tier.label}
                </span>
              </div>

              {/* Elo Rating */}
              <div className="text-center">
                <span
                  className="font-cinzel text-base font-bold"
                  style={{ color: tier.color }}
                >
                  {player.elo}
                </span>
              </div>

              {/* W/L/D */}
              <div className="text-center text-[0.65rem] tracking-wide">
                <span className="text-emerald-400">{player.wins}</span>
                <span className="text-neutral-700">/</span>
                <span className="text-red-400">{player.losses}</span>
                <span className="text-neutral-700">/</span>
                <span className="text-neutral-500">{player.draws}</span>
              </div>

              {/* Win Rate */}
              <div className="text-center">
                <span className={`text-[0.7rem] font-bold ${
                  winRate >= 60 ? 'text-emerald-400' :
                  winRate >= 40 ? 'text-neutral-400' :
                  'text-red-400'
                }`}>
                  {totalGames > 0 ? `${winRate}%` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!loading && leaderboard.length > 0 && (
        <div className="px-6 py-2.5 border-t border-neutral-800/60 text-[0.5rem]
                        tracking-[0.2em] text-neutral-700 text-center uppercase">
          Ratings update after each debate · K-Factor: 32
        </div>
      )}
    </div>
  )
}

export default Leaderboard
