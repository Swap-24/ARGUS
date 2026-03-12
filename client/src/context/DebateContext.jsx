import { createContext, useContext, useState } from 'react'

const DebateContext = createContext(null)

export const DebateProvider = ({ children }) => {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [role, setRole] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(300) // seconds, default 5 min

  return (
    <DebateContext.Provider value={{
      username, setUsername,
      roomId, setRoomId,
      role, setRole,
      topic, setTopic,
      duration, setDuration,
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