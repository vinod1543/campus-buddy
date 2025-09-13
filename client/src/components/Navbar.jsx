import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { apiHelpers } from '../api'

const Navbar = () => {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef(null)
  const isAuthenticated = apiHelpers.isAuthenticated()
  const user = apiHelpers.getCurrentUser()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    apiHelpers.clearAuthData()
    navigate('/')
    setShowProfileMenu(false)
  }

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            Campus Event Buddy 🎓
          </Link>
          
          <ul className="nav-links">
            <li>
              <Link to="/events" className="nav-link">
                Browse Events
              </Link>
            </li>
            
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/my-events" className="nav-link">
                    My Events
                  </Link>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="nav-link" style={{ color: 'var(--accent-orange)', fontWeight: '600' }}>
                      🛠️ Admin
                    </Link>
                  </li>
                )}
                
                {/* Profile Dropdown */}
                <li className="profile-dropdown" style={{ position: 'relative' }} ref={profileRef}>
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="profile-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: user?.profilePicture ? 'transparent' : 'var(--primary-blue)', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        overflow: 'hidden',
                        border: '2px solid var(--border-color)',
                        backgroundImage: user?.profilePicture ? `url(${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.profilePicture})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!user?.profilePicture && (user?.name?.charAt(0)?.toUpperCase() || '?')}
                    </div>
                    <span>{user?.name}</span>
                    <span style={{ fontSize: '0.8rem', transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  
                  {showProfileMenu && (
                    <div 
                      className="profile-menu"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        minWidth: '200px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        marginTop: '0.5rem',
                        animation: 'fadeIn 0.2s ease-out'
                      }}
                    >
                      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {user?.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {user?.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <span className="event-type-badge" style={{ fontSize: '0.7rem' }}>
                            {user?.role === 'admin' ? '� Admin' : '🎓 Student'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ padding: '0.5rem' }}>
                        <Link 
                          to="/profile" 
                          className="profile-menu-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background-light)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          👤 View Profile
                        </Link>
                        
                        <Link 
                          to="/profile/settings" 
                          className="profile-menu-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background-light)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          ⚙️ Settings
                        </Link>
                        
                        <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                        
                        <button 
                          onClick={handleLogout}
                          className="profile-menu-item"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            textAlign: 'left',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background-light)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="nav-link">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Join Us
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
