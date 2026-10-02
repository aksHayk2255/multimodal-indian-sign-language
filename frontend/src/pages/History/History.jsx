import React, { useState, useEffect } from 'react';
import { historyService } from '../../services/historyService';
import { ttsService } from '../../services/ttsService';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Volume2,
  Calendar,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import LoadingIndicator from '../../components/LoadingIndicator/LoadingIndicator';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

export const History = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (modeFilter) params.mode = modeFilter;

      const data = await historyService.getConversations(params);
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch conversation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [modeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConversations();
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this conversation record?')) return;

    try {
      await historyService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (err) {
      alert('Failed to delete conversation.');
    }
  };

  const handleSpeak = (text, lang) => {
    ttsService.speak(text, lang || 'en');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HistoryIcon size={24} color="var(--accent-primary)" />
          <span>Conversation History</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Review, search, replay and manage previous multimodal communication sessions.
        </p>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '16px',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcripts or title..."
            className="form-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="form-select"
          style={{ minWidth: '180px' }}
        >
          <option value="">All Modes</option>
          <option value="isl_to_speech">ISL to Speech</option>
          <option value="speech_to_text">Speech to Text</option>
          <option value="two_way">Two-Way Conversation</option>
          <option value="multilingual">Multilingual</option>
        </select>
      </div>

      {/* Two Column Layout: List & Detail */}
      {loading ? (
        <LoadingIndicator text="Loading history..." />
      ) : conversations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <HistoryIcon size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>No Conversation Records Found</h3>
          <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            Conversations from ISL, Speech, and Two-Way modes will be automatically archived here.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {/* List Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const dateStr = new Date(conv.created_at).toLocaleDateString();
              const timeStr = new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{conv.title}</strong>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {dateStr} {timeStr}
                      </span>
                      <span>• {conv.mode_name}</span>
                      <span>• {conv.message_count} messages</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="btn btn-secondary"
                    title="Delete Conversation"
                    style={{ padding: '6px 10px', minHeight: 'auto', color: 'var(--status-error)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Details Column */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedConversation ? (
              <>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>{selectedConversation.title}</h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Mode: <strong>{selectedConversation.mode_name}</strong> | Created:{' '}
                    {new Date(selectedConversation.created_at).toLocaleString()}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                  }}
                >
                  {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                            {m.sender_name} ({m.message_type_name})
                          </span>
                          <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>

                        <div style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                          {m.original_text}
                        </div>

                        {m.translated_text && (
                          <div style={{ fontSize: '0.88rem', color: '#5eead4', marginTop: '6px' }}>
                            <strong>Translation:</strong> {m.translated_text}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button
                            onClick={() => handleSpeak(m.translated_text || m.original_text)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', minHeight: 'auto', gap: '4px' }}
                          >
                            <Volume2 size={13} />
                            <span>Vocalize</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No messages recorded in this conversation session.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a conversation from the list to view transcripts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
