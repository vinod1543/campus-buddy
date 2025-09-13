import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (unauthorized) errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Return a more user-friendly error message
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  clearInterests: () => api.put('/auth/clear-interests'),
  updateNotificationPreferences: (preferences) => api.put('/auth/notification-preferences', preferences),
  uploadProfilePicture: (formData) => {
    return api.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProfilePicture: () => api.delete('/auth/delete-profile-picture'),
};

// Events API
export const eventsAPI = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  getMyCreated: () => api.get('/events/my/created'),
  getAdminDashboard: () => api.get('/events/admin/dashboard'),
};

// Registrations API
export const registrationsAPI = {
  register: (eventId) => api.post('/registrations', { eventId }),
  getMyRegistrations: (params = {}) => api.get('/registrations/my', { params }),
  cancel: (eventId) => api.delete(`/registrations/${eventId}`),
  getForEvent: (eventId, params = {}) => api.get(`/registrations/event/${eventId}`, { params }),
  checkStatus: (eventId) => api.get(`/registrations/check/${eventId}`),
  updateStatus: (eventId, userId, status) => api.put(`/registrations/${eventId}/user/${userId}`, { status }),
};

// Helper functions for common operations
export const apiHelpers = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Get stored user data
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Store auth data
  setAuthData: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Format error message for display
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  },
};

export default api;
