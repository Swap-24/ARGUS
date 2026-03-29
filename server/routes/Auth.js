import { Router } from 'express'
import { register, login } from '../controllers/Authcontroller.js'
import { protect } from '../middleware/Authmiddleware.js'
import User from '../models/User.js'

const router = Router()

// Public
router.post('/register', register)
router.post('/login',    login)

// Protected — GET /api/auth/me (useful for token re-hydration on page reload)
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('username email elo wins losses draws')
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: { id: user._id, username: user.username, email: user.email, elo: user.elo, wins: user.wins, losses: user.losses, draws: user.draws } })
})

export default router