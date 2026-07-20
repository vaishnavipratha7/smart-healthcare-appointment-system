import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // SECURITY FIX: 30-second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

let errorCallback = null;

export const registerApiErrorCallback = (cb) => {
  errorCallback = cb;
};

// Add token to requests if it exists
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle response errors and automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh itself fails (401 on refresh endpoint)
    if (error.response?.status === 401 && originalRequest.url.includes('/auth/refresh')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { token } = response.data;

        localStorage.setItem('token', token);

        // Update user payload in storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.token = token;
          localStorage.setItem('user', JSON.stringify(userObj));
        }

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Trigger toast error notification via callback if registered
    if (errorCallback) {
      // Don't show toast for 401s that are being refreshed, only if it finally failed
      const isAuthError = error.response?.status === 401;
      if (!isAuthError) {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        const validationErrors = error.response?.data?.errors;
        
        if (validationErrors && Array.isArray(validationErrors)) {
          validationErrors.forEach((err) => {
            errorCallback(`${err.field ? `${err.field}: ` : ''}${err.message}`, 'error');
          });
        } else {
          errorCallback(message, 'error');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;