import { Router } from 'express'
import { protect } from '../middleware/Authmiddleware.js'
import { getLeaderboard, getUserEloProfile } from '../services/eloService.js'

const router = Router()

// GET /api/elo/leaderboard — public leaderboard (top 50)
router.get('/leaderboard', async (_req, res) => {
  try {
    const leaderboard = await getLeaderboard(50)
    return res.json({ leaderboard })
  } catch (err) {
    console.error('[elo/leaderboard]', err)
    return res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// GET /api/elo/profile/:username — any user's Elo profile
router.get('/profile/:username', async (req, res) => {
  try {
    const profile = await getUserEloProfile(req.params.username)
    if (!profile) return res.status(404).json({ error: 'User not found' })
    return res.json({ profile })
  } catch (err) {
    console.error('[elo/profile]', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// GET /api/elo/me — current user's Elo profile (protected)
router.get('/me', protect, async (req, res) => {
  try {
    const profile = await getUserEloProfile(req.user.username)
    if (!profile) return res.status(404).json({ error: 'User not found' })
    return res.json({ profile })
  } catch (err) {
    console.error('[elo/me]', err)
    return res.status(500).json({ error: 'Failed to fetch Elo profile' })
  }
})

export default router
