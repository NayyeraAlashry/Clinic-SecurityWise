import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const url = config?.url || '';
  // Check if it's an auth endpoint - more robust check
  const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  const token = localStorage.getItem('token');
  
  // Only add token if it exists and is not a mock token
  if (token && !isAuthEndpoint && token !== 'null' && token !== 'undefined') {
    // For Axios 1.x, we should ensure headers object exists and set it properly
    if (!config.headers) {
      config.headers = {};
    }
    
    // Support both object-style and AxiosHeaders style
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear token if it's a genuine 401, not on a login attempt,
    // and not if we explicitly asked to skip clearing (e.g. during role inference)
    if (
      error?.response?.status === 401 && 
      !error.config?.url?.includes('/auth/login') &&
      !error.config?._skipAuthError
    ) {
      console.warn('Unauthorized request, clearing local storage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
