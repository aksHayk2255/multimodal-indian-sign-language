import React from 'react';
import { Volume2, Trash2, ArrowRight, Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import ConfidenceIndicator from '../ConfidenceIndicator/ConfidenceIndicator';

export const RecognitionPanel = ({
  detectedSign,
  confidence = 0,
  sentence = '',
  translatedSentence = '',
  targetLanguageName = 'Hindi',
  modelStatus,
  onSpeak,
  onClear,
  onSendToConversation,
  isSpeaking = false,
}) => {
  const isModelLoaded = modelStatus?.loaded;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Model Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recognition Results</h2>
        </div>

        <div>
          {isModelLoaded ? (
            <span className="badge badge-success" title={modelStatus?.status_message}>
              <CheckCircle2 size={14} />
              <span>Model Loaded</span>
            </span>
          ) : (
            <span className="badge badge-warning" title={modelStatus?.status_message}>
              <AlertCircle size={14} />
              <span>Model Unavailable</span>
            </span>
          )}
        </div>
      </div>

      {/* Model Not Trained Warning (Strict requirement: Never fake AI predictions) */}
      {!isModelLoaded && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning)',
            borderRadius: 'var(--radius-md)',
            color: '#fde68a',
            fontSize: '0.85rem',
            lineHeight: 1.4,
          }}
        >
          <strong>Notice:</strong> ISL model not trained yet.
          <p style={{ marginTop: '4px' }}>
            Run <code>python -m ml.training.train</code> to train the temporal BiLSTM model.
          </p>
        </div>
      )}

      {/* Detected Sign Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Current Detected Sign
        </span>

        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: detectedSign ? 'var(--text-primary)' : 'var(--text-muted)',
            letterSpacing: '1px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {detectedSign || '—'}
        </div>

        <div style={{ width: '100%', maxWidth: '280px', marginTop: '6px' }}>
          <ConfidenceIndicator confidence={confidence} />
        </div>
      </div>

      {/* Constructed Sentence Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Constructed Sentence:
          </span>
          {sentence && (
            <button
              onClick={onClear}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: 'auto' }}
              title="Clear Sentence"
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
            minHeight: '64px',
            fontSize: '1.1rem',
            fontWeight: 500,
            color: sentence ? 'var(--text-primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {sentence || 'Sentence will build dynamically as signs are recognized...'}
        </div>
      </div>

      {/* Multilingual Translation Output */}
      {translatedSentence && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
            Translation ({targetLanguageName}):
          </span>
          <div
            style={{
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              fontSize: '1.05rem',
              color: '#5eead4',
              fontWeight: 500,
            }}
          >
            {translatedSentence}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button
          onClick={onSpeak}
          disabled={!sentence && !translatedSentence}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          <Volume2 size={18} />
          <span>{isSpeaking ? 'Speaking...' : '🔊 Speak'}</span>
        </button>

        {onSendToConversation && (
          <button
            onClick={onSendToConversation}
            disabled={!sentence}
            className="btn btn-secondary"
            style={{ flex: 1.2 }}
          >
            <span>Send to Conversation</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RecognitionPanel;
