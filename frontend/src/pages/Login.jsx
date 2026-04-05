import { useState, useEffect } from 'react';
import { authAPI } from '../api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('hf_theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handle = async () => {
    setLoading(true);
    setError('');
    try {
      const res = isRegister
        ? await authAPI.register(form)
        : await authAPI.login({ email: form.email, password: form.password });
      localStorage.setItem('hf_user', JSON.stringify(res.data));
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  const t = dark ? themes.dark : themes.light;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: t.bg, fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: dark ? 'rgba(124,106,247,0.08)' : 'rgba(124,106,247,0.12)',
        top: -100, right: -100, filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: dark ? 'rgba(79,216,196,0.06)' : 'rgba(79,216,196,0.1)',
        bottom: -80, left: -80, filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      {/* Theme toggle */}
      <button onClick={() => setDark(!dark)} style={{
        position: 'absolute', top: 24, right: 24,
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
        color: t.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
      }}>
        {dark ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420,
        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.4)' : '0 24px 60px rgba(0,0,0,0.1)',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c6af7, #4fd8c4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>⚡</div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: '1.8rem', color: t.text, marginBottom: 8
          }}>HealthFlow</h1>
          <p style={{ color: t.muted, fontSize: 14, lineHeight: 1.5 }}>
            Your personal AI-powered health assistant.<br />Track tasks, hydration & wellness in one place.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: t.bg,
          borderRadius: 10, padding: 4, marginBottom: '1.5rem'
        }}>
          {['Login', 'Register'].map(tab => (
            <button key={tab} onClick={() => { setIsRegister(tab === 'Register'); setError(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
                background: (tab === 'Register') === isRegister ? '#7c6af7' : 'transparent',
                color: (tab === 'Register') === isRegister ? 'white' : t.muted,
                transition: 'all 0.2s'
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Fields */}
        {isRegister && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: 12, color: t.muted, display: 'block', marginBottom: 6 }}>Full Name</label>
            <input
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle(t)}
            />
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, color: t.muted, display: 'block', marginBottom: 6 }}>Email</label>
          <input
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle(t)}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: 12, color: t.muted, display: 'block', marginBottom: 6 }}>Password</label>
          <input
            placeholder="••••••••"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()}
            style={inputStyle(t)}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(249,112,102,0.1)', border: '1px solid rgba(249,112,102,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: '1rem',
            color: '#f97066', fontSize: 13
          }}>{error}</div>
        )}

        <button onClick={handle} disabled={loading} style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #7c6af7, #4fd8c4)',
          color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s'
        }}>
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </button>
      </div>
    </div>
  );
}

const inputStyle = (t) => ({
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${t.border}`, background: t.bg,
  color: t.text, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box'
});

const themes = {
  dark: {
    bg: '#0a0a0f', surface: '#111118', border: '#2a2a38',
    text: '#e8e8f0', muted: '#6b6b80'
  },
  light: {
    bg: '#f1f5f9', surface: '#ffffff', border: '#e2e8f0',
    text: '#0f172a', muted: '#64748b'
  }
};