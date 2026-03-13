import { createContext, useContext, useState } from 'react'

const DebateContext = createContext(null)

export const DebateProvider = ({ children }) => {
  const [username, setUsername]       = useState('')
  const [roomId, setRoomId]           = useState('')
  const [role, setRole]               = useState('')
  const [topic, setTopic]             = useState('')
  const [duration, setDuration]       = useState(300)   // debate-wide timer (seconds)
  const [turnDuration, setTurnDuration] = useState(30)  // per-turn timer (seconds), 0 = infinite

  return (
    <DebateContext.Provider value={{
      username, setUsername,
      roomId, setRoomId,
      role, setRole,
      topic, setTopic,
      duration, setDuration,
      turnDuration, setTurnDuration,
    }}>
      {children}
    </DebateContext.Provider>
  )
}

export const useDebate = () => {
  const ctx = useContext(DebateContext)
  if (!ctx) throw new Error('useDebate must be used within DebateProvider')
  return ctx
}