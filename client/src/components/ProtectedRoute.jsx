import { Navigate } from 'react-router-dom'
import { apiHelpers } from '../api'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const isAuthenticated = apiHelpers.isAuthenticated()
  const user = apiHelpers.getCurrentUser()

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if admin access is required
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
