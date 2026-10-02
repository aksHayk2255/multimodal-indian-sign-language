import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Auth Token if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('isl_auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize API responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to the backend server. Please verify Django is running.',
    };
    return Promise.reject(errorData);
  }
);

export default api;
