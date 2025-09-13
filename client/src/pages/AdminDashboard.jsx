import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventsAPI, registrationsAPI, apiHelpers } from '../api'
import { getEventTypeEmoji } from '../utils/eventUtils'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  })

  const user = apiHelpers.getCurrentUser()
  const isAuthenticated = apiHelpers.isAuthenticated()

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Fetching admin dashboard data...')
      
      // Check auth status before making request
      const token = localStorage.getItem('token')
      console.log('Has token:', !!token)
      console.log('Token preview:', token?.substring(0, 20) + '...')
      
      // Get admin dashboard data
      const response = await eventsAPI.getAdminDashboard()
      console.log('Admin dashboard response:', response)
      
      const { events, stats } = response.data
      setEvents(events || [])
      setStats(stats || { totalEvents: 0, totalRegistrations: 0, upcomingEvents: 0, totalUsers: 0 })
      
      console.log('Admin data loaded successfully:', { events: events?.length, stats })
    } catch (err) {
      console.error('Admin dashboard error:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      setError(err.message || 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('AdminDashboard mounted - one time effect');
    
    // Check auth status on mount only
    const currentUser = apiHelpers.getCurrentUser()
    const authenticated = apiHelpers.isAuthenticated()
    
    console.log('isAuthenticated:', authenticated);
    console.log('user:', currentUser);
    console.log('user role:', currentUser?.role);
    
    if (!authenticated || currentUser?.role !== 'admin') {
      console.log('Redirecting to home - not authenticated or not admin');
      navigate('/')
      return
    }
    
    // Only call fetchAdminData once on mount
    fetchAdminData()
  }, []) // Empty dependency array - only run once on mount

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return
    }

    try {
      await eventsAPI.delete(eventId)
      await fetchAdminData() // Refresh the list
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

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p className="text-gray mb-4">You need admin privileges to access this page.</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard 👥</h1>
          <p className="text-gray">Welcome back, {user?.name}! Manage your events here.</p>
        </div>
        <Link to="/admin/create-event" className="btn btn-primary">
          + Create New Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
          <h3 className="text-2xl font-bold text-primary">{stats.totalEvents}</h3>
          <p className="text-gray">Total Events</p>
        </div>
        
        <div className="card text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎟️</div>
          <h3 className="text-2xl font-bold text-success">{stats.totalRegistrations}</h3>
          <p className="text-gray">Total Registrations</p>
        </div>
        
        <div className="card text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
          <h3 className="text-2xl font-bold text-warning">{stats.upcomingEvents}</h3>
          <p className="text-gray">Upcoming Events</p>
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
          <h3 className="mb-3">🚫 Something went wrong!</h3>
          <p className="text-warning mb-4">😅 {error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchAdminData}>
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Events List */}
      {!loading && !error && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Events</h2>
            <div className="text-sm text-gray">
              {events.length} event{events.length !== 1 ? 's' : ''} total
            </div>
          </div>

          {events.length === 0 ? (
            <div className="card text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎪</div>
              <h3 className="mb-2">No events yet</h3>
              <p className="text-gray mb-4">
                Ready to create your first amazing event?
              </p>
              <Link to="/admin/create-event" className="btn btn-primary">
                Create Your First Event 🚀
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {events.map(event => {
                const isPastEvent = new Date(event.startAt) < new Date()
                const isToday = new Date(event.startAt).toDateString() === new Date().toDateString()
                
                return (
                  <div key={event._id} className={`event-card ${event.type}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className={`event-type-badge event-type-${event.type}`}>
                          {getEventTypeEmoji(event.type)} {event.type}
                        </span>
                        {isPastEvent && (
                          <span className="event-type-badge" style={{ backgroundColor: '#E6F7F1', color: '#00B894' }}>
                            Completed
                          </span>
                        )}
                        {isToday && !isPastEvent && (
                          <span className="event-type-badge" style={{ backgroundColor: '#FFE6E6', color: '#D63031' }}>
                            Today!
                          </span>
                        )}
                        {event.isFull && (
                          <span className="event-type-badge" style={{ backgroundColor: '#FFE6E6', color: '#D63031' }}>
                            Full
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray">
                        Created: {new Date(event.createdAt).toLocaleDateString()}
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
                        <strong>📅 When:</strong> {formatDate(event.startAt)}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>📍 Where:</strong> {event.venue}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>🎟️ Registrations:</strong> {event.registrationCount || 0}
                        {event.capacity && ` / ${event.capacity}`}
                      </p>
                      {event.capacity && (
                        <div style={{ backgroundColor: '#E9ECEF', height: '6px', borderRadius: '3px', marginTop: '0.5rem' }}>
                          <div 
                            style={{ 
                              backgroundColor: 'var(--primary-blue)', 
                              height: '100%', 
                              borderRadius: '3px',
                              width: `${Math.min((event.registrationCount || 0) / event.capacity * 100, 100)}%`,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link 
                        to={`/events/${event._id}`} 
                        className="btn btn-secondary"
                      >
                        👁️ View
                      </Link>
                      
                      <Link 
                        to={`/admin/edit-event/${event._id}`} 
                        className="btn btn-primary"
                      >
                        ✏️ Edit
                      </Link>
                      
                      <Link 
                        to={`/admin/event-participants/${event._id}`} 
                        className="btn btn-secondary"
                      >
                        👥 Participants ({event.registrationCount || 0})
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteEvent(event._id, event.title)}
                        className="btn btn-warning"
                        style={{ marginLeft: 'auto' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      {!loading && events.length > 0 && (
        <div className="card text-center mt-4">
          <h3 className="mb-3">Quick Actions</h3>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <Link to="/admin/create-event" className="btn btn-primary">
              + Create Event
            </Link>
            <Link to="/events" className="btn btn-secondary">
              View Public Events
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
