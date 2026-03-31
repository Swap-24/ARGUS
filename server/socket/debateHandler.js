/**
 * debateHandler.js
 * Handles all Socket.io events for debate rooms.
 * The server is authoritative — it owns all timers and game state.
 */

import axios from 'axios'
import {
  createRoom,
  getRoom,
  deleteRoom,
  getRoomBySocket,
} from './roomManager.js'
import { updateEloAfterDebate } from '../services/eloService.js'

const TURN_DURATION = 30
const CHARGE_PER_GOOD_ARG = 34
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000'

// ── ML scorer ────────────────────────────────────────────────────────────────
const scoreArgument = async (text, topic, history) => {
  try {
    const res = await axios.post(`${ML_ENGINE_URL}/analyze`, {
      argument_text: text,
      topic,
      debate_history: history,
      speaker: 'user',
    }, { timeout: 15000 })
    return res.data
  } catch {
    // Fallback mock if FastAPI isn't running yet
    const wordCount = text.trim().split(/\s+/).length
    const base = Math.min(40 + wordCount * 2.5, 95)
    const score = Math.round(base + (Math.random() * 10 - 5))
    const fallacyPool = ['ad_hominem', 'straw_man', 'appeal_to_authority', 'false_dichotomy']
    const fallacies = Math.random() < 0.25 ? [fallacyPool[Math.floor(Math.random() * 4)]] : []
    return {
      final_score: Math.max(20, Math.min(100, score)),
      fallacies_detected: fallacies,
      feedback: score > 70 ? 'Strong argument.' : 'Needs more evidence.',
      scores: { sentiment: 0.7, argument_strength: score / 100, relevance: 0.8 },
    }
  }
}

// ── Timer helpers ─────────────────────────────────────────────────────────────
const startDebateTimer = (io, room) => {
  clearInterval(room.debateTimer)
  room.debateTimer = setInterval(() => {
    room.debateTimeLeft -= 1
    io.to(room.roomId).emit('debate_tick', { debateTimeLeft: room.debateTimeLeft })
    if (room.debateTimeLeft <= 0) endDebate(io, room)
  }, 1000)
}

const startTurnTimer = (io, room) => {
  console.log('startTurnTimer called, room.turnDuration:', room.turnDuration)

  clearInterval(room.turnTimer)

  // 0 = infinite turn — no countdown, turn only ends on submit or interject
  if (room.turnDuration === 0) {
    room.turnTimeLeft = -1
    io.to(room.roomId).emit('turn_tick', { turnTimeLeft: -1 })
    return
  }

  room.turnTimeLeft = room.turnDuration
  room.turnTimer = setInterval(() => {
    room.turnTimeLeft -= 1
    io.to(room.roomId).emit('turn_tick', { turnTimeLeft: room.turnTimeLeft })
    if (room.turnTimeLeft <= 0) advanceTurn(io, room)
  }, 1000)
}

const advanceTurn = (io, room) => {
  clearInterval(room.turnTimer) // ✅ CRITICAL FIX

  room.currentTurn =
    room.currentTurn === 'debater_a'
      ? 'debater_b'
      : 'debater_a'

  io.to(room.roomId).emit('turn_changed', {
    currentTurn: room.currentTurn
  })

  startTurnTimer(io, room)
}

const endDebate = async (io, room) => {
  clearInterval(room.debateTimer)
  clearInterval(room.turnTimer)
  room.status = 'finished'

  // Guard against duplicate Elo updates
  if (room.eloProcessed) return
  room.eloProcessed = true

  const { debater_a, debater_b } = room.scores
  const winner = debater_a > debater_b
    ? room.players.debater_a?.username
    : debater_b > debater_a
      ? room.players.debater_b?.username
      : null

  // Determine outcome for Elo
  const outcome = debater_a > debater_b ? 'a'
                : debater_b > debater_a ? 'b'
                : 'draw'

  const usernameA = room.players.debater_a?.username
  const usernameB = room.players.debater_b?.username

  let eloUpdate = null
  if (usernameA && usernameB) {
    eloUpdate = await updateEloAfterDebate(usernameA, usernameB, outcome, room.topic)
  }

  io.to(room.roomId).emit('debate_ended', {
    scores: room.scores,
    winner,
    args: room.args,
    eloUpdate,
  })
}

// ── Main handler export ───────────────────────────────────────────────────────
export const registerDebateHandlers = (io, socket) => {

  // ── join_debate ─────────────────────────────────────────────────────────────
  socket.on('join_debate', ({ roomId, username, role, topic, duration, turnDuration }) => {
    socket.join(roomId)
    let room = getRoom(roomId)

    // Room creator (debater_a) always initializes the room
    if (!room && role === 'debater_a') {
      room = createRoom(roomId, { topic, duration, turnDuration })
      console.log('Room created with turnDuration:', room.turnDuration)
    }

    if (!room) {
      socket.emit('error', { message: 'Room not found. Have the creator join first.' })
      return
    }

    // Assign player
    if (role === 'debater_a' || role === 'debater_b') {
      room.players[role] = { socketId: socket.id, username }
    } else {
      room.spectators.push(socket.id)
    }

    // Send current state to joining player
    socket.emit('room_state', {
      topic: room.topic,
      duration: room.duration,
      turnDuration: room.turnDuration,
      debateTimeLeft: room.debateTimeLeft,
      currentTurn: room.currentTurn,
      scores: room.scores,
      charges: room.charges,
      args: room.args,
      status: room.status,
      players: {
        debater_a: room.players.debater_a?.username || null,
        debater_b: room.players.debater_b?.username || null,
      },
    })

    // Notify others
    socket.to(roomId).emit('player_joined', { username, role })

    // Start when both debaters present
    if (room.players.debater_a && room.players.debater_b && room.status === 'waiting') {
      room.status = 'active'
      io.to(roomId).emit('debate_start', {
        players: {
          debater_a: room.players.debater_a.username,
          debater_b: room.players.debater_b.username,
        },
        topic: room.topic,
        duration: room.duration,
        turnDuration: room.turnDuration,
        currentTurn: room.currentTurn,
      })
      startDebateTimer(io, room)
      startTurnTimer(io, room)
    }
  })

  // ── submit_argument ─────────────────────────────────────────────────────────
  socket.on('submit_argument', async ({ roomId, text, speaker }) => {
    const room = getRoom(roomId)
    if (!room || room.status !== 'active') return
    if (room.currentTurn !== speaker) return

    // ⏸ Pause debate timer while ML scores
    clearInterval(room.debateTimer)
    io.to(roomId).emit('debate_paused', { reason: 'scoring' })

    // 🔥 SWITCH TURN IMMEDIATELY — don't wait for ML scoring
    advanceTurn(io, room)

    // 🔥 Score in the background — results arrive async via 'argument_scored'
    const history = room.args.map(a => a.text)
    scoreArgument(text, room.topic, history).then((result) => {
      console.log('ML RESULT:', JSON.stringify(result, null, 2))

      const newArg = {
        text,
        speaker,
        finalScore: result.final_score,
        fallacies: result.fallacies_detected,
        feedback: result.feedback,
        scores: result.scores,
      }

      room.args.push(newArg)
      room.scores[speaker] += result.final_score

      if (result.final_score >= 70) {
        room.charges[speaker] = Math.min(100, room.charges[speaker] + CHARGE_PER_GOOD_ARG)
      }

      io.to(roomId).emit('argument_scored', {
        arg: newArg,
        scores: room.scores,
        charges: room.charges,
      })

      // ▶ Resume debate timer now that scoring is done
      if (room.status === 'active') {
        startDebateTimer(io, room)
        io.to(roomId).emit('debate_resumed')
      }
    }).catch((err) => {
      console.error('ML scoring failed:', err.message)
      // Resume timer even on error so the game doesn't freeze
      if (room.status === 'active') {
        startDebateTimer(io, room)
        io.to(roomId).emit('debate_resumed')
      }
    })
  })

  // ── interject ───────────────────────────────────────────────────────────────
  socket.on('interject', ({ roomId, role }) => {
    const room = getRoom(roomId)
    if (!room || room.status !== 'active') return
    if (room.currentTurn === role) return
    if (room.charges[role] < 100) return

    room.charges[role] = 0
    clearInterval(room.turnTimer)

    io.to(room.roomId).emit('interject_used', { by: role, charges: room.charges })

    setTimeout(() => {
      room.currentTurn = role
      io.to(room.roomId).emit('turn_changed', { currentTurn: room.currentTurn })
      startTurnTimer(io, room)
    }, 1200)
  })

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const found = getRoomBySocket(socket.id)
    if (!found) return
    const { room, role } = found

    if (role === 'spectator') {
      room.spectators = room.spectators.filter(id => id !== socket.id)
      return
    }

    clearInterval(room.debateTimer)
    clearInterval(room.turnTimer)
    const username = room.players[role]?.username
    io.to(room.roomId).emit('opponent_disconnected', { username, role })

    // Kill room after 30s if they don't reconnect
    setTimeout(() => {
      const currentRoom = getRoom(room.roomId)
      if (currentRoom && currentRoom.players[role]?.socketId === socket.id) {
        deleteRoom(room.roomId)
      }
    }, 30000)
  })

  // ── admit_defeat ────────────────────────────────────────────────────────────
  socket.on('admit_defeat', async ({ roomId, role, username }) => {
    const room = getRoom(roomId)
    if (!room || room.status !== 'active') return

    clearInterval(room.debateTimer)
    clearInterval(room.turnTimer)

    room.status = 'finished'

    // Guard against duplicate Elo updates
    if (room.eloProcessed) return
    room.eloProcessed = true

    const winner = role === 'debater_a'
      ? room.players.debater_b?.username
      : room.players.debater_a?.username

    // Loser is the one who admitted defeat
    const outcome = role === 'debater_a' ? 'b' : 'a'
    const usernameA = room.players.debater_a?.username
    const usernameB = room.players.debater_b?.username

    let eloUpdate = null
    if (usernameA && usernameB) {
      eloUpdate = await updateEloAfterDebate(usernameA, usernameB, outcome, room.topic)
    }

    io.to(roomId).emit('debate_ended', {
      scores: room.scores,
      winner,
      args: room.args,
      reason: `${username} admitted defeat`,
      eloUpdate,
    })

    setTimeout(() => deleteRoom(roomId), 5000)
  })
}