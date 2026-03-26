import { DebateProvider } from './context/DebateContext'
import { AuthProvider }   from './context/AuthContext'
import AppRoutes          from './router/Routes'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <DebateProvider>
        <AppRoutes />
      </DebateProvider>
    </AuthProvider>
  )
}

export default App