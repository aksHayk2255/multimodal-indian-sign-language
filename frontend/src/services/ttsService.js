import api from './api';

const BROWSER_LANG_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  ml: 'ml-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

export const ttsService = {
  // Speaks using client-side Web Speech Synthesis API
  speakBrowser(text, lang = 'en', onEnd = null) {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return false;
    }

    window.speechSynthesis.cancel(); // Stop any pending utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BROWSER_LANG_MAP[lang] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  },

  // Calls backend gTTS endpoint for server-side synthesis
  async synthesizeServer(text, lang = 'en') {
    try {
      const response = await api.post('/speech/tts/', {
        text: text,
        language: lang,
      });
      return response.data?.audio_url;
    } catch (err) {
      console.warn('Server TTS synthesis failed, will fall back to browser TTS:', err);
      return null;
    }
  },

  // High-level speak: attempts browser TTS first for ultra-low latency, or plays server audio
  async speak(text, lang = 'en', onEnd = null) {
    if (!text || !text.trim()) return;

    const browserSuccess = this.speakBrowser(text, lang, onEnd);
    if (!browserSuccess) {
      const audioUrl = await this.synthesizeServer(text, lang);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        if (onEnd) {
          audio.onended = onEnd;
          audio.onerror = onEnd;
        }
        audio.play().catch((e) => console.error('Audio playback failed:', e));
      }
    }
  }
};
