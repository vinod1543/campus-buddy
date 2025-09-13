import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventsAPI, registrationsAPI, apiHelpers } from '../api'
import AddToCalendar from '../components/AddToCalendar'
import { getEventTypeEmoji } from '../utils/eventUtils'

const EventDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [justRegistered, setJustRegistered] = useState(false)

  const isAuthenticated = apiHelpers.isAuthenticated()

  useEffect(() => {
    fetchEvent()
    if (isAuthenticated) {
      checkRegistrationStatus()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getById(id)
      setEvent(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkRegistrationStatus = async () => {
    try {
      const response = await registrationsAPI.checkStatus(id)
      setIsRegistered(response.data.isRegistered)
      setRegistrationStatus(response.data.registration)
    } catch (err) {
      // User might not be registered, that's okay
      setIsRegistered(false)
    }
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      setRegistering(true)
      setError('')
      setSuccessMessage('')
      
      await registrationsAPI.register(id)
      
      setIsRegistered(true)
      setJustRegistered(true)
      setSuccessMessage('🎉 Successfully registered! You\'ll receive reminders before the event.')
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setJustRegistered(false)
        setSuccessMessage('')
      }, 5000)
      
      await fetchEvent() // Refresh event data to update registration count
    } catch (err) {
      setError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    try {
      setRegistering(true)
      setError('')
      setSuccessMessage('')
      
      await registrationsAPI.cancel(id)
      
      setIsRegistered(false)
      setSuccessMessage('Registration cancelled. You can register again anytime!')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
      await fetchEvent() // Refresh event data
    } catch (err) {
      setError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          Loading event details...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😅</div>
          <h2 className="mb-2">Oops!</h2>
          <p className="text-gray mb-4">{error}</p>
          <Link to="/events" className="btn btn-primary">
            Browse Other Events
          </Link>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2>Event not found</h2>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Back Button */}
      <div className="mb-4">
        <Link to="/events" className="btn btn-secondary btn-sm">
          ← Back to Events
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div 
          className={`card ${justRegistered ? 'success-animation' : ''}`}
          style={{ 
            backgroundColor: '#E6F7F1', 
            color: '#00B894', 
            border: '1px solid #00B894',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontWeight: '600' }}>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="card"
          style={{ 
            backgroundColor: '#FFE6E6', 
            color: '#D63031', 
            border: '1px solid #D63031',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontWeight: '600' }}>❌ {error}</p>
        </div>
      )}

      {/* Event Details */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`event-type-badge event-type-${event.type}`}>
              {getEventTypeEmoji(event.type)} {event.type}
            </span>
            {event.isFull && (
              <span className="event-type-badge" style={{ backgroundColor: '#FFE6E6', color: '#D63031', marginLeft: '0.5rem' }}>
                Event Full
              </span>
            )}
            {isRegistered && (
              <span className="event-type-badge" style={{ backgroundColor: '#E6F7F1', color: '#00B894', marginLeft: '0.5rem' }}>
                ✓ Registered
              </span>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

        {event.description && (
          <div className="mb-4">
            <p className="text-gray" style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Event Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
          <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
            <h4 className="font-semibold mb-2">📅 When</h4>
            <p className="text-lg">{formatDate(event.startAt)}</p>
            {event.endAt && (
              <p className="text-sm text-gray">
                Ends: {formatDate(event.endAt)}
              </p>
            )}
          </div>

          <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
            <h4 className="font-semibold mb-2">📍 Where</h4>
            <p className="text-lg">{event.venue}</p>
          </div>

          {event.organizer && (
            <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
              <h4 className="font-semibold mb-2">👥 Organizer</h4>
              <p className="text-lg">{event.organizer}</p>
            </div>
          )}

          <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
            <h4 className="font-semibold mb-2">🎟️ Registration</h4>
            <p className="text-lg">
              {event.registrationCount || 0}
              {event.capacity && ` / ${event.capacity}`} registered
            </p>
            {event.capacity && (
              <div style={{ backgroundColor: '#E9ECEF', height: '8px', borderRadius: '4px', marginTop: '0.5rem' }}>
                <div 
                  style={{ 
                    backgroundColor: 'var(--primary-blue)', 
                    height: '100%', 
                    borderRadius: '4px',
                    width: `${Math.min((event.registrationCount || 0) / event.capacity * 100, 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Registration Actions */}
        <div className="flex gap-4 mt-4">
          {!isAuthenticated ? (
            <div>
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign In to Register 🎯
              </Link>
              <p className="text-sm text-gray mt-2">
                Join Campus Buddy to register for events and get reminders!
              </p>
            </div>
          ) : isRegistered ? (
            <div>
              <button 
                onClick={handleUnregister}
                disabled={registering}
                className="btn btn-warning btn-lg"
              >
                {registering ? 'Cancelling...' : 'Cancel Registration'}
              </button>
              <p className="text-sm text-success mt-2">
                ✅ You're registered! We'll remind you about this event.
              </p>
            </div>
          ) : event.isFull ? (
            <div>
              <button disabled className="btn btn-secondary btn-lg">
                Event Full 😔
              </button>
              <p className="text-sm text-gray mt-2">
                This event has reached capacity. Check back for more events!
              </p>
            </div>
          ) : (
            <div>
              <button 
                onClick={handleRegister}
                disabled={registering}
                className={`btn btn-lg ${registering ? 'btn-secondary' : 'btn-success'}`}
                style={{
                  minWidth: '200px',
                  transition: 'all 0.3s ease'
                }}
              >
                {registering ? (
                  <>
                    <span className="spinner" style={{ marginRight: '0.5rem', width: '16px', height: '16px' }}></span>
                    Registering...
                  </>
                ) : (
                  'Register for Event 🎉'
                )}
              </button>
              <p className="text-sm text-gray mt-2">
                {registering 
                  ? 'Processing your registration...' 
                  : 'Join this event and get reminders before it starts!'
                }
              </p>
            </div>
          )}

          {event.registrationUrl && (
            <a 
              href={event.registrationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              External Registration Link 🔗
            </a>
          )}

          {/* Add to Calendar */}
          <div className="mt-4">
            <AddToCalendar 
              event={event} 
              buttonStyle="outline" 
              className="calendar-component"
            />
          </div>
        </div>

        {/* Poster */}
        {event.posterUrl && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Event Poster</h4>
            <img 
              src={event.posterUrl} 
              alt={`${event.title} poster`}
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default EventDetailPage
