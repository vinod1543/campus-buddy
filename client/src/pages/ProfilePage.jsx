import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI, apiHelpers } from '../api'

const ProfilePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    year: '',
    major: '',
    interests: []
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailReminders: true,
    notificationPreferences: {
      eventReminders: true,
      reminderTiming: ['24h', '1h'],
      marketingEmails: false
    }
  })

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Faculty']
  const interestOptions = ['Technical', 'Cultural', 'Sports', 'Academic', 'Clubs', 'Volunteering']

  useEffect(() => {
    const isAuthenticated = apiHelpers.isAuthenticated()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchUserProfile()
  }, [navigate]) // Remove isAuthenticated from dependencies

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getCurrentUser()
      const userData = response.data.user
      setUser(userData)
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        year: userData.year || '',
        major: userData.major || '',
        interests: userData.interests || []
      })
      setNotificationPreferences({
        emailReminders: userData.emailReminders !== false,
        notificationPreferences: userData.notificationPreferences || {
          eventReminders: true,
          reminderTiming: ['24h', '1h'],
          marketingEmails: false
        }
      })
    } catch (err) {
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleClearInterests = async () => {
    if (window.confirm('Are you sure you want to clear all interests? This action cannot be undone.')) {
      try {
        setError('')
        const response = await authAPI.clearInterests()
        setUser(response.data.user)
        setFormData(prev => ({
          ...prev,
          interests: []
        }))
        setSuccess('All interests cleared successfully! 🧹')
        
        // Update stored user data
        apiHelpers.setAuthData(localStorage.getItem('token'), response.data.user)
        
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      setError('')

      const formData = new FormData()
      formData.append('profilePicture', file)

      const response = await authAPI.uploadProfilePicture(formData)
      setUser(response.data.user)
      setSuccess('Profile picture updated successfully! 📸')

      // Update stored user data
      apiHelpers.setAuthData(localStorage.getItem('token'), response.data.user)

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleDeleteProfilePicture = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      try {
        setError('')
        const response = await authAPI.deleteProfilePicture()
        setUser(response.data.user)
        setSuccess('Profile picture deleted successfully! 🗑️')

        // Update stored user data
        apiHelpers.setAuthData(localStorage.getItem('token'), response.data.user)

        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      
      const response = await authAPI.updateProfile(formData)
      setUser(response.data.user)
      setEditing(false)
      setSuccess('Profile updated successfully! 🎉')
      
      // Update stored user data
      apiHelpers.setAuthData(localStorage.getItem('token'), response.data.user)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    try {
      setChangingPassword(true)
      setError('')
      
      await authAPI.changePassword(passwordData)
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
      setSuccess('Password changed successfully! 🔐')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleNotificationUpdate = async () => {
    try {
      setError('')
      
      const response = await authAPI.updateNotificationPreferences(notificationPreferences)
      setUser(response.data.user)
      setSuccess('Notification preferences updated successfully! 🔔')
      
      // Update stored user data
      apiHelpers.setAuthData(localStorage.getItem('token'), response.data.user)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReminderTimingChange = (timing) => {
    setNotificationPreferences(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        reminderTiming: prev.notificationPreferences.reminderTiming.includes(timing)
          ? prev.notificationPreferences.reminderTiming.filter(t => t !== timing)
          : [...prev.notificationPreferences.reminderTiming, timing]
      }
    }))
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      year: user.year || '',
      major: user.major || '',
      interests: user.interests || []
    })
    setEditing(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">👤 My Profile</h1>
        <div className="flex gap-2">
          <Link to="/profile/settings" className="btn btn-secondary btn-sm">
            ⚙️ Settings
          </Link>
          {!editing && (
            <button 
              onClick={() => setEditing(true)}
              className="btn btn-primary btn-sm"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div 
          className="card success-animation"
          style={{ 
            backgroundColor: '#E6F7F1', 
            color: '#00B894', 
            border: '1px solid #00B894',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontWeight: '600' }}>{success}</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Profile Information */}
        <div className="card">
          <h3 className="mb-4">Profile Information</h3>
          
          {/* Profile Picture */}
          <div className="text-center mb-4">
            <div 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                backgroundColor: user?.profilePicture ? 'transparent' : 'var(--primary-blue)', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: '600',
                margin: '0 auto 1rem auto',
                overflow: 'hidden',
                border: '3px solid var(--border-color)',
                backgroundImage: user?.profilePicture ? `url(${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.profilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {!user?.profilePicture && (user?.name?.charAt(0)?.toUpperCase() || '?')}
              {uploadingPhoto && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                >
                  <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                📷 {user?.profilePicture ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </label>
              
              {user?.profilePicture && (
                <button 
                  onClick={handleDeleteProfilePicture}
                  className="btn btn-warning btn-sm"
                  disabled={uploadingPhoto}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="form-label">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select your year</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Major/Department</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Computer Science, Business, etc."
                />
              </div>

              <div>
                <label className="form-label">Interests</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Select your interests:
                  </span>
                  <button
                    type="button"
                    onClick={handleClearInterests}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    🧹 Clear All
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {interestOptions.map(interest => (
                    <label key={interest} className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestToggle(interest)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-success"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>Name:</strong> {user?.name || 'Not set'}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || 'Not set'}
              </div>
              <div>
                <strong>Role:</strong> <span className="event-type-badge">{user?.role || 'student'}</span>
              </div>
              {user?.bio && (
                <div>
                  <strong>Bio:</strong> {user.bio}
                </div>
              )}
              {user?.year && (
                <div>
                  <strong>Year:</strong> {user.year}
                </div>
              )}
              {user?.major && (
                <div>
                  <strong>Major:</strong> {user.major}
                </div>
              )}
              {user?.interests && user.interests.length > 0 && (
                <div>
                  <strong>Interests:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {user.interests.map(interest => (
                      <span key={interest} className="event-type-badge" style={{ fontSize: '0.8rem' }}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="card">
          <h3 className="mb-4">Account Settings</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Account Type:</strong> {user?.role === 'admin' ? '👑 Administrator' : '🎓 Student'}
            </div>
            <div>
              <strong>Member Since:</strong> {new Date(user?.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Last Updated:</strong> {new Date(user?.updatedAt).toLocaleDateString()}
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0' }} />

          {/* Password Change */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4>Password & Security</h4>
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn btn-secondary btn-sm"
              >
                🔐 Change Password
              </button>
            </div>

            {showPasswordForm && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                    className="form-input"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                    className="form-input"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="btn btn-warning"
                  >
                    {changingPassword ? 'Changing...' : '🔄 Update Password'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr style={{ margin: '1.5rem 0' }} />

          {/* Notification Settings */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4>🔔 Notification Settings</h4>
              <button 
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="btn btn-secondary btn-sm"
              >
                {showNotificationSettings ? 'Hide' : 'Manage'}
              </button>
            </div>

            {showNotificationSettings && (
              <div style={{ display: 'grid', gap: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPreferences.emailReminders}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        emailReminders: e.target.checked
                      }))}
                    />
                    <span><strong>📧 Email Reminders</strong></span>
                  </label>
                  <p className="text-sm text-gray mt-1">
                    Receive email notifications for your registered events
                  </p>
                </div>

                {notificationPreferences.emailReminders && (
                  <>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={notificationPreferences.notificationPreferences.eventReminders}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              eventReminders: e.target.checked
                            }
                          }))}
                        />
                        <span><strong>Event Reminders</strong></span>
                      </label>
                      <p className="text-sm text-gray mb-3">
                        Get reminded before your registered events start
                      </p>

                      {notificationPreferences.notificationPreferences.eventReminders && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Reminder Timing:</p>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notificationPreferences.notificationPreferences.reminderTiming.includes('24h')}
                                onChange={() => handleReminderTimingChange('24h')}
                              />
                              <span>24 hours before</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notificationPreferences.notificationPreferences.reminderTiming.includes('1h')}
                                onChange={() => handleReminderTimingChange('1h')}
                              />
                              <span>1 hour before</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationPreferences.notificationPreferences.marketingEmails}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              marketingEmails: e.target.checked
                            }
                          }))}
                        />
                        <span><strong>Campus Updates</strong></span>
                      </label>
                      <p className="text-sm text-gray mt-1">
                        Receive updates about new features and campus announcements
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={handleNotificationUpdate}
                    className="btn btn-primary btn-sm"
                  >
                    💾 Save Preferences
                  </button>
                  <button 
                    onClick={() => setShowNotificationSettings(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#e3f2fd', borderRadius: '6px', marginTop: '1rem' }}>
                  <p className="text-sm" style={{ color: '#1565c0', margin: 0 }}>
                    💡 <strong>Tip:</strong> You'll only receive reminders for events you've registered for. 
                    Email reminders help ensure you never miss an important campus event!
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr style={{ margin: '1.5rem 0' }} />

          {/* Quick Actions */}
          <div>
            <h4 className="mb-3">Quick Actions</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <Link to="/my-events" className="btn btn-secondary btn-sm">
                📅 My Events
              </Link>
              <button 
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="btn btn-secondary btn-sm"
              >
                🔔 Notification Settings
              </button>
              <button 
                onClick={() => {
                  apiHelpers.clearAuthData()
                  navigate('/')
                }}
                className="btn btn-warning btn-sm"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
