import axios from 'axios';

const API_BASE = '/api';

// Create Axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};


// ─── Prediction API ───────────────────────────────────────────────────────
export const predictionAPI = {
  predict: (data) => api.post('/predict', data),
};

// ─── History API ──────────────────────────────────────────────────────────
export const historyAPI = {
  getHistory: (params) => api.get('/history', { params }),
  getStats: () => api.get('/history/stats'),
};

// ─── Weather API ──────────────────────────────────────────────────────────
export const weatherAPI = {
  getWeather: (lat, lon) => api.get('/weather', { params: { lat, lon } }),
};

// ─── IoT API ──────────────────────────────────────────────────────────────
export const iotAPI = {
  getSensorData: () => api.get('/iot-data'),
};

// ─── Disease API ──────────────────────────────────────────────────────────
export const diseaseAPI = {
  detectDisease: (formData) => api.post('/disease/detect', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getHistory: () => api.get('/disease/history'),
};

// ─── Feedback API (Active Learning) ───────────────────────────────────────
export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback', data),
  getDiseaseClasses: () => api.get('/feedback/classes'),
};

export default api;
