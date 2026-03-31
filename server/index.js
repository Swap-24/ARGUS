import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { connectDB } from './db/index.js'
import authRoutes from './routes/Auth.js'
import eloRoutes  from './routes/Elo.js'
import { registerDebateHandlers } from './socket/debateHandler.js'
import { setServers } from 'dns';
setServers(['8.8.8.8', '1.1.1.1']);

const app = express()
const server = http.createServer(app)

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all origins for LAN demo
  credentials: true,
}))
app.use(express.json())

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/elo',  eloRoutes)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, true), // allow all origins for LAN demo
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('[+] Connected:', socket.id)
  registerDebateHandlers(io, socket)

  socket.on('disconnect', () => {
    console.log('[-] Disconnected:', socket.id)
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

connectDB().then(() => {
  server.listen(PORT, () => console.log(`[server] listening on port ${PORT}`))
})