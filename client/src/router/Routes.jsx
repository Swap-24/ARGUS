import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Home         from '../pages/Home'
import LoginPage    from '../pages/Login'
import RegisterPage from '../pages/Register'
import Debate       from '../pages/Debate'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <span className="text-yellow-400 font-cinzel tracking-widest text-sm animate-pulse">
          ARGUS
        </span>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/debate/:roomId" element={<ProtectedRoute><Debate /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes