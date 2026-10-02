import api from './api';

export const historyService = {
  async getConversations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/history/${query ? `?${query}` : ''}`;
    const response = await api.get(url);
    return response.data?.conversations || [];
  },

  async getConversation(id) {
    const response = await api.get(`/history/${id}/`);
    return response.data;
  },

  async createConversation(data) {
    const response = await api.post('/history/', data);
    return response.data;
  },

  async deleteConversation(id) {
    const response = await api.delete(`/history/${id}/`);
    return response.data;
  },

  async sendMessage(messageData) {
    const response = await api.post('/communication/send/', messageData);
    return response.data;
  },
};
