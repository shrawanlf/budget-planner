import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildUrl } from '../util/xhr'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    try {
      const endpoint = isLogin ? buildUrl('/auth/login') : buildUrl('/auth/register')
      const body = isLogin
        ? { email, password }
        : { email, password, name, phone }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Authentication failed')
        return
      }

      const data = await response.json()
      if (isLogin) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
      }
      navigate('/dashboard')
    } catch (err) {
      console.log(err)
      setError('An error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 flex items-center justify-center p-4 font-mono text-black">
      <div className="w-full max-w-md border border-slate-300 shadow-2xl bg-white">
        {/* Card header */}
        <div className="border-b border-slate-800 px-4 py-3 bg-slate-800">
          <h1 className="text-base font-bold text-white tracking-wide">Budget Planner</h1>
          <p className="text-xs text-slate-400 mt-0.5">Personal finance tracker</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-black">
          <button
            className={`flex-1 py-2 text-sm border-r border-black transition-colors ${
              isLogin
                ? 'bg-indigo-700 text-white font-bold'
                : 'bg-white text-black hover:bg-indigo-50'
            }`}
            onClick={() => setIsLogin(true)}
          >
            [ Login ]
          </button>
          <button
            className={`flex-1 py-2 text-sm transition-colors ${
              !isLogin
                ? 'bg-indigo-700 text-white font-bold'
                : 'bg-white text-black hover:bg-indigo-50'
            }`}
            onClick={() => setIsLogin(false)}
          >
            [ Sign Up ]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-bold mb-1 text-slate-600 uppercase tracking-wide">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-2 py-1.5 border border-black text-sm focus:outline-none focus:bg-indigo-50 focus:border-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold mb-1 text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-2 py-1.5 border border-black text-sm focus:outline-none focus:bg-indigo-50 focus:border-indigo-400"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label htmlFor="name" className="block text-xs font-bold mb-1 text-slate-600 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-2 py-1.5 border border-black text-sm focus:outline-none focus:bg-indigo-50 focus:border-indigo-400"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold mb-1 text-slate-600 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-2 py-1.5 border border-black text-sm focus:outline-none focus:bg-indigo-50 focus:border-indigo-400"
                />
              </div>
            </>
          )}

          {error && (
            <div className="border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 border border-indigo-700 bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            {isLogin ? '> Login' : '> Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
