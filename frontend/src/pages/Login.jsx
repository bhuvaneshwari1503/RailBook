
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      // Read the saved role after login completes.
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null')

      if (savedUser?.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/search')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl min-h-[570px] bg-white rounded-lg shadow-xl overflow-hidden grid grid-cols-2">

        {/* Railway image section */}
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=85"
            alt="Railway journey"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-slate-950/50" />

          <div className="relative z-10 h-full flex flex-col justify-between p-10 text-white">
            <div>
              <h1 className="text-3xl font-bold tracking-wide">RailBook</h1>
              <p className="text-sm text-gray-200 mt-2">
                Your journey begins here.
              </p>
            </div>

            <div>
              <p className="text-3xl font-semibold leading-snug">
                Every journey<br />has a destination.
              </p>
              <p className="text-gray-200 mt-4 text-sm">
                Book your train tickets with ease and travel with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Login form section */}
        <div className="flex items-center justify-center px-12 py-14">
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold text-blue-700 tracking-widest uppercase mb-3">
              Your Journey Starts Here
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Sign in to RailBook
            </h2>

            <p className="text-gray-500 mt-2 mb-8 text-sm">
              Enter your details to access your account.
            </p>

            {error && (
              <p className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md mb-5 text-sm">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 text-white py-3 rounded-md font-semibold text-sm hover:bg-blue-900 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="border-t border-gray-200 mt-8 pt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-blue-800 font-semibold hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
