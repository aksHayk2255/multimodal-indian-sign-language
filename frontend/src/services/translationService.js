import api from './api';

export const translationService = {
  async translate(text, sourceLanguage = 'en', targetLanguage = 'hi') {
    if (!text || !text.trim()) {
      return { translated_text: '' };
    }
    const response = await api.post('/translate/', {
      text: text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    });
    return response.data;
  },

  async getSupportedLanguages() {
    const response = await api.get('/translate/languages/');
    return response.data?.languages || [];
  },
};
