import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import { chatAPI } from '../api';

const agentColors = {
  health: 'var(--accent2)', task: 'var(--accent)',
  multi: '#f5a623', direct: 'var(--muted)', orchestrator: 'var(--muted)'
};
const agentLabels = {
  health: '🫀 Health Agent', task: '✅ Task Agent',
  multi: '⚡ Multi-Agent', direct: '💬 Direct', orchestrator: '🤖 HealthFlow'
};

const SUGGESTIONS = [
  'How much water have I had today?',
  'Create a task: drink water before lunch',
  'Am I on track with my health goals?',
  'Remind me to stretch at 6pm',
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    chatAPI.history().then(r => setMessages(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const r = await chatAPI.send(userMsg.content);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.data.response,
        agent_used: r.data.agentUsed,
        id: Date.now() + 1,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Make sure the backend is running.',
        id: Date.now() + 1,
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 3 }}>
          AI Health Assistant
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '-0.01em', fontWeight: 500 }}>
          Powered by 3 specialized agents · Groq LLaMA 3.3
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6, marginBottom: 14 }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', paddingTop: 56 }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, #7c6af7, #4fd8c4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 18px',
              boxShadow: '0 8px 24px rgba(124,106,247,0.25)',
            }}>⚡</div>

            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.15rem', fontWeight: 700,
              letterSpacing: '-0.03em', marginBottom: 6,
            }}>HealthFlow is ready</h2>

            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28, letterSpacing: '-0.01em' }}>
              Ask about your health, log water, or create tasks
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    padding: '8px 16px',
                    color: 'var(--muted)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.color = 'var(--text)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.color = 'var(--muted)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 14,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--accent), #9b8cf9)'
                  : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(124,106,247,0.25)' : 'none',
              }}>
                {msg.role === 'user'
                  ? <User size={14} color="white" />
                  : <Bot size={14} color="var(--accent)" />}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '76%' }}>
                {msg.role === 'assistant' && msg.agent_used && (
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: agentColors[msg.agent_used] || 'var(--muted)',
                    marginBottom: 5,
                  }}>
                    {agentLabels[msg.agent_used] || msg.agent_used}
                  </div>
                )}
                <div style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--accent), #9b8cf9)'
                    : 'var(--surface)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '11px 15px',
                  fontSize: 14,
                  lineHeight: 1.65,
                  letterSpacing: '-0.01em',
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(124,106,247,0.2)' : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="var(--accent)" />
            </div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '4px 16px 16px 16px',
              padding: '14px 18px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.75, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your health, log water, create tasks…"
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 13,
            padding: '12px 16px',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.01em',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim()
              ? 'var(--surface2)'
              : 'linear-gradient(135deg, var(--accent), #9b8cf9)',
            border: 'none',
            borderRadius: 13,
            width: 46, height: 46,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(124,106,247,0.3)',
            flexShrink: 0,
          }}
        >
          <Send size={17} color={loading || !input.trim() ? 'var(--muted)' : 'white'} />
        </button>
      </div>
    </div>
  );
}