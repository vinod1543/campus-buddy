import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, apiHelpers } from '../api'

const LoginPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  if (apiHelpers.isAuthenticated()) {
    navigate('/')
    return null
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(formData)
      const { token, user, message } = response.data

      // Store auth data
      apiHelpers.setAuthData(token, user)

      // Show success message (optional)
      if (message) {
        console.log(message)
      }

      // Redirect to home page
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-sm" style={{ paddingTop: '3rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">Welcome Back! 👋</h1>
          <p className="text-gray">
            Sign in to discover and register for amazing campus events.
          </p>
        </div>

        {error && (
          <div className="card" style={{ backgroundColor: '#FFE6E6', border: '1px solid #FF6B6B', marginBottom: '1rem' }}>
            <p className="text-center" style={{ color: '#D63031', margin: 0 }}>
              😅 {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                Signing in...
              </>
            ) : (
              'Sign In 🚀'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold">
              Join Campus Buddy
            </Link>
          </p>
        </div>
      </div>

      {/* Features Preview */}
      <div style={{ marginTop: '3rem' }}>
        <h3 className="text-center text-xl font-semibold mb-4">What you can do with Campus Buddy:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <h4 className="font-semibold text-sm">Discover Events</h4>
            <p className="text-xs text-gray">Search and filter events by type, date, and interests</p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎟️</div>
            <h4 className="font-semibold text-sm">Quick Registration</h4>
            <p className="text-xs text-gray">Register for events with one click and track your schedule</p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
            <h4 className="font-semibold text-sm">Smart Reminders</h4>
            <p className="text-xs text-gray">Get email reminders before your registered events</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
