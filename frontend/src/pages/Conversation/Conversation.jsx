import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMicrophone } from '../../hooks/useMicrophone';
import { historyService } from '../../services/historyService';
import { ttsService } from '../../services/ttsService';
import ConversationBubble from '../../components/ConversationBubble/ConversationBubble';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { CORE_ISL_SIGNS, SUPPORTED_LANGUAGES } from '../../utils/constants';
import {
  MessageSquare,
  Video,
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  Sparkles
} from 'lucide-react';

export const Conversation = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'sign_user',
      message_type: 'isl_sign',
      original_text: 'Hello, how are you?',
      translated_text: 'नमस्ते, आप कैसे हैं? (Namaste, Aap kaise hain?)',
      confidence: 0.96,
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 2,
      sender: 'speech_user',
      message_type: 'speech_transcript',
      original_text: 'I am doing well, thank you!',
      translated_text: 'मैं ठीक हूँ, धन्यवाद! (Main theek hoon, Dhanyawad!)',
      confidence: 0.98,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [activeTab, setActiveTab] = useState('sign'); // 'sign' or 'speech'
  const [signInputText, setSignInputText] = useState('');
  const [speechInputText, setSpeechInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(profile.target_language || 'hi');
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const {
    isRecording,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useMicrophone();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync mic transcript into speechInputText
  useEffect(() => {
    if (transcript || interimTranscript) {
      setSpeechInputText(transcript + (interimTranscript ? ` ${interimTranscript}` : ''));
    }
  }, [transcript, interimTranscript]);

  const handleSendMessage = async (sender, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await historyService.sendMessage({
        conversation_id: conversationId,
        sender,
        message_type: sender === 'sign_user' ? 'isl_sign' : 'speech_transcript',
        original_text: trimmed,
        source_language: 'en',
        target_language: targetLanguage,
      });

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      setMessages((prev) => [...prev, res.message]);

      if (sender === 'sign_user') {
        setSignInputText('');
        if (profile.auto_speak) {
          ttsService.speak(res.message.translated_text || res.message.original_text, targetLanguage);
        }
      } else {
        setSpeechInputText('');
        clearTranscript();
      }
    } catch (err) {
      // Fallback local append if backend is temporarily disconnected
      const fallbackMsg = {
        id: Date.now(),
        sender,
        message_type: sender === 'sign_user' ? 'isl_sign' : 'speech_transcript',
        original_text: trimmed,
        translated_text: `[${targetLanguage.toUpperCase()}] ${trimmed}`,
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (sender === 'sign_user') setSignInputText('');
      else {
        setSpeechInputText('');
        clearTranscript();
      }
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={22} color="var(--accent-primary)" />
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Two-Way Accessible Conversation</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Sign Language User ⟷ Spoken Voice User
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector
            label="Translate to:"
            value={targetLanguage}
            onChange={setTargetLanguage}
            id="conv-target-lang"
          />
          <button
            onClick={handleClearHistory}
            className="btn btn-secondary"
            title="Clear Chat Timeline"
            aria-label="Clear Chat"
            style={{ padding: '8px 12px', minHeight: 'auto' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Message Timeline */}
      <div
        className="card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-input)',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={36} opacity={0.4} />
            <p>No messages yet. Send a sign gesture or voice message below to start communicating.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ConversationBubble key={msg.id} message={msg} targetLanguage={targetLanguage} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Two-Way Input Switcher */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('sign')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'sign' ? '#fff' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'sign' ? 'var(--accent-primary)' : 'transparent',
            }}
          >
            <Video size={16} />
            <span>Sign User (Deaf / ISL)</span>
          </button>

          <button
            onClick={() => setActiveTab('speech')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'speech' ? '#fff' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'speech' ? 'var(--status-success)' : 'transparent',
            }}
          >
            <Mic size={16} />
            <span>Speech User (Hearing)</span>
          </button>
        </div>

        {/* Tab 1: Sign User Input */}
        {activeTab === 'sign' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> Quick ISL Gestures:
              </span>
              {CORE_ISL_SIGNS.map((sign) => (
                <button
                  key={sign}
                  onClick={() => handleSendMessage('sign_user', sign)}
                  disabled={sending}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem', minHeight: '32px' }}
                >
                  {sign}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={signInputText}
                onChange={(e) => setSignInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('sign_user', signInputText)}
                placeholder="Type sign sentence (e.g. Hello, thank you)..."
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => handleSendMessage('sign_user', signInputText)}
                disabled={!signInputText.trim() || sending}
                className="btn btn-primary"
              >
                <Send size={16} />
                <span>Send as Signer</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Speech User Input */}
        {activeTab === 'speech' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={isRecording ? stopRecording : () => startRecording('en')}
              className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '10px 14px' }}
              title={isRecording ? 'Stop Recording' : 'Speak into Microphone'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isRecording ? 'Recording...' : 'Speak'}</span>
            </button>

            <input
              type="text"
              value={speechInputText}
              onChange={(e) => setSpeechInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('speech_user', speechInputText)}
              placeholder="Spoken words will appear here, or type response..."
              className="form-input"
              style={{ flex: 1 }}
            />

            <button
              onClick={() => handleSendMessage('speech_user', speechInputText)}
              disabled={!speechInputText.trim() || sending}
              className="btn btn-success"
            >
              <Send size={16} />
              <span>Send Voice</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversation;
