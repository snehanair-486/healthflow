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
        role: 'assistant', content: r.data.response,
        agent_used: r.data.agentUsed, id: Date.now() + 1
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant', content: 'Sorry, something went wrong. Make sure the backend is running.',
        id: Date.now() + 1
      }]);
    }
    setLoading(false);
  };

  const suggestions = [
    'How much water have I had today?',
    'Create a task: drink water before lunch',
    'Am I on track with my health goals?',
    'Remind me to stretch at 6pm',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>AI Health Assistant</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Powered by 3 specialized agents • Groq LLaMA 3.3</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 16 }}>
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, marginBottom: 8 }}>HealthFlow is ready</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Ask about your health, log water, or create tasks</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '8px 16px', color: 'var(--text)',
                  cursor: 'pointer', fontSize: 13
                }}>{s}</button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={msg.id || i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', gap: 12, marginBottom: 16,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)'
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{ maxWidth: '75%' }}>
                {msg.role === 'assistant' && msg.agent_used && (
                  <div style={{ fontSize: 10, color: agentColors[msg.agent_used] || 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>
                    {agentLabels[msg.agent_used] || msg.agent_used}
                  </div>
                )}
                <div style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${msg.role === 'user' ? 'transparent' : 'var(--border)'}`,
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '12px 16px', fontSize: 14, lineHeight: 1.6
                }}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent)' }}
                  animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your health, log water, create tasks..."
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none'
          }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: 'var(--accent)', border: 'none', borderRadius: 12, width: 46,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1
        }}>
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  );
}