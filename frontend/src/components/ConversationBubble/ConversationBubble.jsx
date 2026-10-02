import React from 'react';
import { Video, Mic, Volume2, Globe } from 'lucide-react';
import { ttsService } from '../../services/ttsService';

export const ConversationBubble = ({ message, targetLanguage = 'hi' }) => {
  const isSignUser = message.sender === 'sign_user';

  const handleSpeak = () => {
    const textToSpeak = message.translated_text || message.original_text;
    const lang = message.translated_text ? targetLanguage : 'en';
    ttsService.speak(textToSpeak, lang);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSignUser ? 'flex-start' : 'flex-end',
        margin: '12px 0',
        width: '100%',
      }}
    >
      {/* Sender Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          padding: '0 4px',
        }}
      >
        {isSignUser ? (
          <>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#60a5fa',
                fontWeight: 600,
              }}
            >
              <Video size={14} />
              <span>ISL Sign User</span>
            </span>
            {message.confidence && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                {Math.round(message.confidence * 100)}% conf
              </span>
            )}
          </>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#34d399',
              fontWeight: 600,
            }}
          >
            <Mic size={14} />
            <span>Speech User</span>
          </span>
        )}
        {formattedTime && <span>• {formattedTime}</span>}
      </div>

      {/* Bubble Content */}
      <div
        style={{
          maxWidth: '80%',
          backgroundColor: isSignUser ? 'var(--bg-card)' : 'var(--bg-secondary)',
          border: `1px solid ${isSignUser ? 'var(--border-focus)' : 'var(--accent-secondary)'}`,
          borderRadius: isSignUser
            ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)'
            : 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Original text */}
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {message.original_text}
        </div>

        {/* Translated text if present */}
        {message.translated_text && (
          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              color: '#5eead4',
              fontSize: '0.95rem',
            }}
          >
            <Globe size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
            <span>{message.translated_text}</span>
          </div>
        )}

        {/* TTS Playback action */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSpeak}
            aria-label="Vocalize message"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: 'auto', gap: '4px' }}
          >
            <Volume2 size={13} />
            <span>Listen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationBubble;
