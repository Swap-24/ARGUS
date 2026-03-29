import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import User   from '../models/User.js'

const JWT_SECRET  = process.env.JWT_SECRET  || 'change_this_secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || username.trim().length < 2)
      return res.status(400).json({ error: 'Username must be at least 2 characters' })
    if (!email || !email.includes('@'))
      return res.status(400).json({ error: 'Invalid email address' })
    if (!password || password.length < 4)
      return res.status(400).json({ error: 'Password must be at least 4 characters' })

    const existingEmail = await User.findOne({ email })
    if (existingEmail)
      return res.status(409).json({ error: 'Email already registered' })

    const existingUsername = await User.findOne({ username: username.trim() })
    if (existingUsername)
      return res.status(409).json({ error: 'Username already taken' })

    const hashed = await bcrypt.hash(password, 12)
    const user   = await User.create({ username: username.trim(), email, password: hashed })

    const token = signToken(user)
    return res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, elo: user.elo },
    })

  } catch (err) {
    console.error('[auth/register]', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' })

    const user = await User.findOne({ username: username.trim() })
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user)
    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, elo: user.elo },
    })

  } catch (err) {
    console.error('[auth/login]', err)
    return res.status(500).json({ error: 'Server error' })
  }
}