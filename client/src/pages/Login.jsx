import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [shake, setShake]       = useState(false)
  const [loading, setLoading]   = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const triggerShake = (msg) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleLogin = async () => {
    if (username.trim().length < 2 || password.length < 4) {
      triggerShake('Invalid credentials')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login({ username: username.trim(), password })
      navigate('/home')
    } catch (err) {
      triggerShake(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-neutral-200 font-mono-plex px-4">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 p-8
                      hover:border-yellow-500/30 transition-all">

        <div className="text-center mb-8">
          <h1 className="text-yellow-400 tracking-[0.3em] text-xl font-cinzel">LOGIN</h1>
          <p className="text-[0.6rem] tracking-[0.3em] text-neutral-600 mt-2 uppercase">
            Enter the arena
          </p>
        </div>

        <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
          Username
        </label>
        <div className={`flex items-center gap-3 border border-yellow-500/20 bg-neutral-900
                         px-4 py-2 mb-4 ${shake ? 'animate-shake' : ''}`}>
          <span className="text-yellow-400 text-xs">▶</span>
          <input
            className="flex-1 bg-transparent outline-none text-neutral-200 caret-yellow-400"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Your name..."
          />
        </div>

        <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
          Password
        </label>
        <div className={`flex items-center gap-3 border border-yellow-500/20 bg-neutral-900
                         px-4 py-2 mb-4 ${shake ? 'animate-shake' : ''}`}>
          <span className="text-yellow-400 text-xs">▶</span>
          <input
            className="flex-1 bg-transparent outline-none text-neutral-200 caret-yellow-400"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="text-red-500 text-[0.7rem] mb-4">{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 border border-yellow-400 text-yellow-400
                     hover:bg-yellow-400 hover:text-black transition-all
                     tracking-widest text-[0.7rem]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'ENTERING...' : 'ENTER →'}
        </button>

        <p className="text-[0.65rem] text-neutral-600 mt-5 text-center tracking-wide">
          No account?{' '}
          <span
            onClick={() => navigate('/register')}
            className="text-sky-400 cursor-pointer hover:text-white"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  )
}

export default LoginPage