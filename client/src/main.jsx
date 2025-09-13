import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CreateEventPage from './pages/CreateEventPage.jsx'
import EditEventPage from './pages/EditEventPage.jsx'
import EventParticipantsPage from './pages/EventParticipantsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import DebugPage from './pages/DebugPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './styles/globals.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'events',
        element: <EventsPage />
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />
      },
      {
        path: 'my-events',
        element: (
          <ProtectedRoute>
            <MyEventsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile/settings',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/create-event',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <CreateEventPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/edit-event/:id',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <EditEventPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/event-participants/:id',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <EventParticipantsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'debug',
        element: <DebugPage />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
