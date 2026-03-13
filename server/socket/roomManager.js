/**
 * roomManager.js
 * In-memory store for all active debate rooms.
 * Each room tracks players, scores, charges, and timer references.
 */

const rooms = new Map()

export const createRoom = (roomId, { topic, duration, turnDuration = 30 }) => {
  rooms.set(roomId, {
    roomId,
    topic,
    duration,
    turnDuration,      // per-turn seconds, 0 = infinite
    debateTimeLeft: duration,
    turnTimeLeft: turnDuration || 30,
    currentTurn: 'debater_a',
    status: 'waiting', // 'waiting' | 'active' | 'finished'
    players: {
      debater_a: null, // { socketId, username }
      debater_b: null,
    },
    spectators: [],
    scores: { debater_a: 0, debater_b: 0 },
    charges: { debater_a: 0, debater_b: 0 },
    args: [],
    debateTimer: null,
    turnTimer: null,
  })
  return rooms.get(roomId)
}

export const getRoom = (roomId) => rooms.get(roomId)

export const deleteRoom = (roomId) => {
  const room = rooms.get(roomId)
  if (room) {
    clearInterval(room.debateTimer)
    clearInterval(room.turnTimer)
  }
  rooms.delete(roomId)
}

export const getRoomBySocket = (socketId) => {
  for (const room of rooms.values()) {
    if (room.players.debater_a?.socketId === socketId) return { room, role: 'debater_a' }
    if (room.players.debater_b?.socketId === socketId) return { room, role: 'debater_b' }
    if (room.spectators.includes(socketId)) return { room, role: 'spectator' }
  }
  return null
}