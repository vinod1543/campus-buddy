import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventsAPI, apiHelpers } from '../api'
import { eventTypes, getEventTypeEmoji } from '../utils/eventUtils'

const EditEventPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'technical',
    startAt: '',
    endAt: '',
    venue: '',
    organizer: '',
    capacity: '',
    registrationUrl: '',
    posterUrl: '',
    visibility: 'public'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const user = apiHelpers.getCurrentUser()
  const isAuthenticated = apiHelpers.isAuthenticated()

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate('/')
    return null
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getById(id)
      const event = response.data
      
      // Format dates for datetime-local input
      const formatForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'technical',
        startAt: formatForInput(event.startAt),
        endAt: formatForInput(event.endAt),
        venue: event.venue || '',
        organizer: event.organizer || '',
        capacity: event.capacity || '',
        registrationUrl: event.registrationUrl || '',
        posterUrl: event.posterUrl || '',
        visibility: event.visibility || 'public'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : '') : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validation
      if (new Date(formData.startAt) <= new Date()) {
        setError('Event start time must be in the future')
        return
      }

      if (formData.endAt && new Date(formData.endAt) <= new Date(formData.startAt)) {
        setError('Event end time must be after start time')
        return
      }

      if (formData.capacity && formData.capacity < 1) {
        setError('Capacity must be at least 1')
        return
      }

      // Prepare data
      const eventData = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
        capacity: formData.capacity ? Number(formData.capacity) : null
      }

      // Remove empty optional fields
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === '') {
          eventData[key] = null
        }
      })

      await eventsAPI.update(id, eventData)
      
      // Redirect to admin dashboard with success
      navigate('/admin', { 
        state: { 
          message: `Event "${formData.title}" updated successfully! ✨` 
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Get current date for min attribute
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDateTime = now.toISOString().slice(0, 16)

  if (loading) {
    return (
      <div className="container-sm" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          Loading event details...
        </div>
      </div>
    )
  }

  if (error && !formData.title) {
    return (
      <div className="container-sm" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2>Event Not Found</h2>
          <p className="text-gray mb-4">{error}</p>
          <Link to="/admin" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-sm" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="mb-4">
        <Link to="/admin" className="btn btn-secondary btn-sm mb-3">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-2">Edit Event ✏️</h1>
        <p className="text-gray">
          Update the details for "{formData.title}"
        </p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#FFE6E6', border: '1px solid #FF6B6B', marginBottom: '1rem' }}>
          <p className="text-center" style={{ color: '#D63031', margin: 0 }}>
            😅 {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {/* Basic Information */}
        <div className="card-header">
          <h3 className="card-title">Basic Information</h3>
        </div>

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            placeholder="e.g., Annual Tech Hackathon 2025"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            placeholder="Tell students what this event is about..."
            value={formData.description}
            onChange={handleChange}
            rows="4"
            maxLength="1000"
          />
          <div className="text-xs text-gray mt-1">
            {formData.description.length}/1000 characters
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="type" className="form-label">
              Event Type *
            </label>
            <select
              id="type"
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {getEventTypeEmoji(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="visibility" className="form-label">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              className="form-select"
              value={formData.visibility}
              onChange={handleChange}
            >
              <option value="public">🌐 Public (Everyone can see)</option>
              <option value="private">🔒 Private (Invite only)</option>
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card-header" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Date & Time</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="startAt" className="form-label">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="startAt"
              name="startAt"
              className="form-input"
              value={formData.startAt}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endAt" className="form-label">
              End Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              id="endAt"
              name="endAt"
              className="form-input"
              value={formData.endAt}
              onChange={handleChange}
              min={formData.startAt || minDateTime}
            />
          </div>
        </div>

        {/* Location & Organizer */}
        <div className="card-header" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Location & Organizer</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="venue" className="form-label">
              Venue *
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              className="form-input"
              placeholder="e.g., Main Auditorium, Room 201"
              value={formData.venue}
              onChange={handleChange}
              required
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizer" className="form-label">
              Organizer
            </label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              className="form-input"
              placeholder="Your name or organization"
              value={formData.organizer}
              onChange={handleChange}
              maxLength="100"
            />
          </div>
        </div>

        {/* Registration Details */}
        <div className="card-header" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Registration Details</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="capacity" className="form-label">
              Capacity (Optional)
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              className="form-input"
              placeholder="Max attendees"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              max="10000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationUrl" className="form-label">
              External Registration URL (Optional)
            </label>
            <input
              type="url"
              id="registrationUrl"
              name="registrationUrl"
              className="form-input"
              placeholder="https://example.com/register"
              value={formData.registrationUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="card-header" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">Optional Details</h3>
        </div>

        <div className="form-group">
          <label htmlFor="posterUrl" className="form-label">
            Poster/Image URL (Optional)
          </label>
          <input
            type="url"
            id="posterUrl"
            name="posterUrl"
            className="form-input"
            placeholder="https://example.com/poster.jpg"
            value={formData.posterUrl}
            onChange={handleChange}
          />
        </div>

        {/* Submit */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E9ECEF' }}>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formData.title || !formData.startAt || !formData.venue}
              className="btn btn-primary btn-lg"
            >
              {saving ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                  Saving Changes...
                </>
              ) : (
                'Save Changes ✨'
              )}
            </button>
            
            <Link to="/admin" className="btn btn-secondary btn-lg">
              Cancel
            </Link>
            
            <Link to={`/events/${id}`} className="btn btn-secondary btn-lg" style={{ marginLeft: 'auto' }}>
              👁️ View Event
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditEventPage
