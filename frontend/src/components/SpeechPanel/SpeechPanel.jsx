import React from 'react';
import { Mic, MicOff, Volume2, Trash2, ArrowRight, Languages } from 'lucide-react';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

export const SpeechPanel = ({
  isRecording,
  duration = 0,
  transcript = '',
  interimTranscript = '',
  translatedText = '',
  language = 'en',
  targetLanguage = 'hi',
  onLanguageChange,
  onTargetLanguageChange,
  onToggleRecording,
  onClear,
  onSpeak,
  onSendToConversation,
  error,
}) => {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Language Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Speech Recognition</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector
            label="Spoken Lang:"
            value={language}
            onChange={onLanguageChange}
            id="speech-source-lang"
          />
          <LanguageSelector
            label="Translate To:"
            value={targetLanguage}
            onChange={onTargetLanguageChange}
            id="speech-target-lang"
          />
        </div>
      </div>

      {/* Main Microphone Interaction Zone */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          gap: '16px',
        }}
      >
        <button
          onClick={onToggleRecording}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: isRecording ? 'var(--status-error)' : 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRecording ? '0 0 0 10px rgba(239, 68, 68, 0.25)' : 'var(--shadow-md)',
            animation: isRecording ? 'pulse 1.2s infinite' : 'none',
            transition: 'var(--transition)',
          }}
        >
          {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isRecording ? 'var(--status-error)' : 'var(--text-primary)' }}>
            {isRecording ? `Recording... (${formatTime(duration)})` : 'Click Microphone to Speak'}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Speak naturally into your device microphone
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid var(--status-error)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Spoken Text Transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Speech to Text Transcript:
          </span>
          {displayText && (
            <button
              onClick={onClear}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: 'auto' }}
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            minHeight: '70px',
            fontSize: '1.1rem',
            color: displayText ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayText || 'Your spoken words will appear here in real-time...'}
        </div>
      </div>

      {/* Translation Output */}
      {translatedText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
            Translation ({targetLanguage}):
          </span>
          <div
            style={{
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              fontSize: '1.1rem',
              color: '#5eead4',
              fontWeight: 500,
            }}
          >
            {translatedText}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button
          onClick={onSpeak}
          disabled={!displayText && !translatedText}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          <Volume2 size={18} />
          <span>Vocalize (TTS)</span>
        </button>

        {onSendToConversation && (
          <button
            onClick={onSendToConversation}
            disabled={!displayText}
            className="btn btn-primary"
            style={{ flex: 1.2 }}
          >
            <span>Send to Conversation</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SpeechPanel;
