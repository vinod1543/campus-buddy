import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrationsAPI, apiHelpers } from '../api'
import AddToCalendar from '../components/AddToCalendar'
import { getEventTypeEmoji, formatEventDate } from '../utils/eventUtils'

const MyEventsPage = () => {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('upcoming')

  const isAuthenticated = apiHelpers.isAuthenticated()
  const user = apiHelpers.getCurrentUser()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchMyEvents()
  }, [filter, isAuthenticated])

  const fetchMyEvents = async () => {
    try {
      setLoading(true)
      const params = {
        upcoming: filter === 'upcoming' ? 'true' : 'false',
        status: filter === 'cancelled' ? 'cancelled' : 'all'
      }
      const response = await registrationsAPI.getMyRegistrations(params)
      setRegistrations(response.data.registrations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      return
    }

    try {
      await registrationsAPI.cancel(eventId)
      await fetchMyEvents() // Refresh the list
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2>Please Sign In</h2>
          <p className="text-gray mb-4">You need to be signed in to view your events.</p>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">My Events 🎟️</h1>
        <p className="text-gray">
          Hi {user?.name}! Here are the events you've registered for.
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`btn ${filter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Loading your events...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card text-center">
          <p className="text-warning">😅 {error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchMyEvents}>
            Try Again
          </button>
        </div>
      )}

      {/* Events List */}
      {!loading && !error && (
        <>
          {registrations.length === 0 ? (
            <div className="card text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                {filter === 'upcoming' ? '📅' : filter === 'cancelled' ? '❌' : '🎪'}
              </div>
              <h3 className="mb-2">
                {filter === 'upcoming' 
                  ? 'No upcoming events' 
                  : filter === 'cancelled' 
                    ? 'No cancelled registrations' 
                    : 'No events yet'
                }
              </h3>
              <p className="text-gray mb-4">
                {filter === 'upcoming' 
                  ? 'Ready to discover some amazing events?' 
                  : 'Start exploring events and register for the ones you love!'
                }
              </p>
              <Link to="/events" className="btn btn-primary">
                Browse Events 🎉
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {registrations.map(registration => {
                const event = registration.event
                const isPastEvent = new Date(event.startAt) < new Date()
                const isCancelled = registration.status === 'cancelled'
                
                return (
                  <div key={registration._id} className={`event-card ${event.type}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className={`event-type-badge event-type-${event.type}`}>
                          {getEventTypeEmoji(event.type)} {event.type}
                        </span>
                        {isCancelled && (
                          <span className="event-type-badge" style={{ backgroundColor: '#FFE6E6', color: '#D63031' }}>
                            Cancelled
                          </span>
                        )}
                        {isPastEvent && !isCancelled && (
                          <span className="event-type-badge" style={{ backgroundColor: '#E6F7F1', color: '#00B894' }}>
                            Completed
                          </span>
                        )}
                        {!isPastEvent && !isCancelled && (
                          <span className="event-type-badge" style={{ backgroundColor: '#E6F7F1', color: '#00B894' }}>
                            ✓ Registered
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray">
                        Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                      </div>
                    </div>

                    <h3 className="card-title mb-2">{event.title}</h3>
                    
                    {event.description && (
                      <p className="text-gray text-sm mb-3" style={{ lineHeight: '1.5' }}>
                        {event.description.length > 150 
                          ? `${event.description.substring(0, 150)}...` 
                          : event.description
                        }
                      </p>
                    )}

                    <div className="mb-3">
                      <p className="text-sm mb-1">
                        <strong>📅 When:</strong> {formatEventDate(event.startAt)}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>📍 Where:</strong> {event.venue}
                      </p>
                      {event.organizer && (
                        <p className="text-sm">
                          <strong>👥 Organizer:</strong> {event.organizer}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link 
                        to={`/events/${event._id}`} 
                        className="btn btn-secondary"
                      >
                        View Details
                      </Link>
                      
                      {!isCancelled && (
                        <AddToCalendar 
                          event={event} 
                          buttonStyle="secondary"
                          className="calendar-btn-small"
                        />
                      )}
                      
                      {!isCancelled && !isPastEvent && (
                        <button
                          onClick={() => handleCancelRegistration(event._id, event.title)}
                          className="btn btn-warning"
                        >
                          Cancel Registration
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      {!loading && registrations.length > 0 && (
        <div className="card text-center mt-4">
          <h3 className="mb-2">Want to discover more events?</h3>
          <Link to="/events" className="btn btn-primary">
            Browse All Events 🎪
          </Link>
        </div>
      )}
    </div>
  )
}

export default MyEventsPage
