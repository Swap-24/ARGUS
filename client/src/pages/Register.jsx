import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [shake, setShake]       = useState(false)
  const [loading, setLoading]   = useState(false)

  const { register } = useAuth()
  const navigate     = useNavigate()

  const triggerShake = (msg) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleRegister = async () => {
    if (username.trim().length < 2) return triggerShake('Username too short')
    if (!email.includes('@'))       return triggerShake('Invalid email')
    if (password.length < 4)        return triggerShake('Password too short')

    setLoading(true)
    setError('')
    try {
      await register({ username: username.trim(), email, password })
      navigate('/home')
    } catch (err) {
      triggerShake(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const shakeClass = shake ? 'animate-shake' : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-neutral-200 font-mono-plex px-4">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 p-8
                      hover:border-sky-500/30 transition-all">

        <div className="text-center mb-8">
          <h1 className="text-sky-400 tracking-[0.3em] text-xl font-cinzel">REGISTER</h1>
          <p className="text-[0.6rem] tracking-[0.3em] text-neutral-600 mt-2 uppercase">
            Create identity
          </p>
        </div>

        <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
          Username
        </label>
        <input
          className={`w-full bg-[#0a0a0a] border border-neutral-800 p-3 mb-4
                      outline-none focus:border-sky-500/40 text-neutral-200 ${shakeClass}`}
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Choose a name..."
        />

        <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
          Email
        </label>
        <input
          className={`w-full bg-[#0a0a0a] border border-neutral-800 p-3 mb-4
                      outline-none focus:border-sky-500/40 text-neutral-200 ${shakeClass}`}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="block text-[0.6rem] tracking-[0.3em] text-neutral-600 mb-2 uppercase">
          Password
        </label>
        <input
          type="password"
          className={`w-full bg-[#0a0a0a] border border-neutral-800 p-3 mb-4
                      outline-none focus:border-sky-500/40 text-neutral-200 ${shakeClass}`}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
          placeholder="••••••••"
        />

        {error && <div className="text-red-500 text-[0.7rem] mb-4">{error}</div>}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 border border-sky-400 text-sky-400
                     hover:bg-sky-400 hover:text-black transition-all
                     tracking-widest text-[0.7rem]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
        </button>

        <p className="text-[0.65rem] text-neutral-600 mt-5 text-center tracking-wide">
          Already registered?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-yellow-400 cursor-pointer hover:text-white"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage