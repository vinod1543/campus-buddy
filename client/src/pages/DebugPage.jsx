import { Link } from 'react-router-dom'
import { apiHelpers } from '../api'

const DebugPage = () => {
  const isAuthenticated = apiHelpers.isAuthenticated()
  const user = apiHelpers.getCurrentUser()
  const token = localStorage.getItem('token')

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <h1>🐛 Debug Information</h1>
        
        <div className="mb-4">
          <h3>Authentication Status</h3>
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Has Token:</strong> {token ? '✅ Yes' : '❌ No'}</p>
          {token && (
            <details className="mb-2">
              <summary>Token (click to expand)</summary>
              <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>{token}</pre>
            </details>
          )}
        </div>

        <div className="mb-4">
          <h3>User Information</h3>
          {user ? (
            <div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Is Admin:</strong> {user.role === 'admin' ? '✅ Yes' : '❌ No'}</p>
              <details className="mb-2">
                <summary>Full User Object</summary>
                <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>{JSON.stringify(user, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <p>❌ No user data found</p>
          )}
        </div>

        <div className="mb-4">
          <h3>Local Storage</h3>
          <p><strong>All Keys:</strong></p>
          <ul>
            {Object.keys(localStorage).map(key => (
              <li key={key}>{key}: {localStorage.getItem(key)?.substring(0, 50)}...</li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h3>Quick Actions</h3>
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-primary">
              🔑 Login
            </Link>
            <Link to="/admin" className="btn btn-secondary">
              🛠️ Admin Dashboard
            </Link>
            <Link to="/" className="btn btn-secondary">
              🏠 Home
            </Link>
            <button 
              onClick={() => {
                apiHelpers.clearAuthData()
                window.location.reload()
              }}
              className="btn btn-warning"
            >
              🗑️ Clear Auth Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugPage
