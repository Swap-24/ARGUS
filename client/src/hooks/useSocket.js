import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export const useSocket = (joinPayload, handlers) => {
  const socketRef = useRef(null)

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    // ← Emit join_debate only AFTER the socket is confirmed connected
    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id)
      socket.emit('join_debate', joinPayload)
    })

    socket.on('connect_error', (err) => console.error('[socket] error:', err.message))

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      Object.keys(handlers).forEach(event => socket.off(event))
      socket.disconnect()
    }
  }, []) // only runs once on mount

  return { emit }
}