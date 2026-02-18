import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Request interceptor to add auth token
API.interceptors.request.use(
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

// Response interceptor to handle auth errors
let isShowingAuthError = false;
const toastGate = new Map();

const showToastOnce = (key, message, ttlMs = 3000) => {
  const now = Date.now();
  const last = toastGate.get(key) || 0;
  if (now - last < ttlMs) return;
  toastGate.set(key, now);
  toast.error(message);
};

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete API.defaults.headers.common['Authorization'];
      
      // Only show one auth error toast at a time
      const currentPath = window.location.pathname;
      const isAuthPage = ['/login', '/register', '/verify-otp', '/'].includes(currentPath);
      
      if (!isAuthPage && !isShowingAuthError) {
        isShowingAuthError = true;
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
          isShowingAuthError = false;
        }, 1500);
      }
    } else if (error.response?.status === 403) {
      showToastOnce('forbidden', 'Access denied.');
    } else if (error.response?.status >= 500) {
      // Only show server error for user-initiated actions
      if (!error.config?.url?.includes('/pets/my-pets') && !error.config?.url?.includes('/matches')) {
        showToastOnce('server-error', 'Server error. Please try again.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
