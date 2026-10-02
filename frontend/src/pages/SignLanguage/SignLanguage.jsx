import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { useAuth } from '../../hooks/useAuth';
import { signLanguageService } from '../../services/signLanguageService';
import { translationService } from '../../services/translationService';
import { ttsService } from '../../services/ttsService';
import { historyService } from '../../services/historyService';
import { landmarkTracker } from '../../services/landmarkTracker';
import WebcamPanel from '../../components/WebcamPanel/WebcamPanel';
import RecognitionPanel from '../../components/RecognitionPanel/RecognitionPanel';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { CORE_ISL_SIGNS, SUPPORTED_LANGUAGES } from '../../utils/constants';
import { Sparkles } from 'lucide-react';

export const SignLanguage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    hasPermission,
    error: cameraError,
    startCamera,
    stopCamera,
  } = useCamera();

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [modelStatus, setModelStatus] = useState({ loaded: false, status_message: 'Checking...' });
  const [detectedSign, setDetectedSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [sentence, setSentence] = useState('');
  const [translatedSentence, setTranslatedSentence] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(profile.target_language || 'hi');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
    hasHands: false,
    hasPose: false,
    leftHand: false,
    rightHand: false,
    fps: 0,
  });

  const isRecognizingRef = useRef(false);
  const animationFrameIdRef = useRef(null);
  const lastInferenceTimeRef = useRef(0);
  const isInferringRef = useRef(false);

  // Keep isRecognizingRef in sync
  useEffect(() => {
    isRecognizingRef.current = isRecognizing;
  }, [isRecognizing]);

  // 1. Initialize MediaPipe local models & Check Model Status on load
  const checkModelStatus = useCallback(async () => {
    try {
      const status = await signLanguageService.getModelStatus();
      setModelStatus(status);
      if (status.constructed_sentence) {
        setSentence(status.constructed_sentence);
      }
    } catch (err) {
      setModelStatus({ loaded: false, status_message: 'Backend server unavailable.' });
    }
  }, []);

  useEffect(() => {
    checkModelStatus();
    landmarkTracker.initialize();
  }, [checkModelStatus]);

  // 2. High-Performance Real-Time Tracking & Inference Animation Loop
  useEffect(() => {
    if (!isActive) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setTrackingStats({
        hasHands: false,
        hasPose: false,
        leftHand: false,
        rightHand: false,
        fps: 0,
      });
      return;
    }

    let isMounted = true;

    const runTrackingLoop = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2) {
        try {
          const telemetry = await landmarkTracker.processFrame(video, canvas);
          if (telemetry && isMounted) {
            setTrackingStats({
              hasHands: telemetry.hasHands,
              hasPose: telemetry.hasPose,
              leftHand: telemetry.leftHandDetected,
              rightHand: telemetry.rightHandDetected,
              fps: telemetry.fps,
            });

            // If recognition is active, dispatch asynchronous backend inference
            const now = performance.now();
            if (
              isRecognizingRef.current &&
              now - lastInferenceTimeRef.current >= 180 &&
              !isInferringRef.current
            ) {
              // Indian Sign Language requires active hands in the signing space
              if (telemetry.hasHands) {
                lastInferenceTimeRef.current = now;
                isInferringRef.current = true;

                // Predict on full 30-frame sequence if buffered, otherwise on latest frame
                const inferencePromise = telemetry.isSequenceFull
                  ? signLanguageService.predictSequence(telemetry.currentSequence)
                  : signLanguageService.predictFrame(telemetry.featureVector);

                inferencePromise
                  .then((res) => {
                    if (!isMounted) return;
                    if (res && res.model_loaded) {
                      const detected = res.sign;
                      if (detected && detected !== 'IDLE' && detected !== 'REST') {
                        setDetectedSign(detected);
                        setConfidence(res.confidence || 0);

                        if (res.sentence) {
                          setSentence(res.sentence);
                        }

                        if (profile.auto_speak && res.is_new_sign) {
                          ttsService.speak(detected, 'en');
                        }
                      } else {
                        // Resting / Idle in between signs
                        setDetectedSign(null);
                        setConfidence(0);
                      }
                    }
                  })
                  .catch(() => {})
                  .finally(() => {
                    isInferringRef.current = false;
                  });
              } else {
                // No hands detected in frame: Signer is resting
                setDetectedSign(null);
                setConfidence(0);
              }
            }
          }
        } catch (err) {
          // Handled silently to avoid breaking the animation frame
        }
      }

      if (isMounted) {
        animationFrameIdRef.current = requestAnimationFrame(runTrackingLoop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(runTrackingLoop);

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isActive, profile.auto_speak]);

  // 3. Handle Camera toggle
  const handleToggleCamera = async () => {
    if (isActive) {
      handleStopRecognizing();
      stopCamera();
      landmarkTracker.clearBuffer();
    } else {
      await startCamera();
    }
  };

  // 4. Start / Stop Recognition
  const handleStartRecognizing = () => {
    if (!isActive) {
      startCamera();
    }
    setIsRecognizing(true);
  };

  const handleStopRecognizing = () => {
    setIsRecognizing(false);
    landmarkTracker.clearBuffer();
  };

  // 5. Automatic translation when sentence changes
  useEffect(() => {
    if (!sentence) {
      setTranslatedSentence('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await translationService.translate(sentence, 'en', targetLanguage);
        setTranslatedSentence(res.translated_text);
      } catch (err) {
        console.warn('Translation notice:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [sentence, targetLanguage]);

  // 6. Manual Sign Simulation (Full demo reliability)
  const handleTriggerSimulatedSign = async (sign) => {
    setDetectedSign(sign);
    setConfidence(0.96);

    const newTokens = sentence ? sentence.replace(/\.$/, '').split(' ') : [];
    newTokens.push(sign);
    const newSentence = newTokens.join(' ').toLowerCase();
    const formatted = newSentence.charAt(0).toUpperCase() + newSentence.slice(1) + '.';
    setSentence(formatted);

    if (profile.auto_speak) {
      ttsService.speak(sign, 'en');
    }
  };

  // 7. Clear sentence
  const handleClearSentence = async () => {
    try {
      await signLanguageService.clearSentence();
    } catch (e) {}
    setSentence('');
    setTranslatedSentence('');
    setDetectedSign(null);
    setConfidence(0);
    landmarkTracker.clearBuffer();
  };

  // 8. Vocalize (TTS)
  const handleSpeak = () => {
    const textToSpeak = translatedSentence || sentence;
    const lang = translatedSentence ? targetLanguage : 'en';
    setIsSpeaking(true);
    ttsService.speak(textToSpeak, lang, () => setIsSpeaking(false));
  };

  // 9. Send to Conversation
  const handleSendToConversation = async () => {
    if (!sentence) return;
    try {
      await historyService.sendMessage({
        sender: 'sign_user',
        message_type: 'isl_sign',
        original_text: sentence,
        translated_text: translatedSentence,
        confidence: confidence || 0.95,
        source_language: 'en',
        target_language: targetLanguage,
      });
      navigate('/conversation');
    } catch (err) {
      console.error('Failed to send to conversation:', err);
      navigate('/conversation');
    }
  };

  const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>ISL Gesture Translator</span>
            <span className="badge badge-info" style={{ fontSize: '0.8rem' }}>
              Flow 1: Sign → Speech
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Real-time MediaPipe dual-hand + pose tracking analyzed with temporal sequence deep learning.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector
            label="Translate Output To:"
            value={targetLanguage}
            onChange={setTargetLanguage}
            id="isl-target-lang"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid-2">
        {/* LEFT COLUMN: Webcam Preview & Camera Controls */}
        <WebcamPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          isActive={isActive}
          isLoading={isLoading}
          hasPermission={hasPermission}
          error={cameraError}
          isRecognizing={isRecognizing}
          trackingStats={trackingStats}
          onStartRecognizing={handleStartRecognizing}
          onStopRecognizing={handleStopRecognizing}
          onToggleCamera={handleToggleCamera}
        />

        {/* RIGHT COLUMN: Real-time Recognition & Constructed Sentence */}
        <RecognitionPanel
          detectedSign={detectedSign}
          confidence={confidence}
          sentence={sentence}
          translatedSentence={translatedSentence}
          targetLanguageName={targetLangObj?.name || 'Hindi'}
          modelStatus={modelStatus}
          onSpeak={handleSpeak}
          onClear={handleClearSentence}
          onSendToConversation={handleSendToConversation}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Interactive Demonstration Panel */}
      <div
        className="card"
        style={{
          border: '1px dashed var(--border-color)',
          backgroundColor: 'rgba(23, 31, 44, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Interactive Demo Gesture Triggers</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Instant gesture trigger across all 15 trained ISL signs
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {CORE_ISL_SIGNS.map((sign) => (
            <button
              key={sign}
              onClick={() => handleTriggerSimulatedSign(sign)}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.88rem', minHeight: '38px' }}
            >
              + {sign}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignLanguage;
