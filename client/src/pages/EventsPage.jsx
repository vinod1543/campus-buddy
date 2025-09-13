import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventsAPI } from '../api'
import { eventTypes, getEventTypeEmoji, formatEventDate } from '../utils/eventUtils'

const EventsPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    q: '',
    types: '',
    from: '',
    to: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [filters])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getAll(filters)
      setEvents(response.data.events)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Discover Amazing Events 🎉</h1>
        <p className="text-gray">Find events that match your interests and register instantly!</p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group mb-0">
            <input
              type="text"
              placeholder="Search events... 🔍"
              className="form-input"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>
          
          <div className="form-group mb-0">
            <select
              className="form-select"
              value={filters.types}
              onChange={(e) => handleFilterChange('types', e.target.value)}
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {getEventTypeEmoji(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group mb-0">
            <input
              type="date"
              className="form-input"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              placeholder="From date"
            />
          </div>
          
          <div className="form-group mb-0">
            <input
              type="date"
              className="form-input"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Finding amazing events for you...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card text-center">
          <p className="text-warning">😅 {error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      )}

      {/* Events Grid */}
      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <div className="card text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 className="mb-2">No events found</h3>
              <p className="text-gray mb-4">
                Try adjusting your filters or check back later for new events!
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => setFilters({ q: '', types: '', from: '', to: '' })}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {events.map(event => (
                <div key={event._id} className={`event-card ${event.type}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`event-type-badge event-type-${event.type}`}>
                      {getEventTypeEmoji(event.type)} {event.type}
                    </span>
                    {event.isFull && (
                      <span className="event-type-badge" style={{ backgroundColor: '#FFE6E6', color: '#D63031' }}>
                        Full
                      </span>
                    )}
                  </div>
                  
                  <h3 className="card-title mb-2">{event.title}</h3>
                  
                  {event.description && (
                    <p className="text-gray text-sm mb-3" style={{ lineHeight: '1.5' }}>
                      {event.description.length > 100 
                        ? `${event.description.substring(0, 100)}...` 
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
                      <p className="text-sm mb-1">
                        <strong>👥 Organizer:</strong> {event.organizer}
                      </p>
                    )}
                    {event.capacity && (
                      <p className="text-sm">
                        <strong>🎟️ Capacity:</strong> {event.registrationCount || 0}/{event.capacity}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Link 
                      to={`/events/${event._id}`} 
                      className="btn btn-primary flex-1"
                    >
                      View Details
                    </Link>
                    {event.registrationUrl && (
                      <a 
                        href={event.registrationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                      >
                        External Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default EventsPage
