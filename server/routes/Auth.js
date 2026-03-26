import { Router } from 'express'
import { register, login } from '../controllers/Authcontroller.js'
import { protect } from '../middleware/Authmiddleware.js'

const router = Router()

// Public
router.post('/register', register)
router.post('/login',    login)

// Protected — GET /api/auth/me (useful for token re-hydration on page reload)
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

export default router