import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, apiHelpers } from '../api'
import { eventTypes, getEventTypeEmoji } from '../utils/eventUtils'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    interests: []
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

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        interests: formData.interests
      }

      const response = await authAPI.register(registerData)
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

  const getInterestEmoji = (interest) => {
    return getEventTypeEmoji(interest)
  }

  return (
    <div className="container-sm" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">Join Campus Buddy! 🎉</h1>
          <p className="text-gray">
            Create your account to never miss another campus event.
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
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              I am a...
            </label>
            <select
              id="role"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">🎓 Student</option>
              <option value="admin">👥 Event Organizer/Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              What events interest you? (Optional)
            </label>
            <p className="text-sm text-gray mb-2">
              Help us show you relevant events!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
              {eventTypes.map(interest => (
                <label 
                  key={interest}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ 
                    padding: '0.5rem', 
                    border: '2px solid #E9ECEF', 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: formData.interests.includes(interest) ? 'var(--primary-blue)' : 'transparent',
                    color: formData.interests.includes(interest) ? 'white' : 'var(--neutral-dark)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestChange(interest)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>
                    {getInterestEmoji(interest)} {interest}
                  </span>
                </label>
              ))}
            </div>
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
                Creating account...
              </>
            ) : (
              'Create My Account 🚀'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="card" style={{ backgroundColor: '#F8F9FA', marginTop: '1.5rem', border: '1px solid #E9ECEF' }}>
          <p className="text-xs text-gray text-center">
            🔒 Your information is secure. We only use your email for event reminders and important updates.
            <br />
            You can update your preferences anytime after signing up.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={{ marginTop: '3rem' }}>
        <h3 className="text-center text-xl font-semibold mb-4">Why join Campus Buddy?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <h4 className="font-semibold text-sm mb-1">Never Miss Events</h4>
            <p className="text-xs text-gray">Get reminders for events you care about</p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h4 className="font-semibold text-sm mb-1">Quick Registration</h4>
            <p className="text-xs text-gray">Register for events with just one click</p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
            <h4 className="font-semibold text-sm mb-1">Personal Dashboard</h4>
            <p className="text-xs text-gray">Track all your events in one place</p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎪</div>
            <h4 className="font-semibold text-sm mb-1">Discover New Events</h4>
            <p className="text-xs text-gray">Find events that match your interests</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
