import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMicrophone } from '../../hooks/useMicrophone';
import { useAuth } from '../../hooks/useAuth';
import { translationService } from '../../services/translationService';
import { ttsService } from '../../services/ttsService';
import { historyService } from '../../services/historyService';
import SpeechPanel from '../../components/SpeechPanel/SpeechPanel';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

export const Speech = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    isRecording,
    duration,
    transcript,
    interimTranscript,
    hasPermission,
    error: micError,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useMicrophone();

  const [language, setLanguage] = useState(profile.preferred_language || 'en');
  const [targetLanguage, setTargetLanguage] = useState(profile.target_language || 'hi');
  const [translatedText, setTranslatedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-translate transcript as user speaks
  useEffect(() => {
    const fullText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!fullText) {
      setTranslatedText('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await translationService.translate(fullText, language, targetLanguage);
        setTranslatedText(res.translated_text);
      } catch (err) {
        console.warn('Translation failed:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [transcript, interimTranscript, language, targetLanguage]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(language);
    }
  };

  const handleSpeak = () => {
    const textToSpeak = translatedText || transcript;
    const lang = translatedText ? targetLanguage : language;
    setIsSpeaking(true);
    ttsService.speak(textToSpeak, lang, () => setIsSpeaking(false));
  };

  const handleSendToConversation = async () => {
    const fullText = transcript.trim();
    if (!fullText) return;

    try {
      await historyService.sendMessage({
        sender: 'speech_user',
        message_type: 'speech_transcript',
        original_text: fullText,
        translated_text: translatedText,
        source_language: language,
        target_language: targetLanguage,
      });
      navigate('/conversation');
    } catch (err) {
      console.error('Failed to send to conversation:', err);
      navigate('/conversation');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Speech Recognition & Multilingual Mode</span>
          <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
            Flow 2 & 3
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Capture spoken voice from hearing individuals, transcribe to high-contrast text, and translate in real-time.
        </p>
      </div>

      <SpeechPanel
        isRecording={isRecording}
        duration={duration}
        transcript={transcript}
        interimTranscript={interimTranscript}
        translatedText={translatedText}
        language={language}
        targetLanguage={targetLanguage}
        onLanguageChange={setLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onToggleRecording={handleToggleRecording}
        onClear={clearTranscript}
        onSpeak={handleSpeak}
        onSendToConversation={handleSendToConversation}
        error={micError}
      />
    </div>
  );
};

export default Speech;
