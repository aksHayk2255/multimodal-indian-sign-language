import { useState, useRef, useCallback, useEffect } from 'react';
import { speechService } from '../services/speechService';

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback((language = 'en') => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);

    if (!speechService.isSpeechRecognitionSupported()) {
      setError('Speech Recognition is not supported by your browser. Please try Google Chrome or Edge.');
      return false;
    }

    try {
      const recognition = speechService.createRecognitionInstance({
        language,
        continuous: true,
        interimResults: true,
        onResult: ({ final, interim }) => {
          if (final) {
            setTranscript((prev) => (prev ? `${prev} ${final}` : final).trim());
          }
          setInterimTranscript(interim);
        },
        onError: (err) => {
          console.error('Speech recognition error:', err);
          if (err === 'not-allowed') {
            setError('Microphone permission was denied. Please allow microphone access.');
            setHasPermission(false);
          } else if (err === 'no-speech') {
            // Keep listening, do not fail
          } else {
            setError(`Speech recognition error: ${err}`);
          }
          stopRecording();
        },
        onEnd: () => {
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        },
      });

      if (!recognition) {
        setError('Failed to initialize speech recognition engine.');
        return false;
      }

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setHasPermission(true);

      // Start duration counter
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return true;
    } catch (err) {
      console.error('Failed to start microphone:', err);
      setError('Could not start microphone recording.');
      setIsRecording(false);
      return false;
    }
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    duration,
    transcript,
    interimTranscript,
    hasPermission,
    error,
    startRecording,
    stopRecording,
    clearTranscript: () => {
      setTranscript('');
      setInterimTranscript('');
      setDuration(0);
    },
  };
};
