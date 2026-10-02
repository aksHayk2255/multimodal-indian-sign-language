import api from './api';

export const signLanguageService = {
  async predictFrame(features) {
    const response = await api.post('/sign-language/predict/', {
      mode: 'frame',
      features: features,
    });
    return response.data;
  },

  async predictSequence(sequence) {
    const response = await api.post('/sign-language/predict/', {
      mode: 'sequence',
      sequence: sequence,
    });
    return response.data;
  },

  async getModelStatus(reload = false) {
    const response = await api.get(`/sign-language/status/${reload ? '?reload=true' : ''}`);
    return response.data;
  },

  async clearSentence() {
    const response = await api.post('/sign-language/clear/');
    return response.data;
  }
};
