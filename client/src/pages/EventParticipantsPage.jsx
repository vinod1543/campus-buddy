import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { eventsAPI, registrationsAPI, apiHelpers } from '../api'

const EventParticipantsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('registered')

  const user = apiHelpers.getCurrentUser()
  const isAuthenticated = apiHelpers.isAuthenticated()

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate('/')
    return null
  }

  useEffect(() => {
    fetchEventAndParticipants()
  }, [id, filter])

  const fetchEventAndParticipants = async () => {
    try {
      setLoading(true)
      
      // Fetch event details
      const eventResponse = await eventsAPI.getById(id)
      setEvent(eventResponse.data)
      
      // Fetch participants
      const participantsResponse = await registrationsAPI.getForEvent(id, { status: filter })
      setParticipants(participantsResponse.data.registrations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (participants.length === 0) return

    const headers = ['Name', 'Email', 'Registration Date', 'Status']
    const csvData = participants.map(reg => [
      reg.user.name,
      reg.user.email,
      new Date(reg.registeredAt).toLocaleDateString(),
      reg.status
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${event?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      registered: { backgroundColor: '#E6F7F1', color: '#00B894' },
      checked_in: { backgroundColor: '#E8F4FD', color: '#0984E3' },
      cancelled: { backgroundColor: '#FFE6E6', color: '#D63031' }
    }

    const labels = {
      registered: '✓ Registered',
      checked_in: '👤 Checked In',
      cancelled: '❌ Cancelled'
    }

    return (
      <span 
        className="event-type-badge" 
        style={styles[status] || styles.registered}
      >
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          Loading participants...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2>Error Loading Participants</h2>
          <p className="text-gray mb-4">{error}</p>
          <Link to="/admin" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="mb-4">
        <Link to="/admin" className="btn btn-secondary btn-sm mb-3">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-2">Event Participants 👥</h1>
        {event && (
          <div className="card" style={{ backgroundColor: '#F8F9FA' }}>
            <h3 className="font-semibold mb-2">{event.title}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p className="text-sm"><strong>📅 Date:</strong> {formatDate(event.startAt)}</p>
                <p className="text-sm"><strong>📍 Venue:</strong> {event.venue}</p>
              </div>
              <div>
                <p className="text-sm"><strong>🎟️ Capacity:</strong> {event.capacity || 'Unlimited'}</p>
                <p className="text-sm"><strong>👀 Visibility:</strong> {event.visibility}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="card mb-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('registered')}
              className={`btn btn-sm ${filter === 'registered' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Registered
            </button>
            <button
              onClick={() => setFilter('checked_in')}
              className={`btn btn-sm ${filter === 'checked_in' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Checked In
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`btn btn-sm ${filter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All
            </button>
          </div>

          <div className="flex gap-2">
            <span className="text-sm text-gray">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
            {participants.length > 0 && (
              <button
                onClick={exportToCSV}
                className="btn btn-secondary btn-sm"
              >
                📊 Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants List */}
      {participants.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {filter === 'registered' ? '🎟️' : filter === 'checked_in' ? '👤' : filter === 'cancelled' ? '❌' : '👥'}
          </div>
          <h3 className="mb-2">
            No {filter === 'all' ? '' : filter} participants yet
          </h3>
          <p className="text-gray mb-4">
            {filter === 'registered' 
              ? 'No one has registered for this event yet.' 
              : filter === 'checked_in'
                ? 'No participants have checked in yet.'
                : filter === 'cancelled'
                  ? 'No cancelled registrations.'
                  : 'No participants found for this event.'
            }
          </p>
          <Link to={`/events/${id}`} className="btn btn-primary">
            View Event Page
          </Link>
        </div>
      ) : (
        <div className="card">
          {/* Summary Stats */}
          <div className="card-header">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {filter === 'all' && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-success">
                      {participants.filter(p => p.status === 'registered').length}
                    </div>
                    <div className="text-xs text-gray">Registered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {participants.filter(p => p.status === 'checked_in').length}
                    </div>
                    <div className="text-xs text-gray">Checked In</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-warning">
                      {participants.filter(p => p.status === 'cancelled').length}
                    </div>
                    <div className="text-xs text-gray">Cancelled</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Participants Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E9ECEF' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Participant</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Registered</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((registration, index) => (
                  <tr 
                    key={registration._id} 
                    style={{ 
                      borderBottom: index < participants.length - 1 ? '1px solid #F1F3F4' : 'none',
                      backgroundColor: index % 2 === 0 ? 'transparent' : '#FAFBFC'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <div className="flex items-center gap-3">
                        <div 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-blue)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '1.1rem'
                          }}
                        >
                          {registration.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{registration.user.name}</div>
                          <div className="text-xs text-gray">ID: {registration.user._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <a 
                        href={`mailto:${registration.user.email}`}
                        className="text-primary"
                        style={{ textDecoration: 'none' }}
                      >
                        {registration.user.email}
                      </a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div className="text-sm">
                        {new Date(registration.registeredAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray">
                        {new Date(registration.registeredAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {getStatusBadge(registration.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {event && (
        <div className="card text-center mt-4">
          <h3 className="mb-3">Quick Actions</h3>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <Link to={`/events/${id}`} className="btn btn-secondary">
              👁️ View Event
            </Link>
            <Link to={`/admin/edit-event/${id}`} className="btn btn-primary">
              ✏️ Edit Event
            </Link>
            <Link to="/admin" className="btn btn-secondary">
              📊 Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventParticipantsPage
