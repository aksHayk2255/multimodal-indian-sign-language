import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Video,
  Mic,
  MessageSquare,
  Languages,
  History,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { historyService } from '../../services/historyService';
import { SUPPORTED_LANGUAGES, CORE_ISL_SIGNS } from '../../utils/constants';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const convs = await historyService.getConversations();
        setRecentConversations(convs.slice(0, 4));
      } catch (err) {
        console.warn('Could not load recent conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const modeCards = [
    {
      title: 'ISL to Speech',
      description: 'Sign in front of your webcam. Deep learning analyzes your gestures and speaks the constructed sentence out loud.',
      icon: Video,
      link: '/sign-language',
      color: 'var(--accent-primary)',
      badge: 'Main Feature',
    },
    {
      title: 'Speech to Text',
      description: 'Speak into your microphone. Real-time automatic speech recognition produces readable text with optional translation.',
      icon: Mic,
      link: '/speech',
      color: 'var(--status-success)',
      badge: 'ASR Powered',
    },
    {
      title: 'Two-Way Conversation',
      description: 'Real-time conversational room for signers and non-signers with clear visual distinction and audio generation.',
      icon: MessageSquare,
      link: '/conversation',
      color: 'var(--accent-purple)',
      badge: 'Interactive',
    },
    {
      title: 'Multilingual Bridge',
      description: 'Cross-translate sentences between English, Hindi, Malayalam, Tamil, Telugu, and Kannada with TTS.',
      icon: Languages,
      link: '/speech',
      color: 'var(--status-warning)',
      badge: '6 Indian Languages',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(30, 40, 56, 0.9) 100%)',
          borderColor: 'rgba(37, 99, 235, 0.3)',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-info">Dashboard</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Active Language: <strong>{SUPPORTED_LANGUAGES.find((l) => l.code === profile.preferred_language)?.name || 'English'}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
              Welcome back, {user?.first_name || user?.username || 'Communicator'}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.95rem' }}>
              Select a communication mode below to begin translating sign language or speech.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/sign-language" className="btn btn-primary">
              <Video size={18} />
              <span>Launch ISL Translator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Communication Mode Cards */}
      <section>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Communication Modes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {modeCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  textDecoration: 'none',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{card.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    marginTop: 'auto',
                  }}
                >
                  <span>Open Mode</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Grid: Supported Vocabulary & Recent Sessions */}
      <div className="grid-2">
        {/* Core ISL Gestures */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Supported ISL Signs</h3>
            <span className="badge badge-success">{CORE_ISL_SIGNS.length} Gestures</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Temporal sequence patterns recognized by the deep learning model:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CORE_ISL_SIGNS.map((sign, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {sign}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Signs are extracted from dual-hand coordinates and upper-body posture trajectories.
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Conversations</h3>
            <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading recent sessions...</p>
          ) : recentConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <History size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No conversation history recorded yet.</p>
              <Link to="/conversation" className="btn btn-secondary" style={{ marginTop: '12px', display: 'inline-flex' }}>
                Start a Conversation
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/history`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{conv.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {conv.mode_name} • {conv.message_count} messages
                    </div>
                  </div>
                  <Clock size={16} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
