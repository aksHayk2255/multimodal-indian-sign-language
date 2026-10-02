import api from './api';

const BROWSER_ASR_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

export const speechService = {
  // Checks if browser supports Speech Recognition
  isSpeechRecognitionSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  // Creates and configures a browser speech recognition instance
  createRecognitionInstance({
    language = 'en',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
    onEnd,
  }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = BROWSER_ASR_MAP[language] || 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({ final, interim });
      }
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  },

  // Backend audio transcription fallback
  async transcribeAudio(audioBlob, language = 'en') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('language', language);

    const response = await api.post('/speech/transcribe/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
