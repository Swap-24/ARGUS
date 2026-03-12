import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerDebateHandlers } from './socket/debateHandler.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.json({ status: 'Argus server running' }))

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`)
  registerDebateHandlers(io, socket)
  socket.on('disconnect', () => console.log(`[-] Disconnected: ${socket.id}`))
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Argus server running on port ${PORT}`))