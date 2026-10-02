import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    if (response.success && response.data.token) {
      localStorage.setItem('isl_auth_token', response.data.token);
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login/', credentials);
    if (response.success && response.data.token) {
      localStorage.setItem('isl_auth_token', response.data.token);
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout/');
    } finally {
      localStorage.removeItem('isl_auth_token');
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile/', profileData);
    return response.data;
  },

  async getSettings() {
    const response = await api.get('/settings/');
    return response.data;
  },

  async updateSettings(settingsData) {
    const response = await api.put('/settings/', settingsData);
    return response.data;
  },

  getToken() {
    return localStorage.getItem('isl_auth_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('isl_auth_token');
  }
};
