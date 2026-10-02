import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Mic,
  Languages,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const Landing = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '60px 20px 40px',
          maxWidth: '960px',
          margin: '0 auto',
          gap: '24px',
        }}
      >
        <div
          className="badge badge-info"
          style={{ padding: '8px 16px', fontSize: '0.9rem', gap: '8px' }}
        >
          <Sparkles size={16} />
          <span>Bi-Directional Multimodal Communication Platform</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
          }}
        >
          AI-Powered Multimodal{' '}
          <span style={{ color: 'var(--accent-primary)' }}>Indian Sign Language</span>{' '}
          Assistant
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '750px',
            lineHeight: 1.6,
          }}
        >
          Bridging the communication gap between Indian Sign Language (ISL) users and non-signers.
          Combining deep learning temporal gesture recognition, real-time speech recognition,
          multilingual Indian language translation, and text-to-speech.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <Link to="/sign-language" className="btn btn-primary btn-lg">
            <span>Start Communicating</span>
            <ArrowRight size={20} />
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            <span>Explore Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Core Communication Flows (Flow 1, Flow 2, Flow 3) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Core Communication Flows</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time multimodal pipeline built for high accuracy and accessibility.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Flow 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Video size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Flow 1: ISL → Text → Speech</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Continuous video capture through webcam extracted via MediaPipe landmarks (hands + upper pose),
              analyzed by a temporal BiLSTM deep learning sequence model, constructed into sentences, and vocalized via TTS.
            </p>
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                marginTop: 'auto',
              }}
            >
              Webcam → MediaPipe → Temporal Buffer → BiLSTM → Sentence → TTS Audio
            </div>
          </div>

          {/* Flow 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-success)',
              }}
            >
              <Mic size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Flow 2: Speech → Text</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Microphone audio captured from hearing speakers transcribed instantaneously with Automatic Speech
              Recognition (ASR), detecting spoken dialect and displaying high-contrast readable text for the deaf user.
            </p>
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                marginTop: 'auto',
              }}
            >
              Microphone → Audio Capture → ASR Engine → Text Display → Visual Feed
            </div>
          </div>

          {/* Flow 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)',
              }}
            >
              <Languages size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Flow 3: Multilingual Bridge</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Cross-lingual translation supporting key Indian languages: English, Hindi, Malayalam, Tamil, Telugu,
              and Kannada. Enables regional conversation with localized text and speech outputs.
            </p>
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                marginTop: 'auto',
              }}
            >
              Input Text → Language Detection → Translation Service → Regional TTS
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility & Architectural Highlights */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
        <div className="card" style={{ padding: '36px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Eye size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Built for Accessibility & Accuracy</h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Temporal BiLSTM Model</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Evaluates 30-frame temporal dynamics rather than static single images.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>No Fake Predictions</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Truthful model loading and status reporting with dedicated training pipeline.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>High Contrast & Large Controls</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Exceeds accessibility standards with 44px+ touch targets and screen-reader tags.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Duplicate Suppression</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Temporal majority voting and cooldown prevents repeated emissions like HELLO HELLO.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
