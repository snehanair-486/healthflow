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
    localStorage.setItem('hf_theme', dark ? 'dark' : 'light');
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: dark ? '#0a0a0f' : '#f0f2f8',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '20px',
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: dark ? 'rgba(124,106,247,0.07)' : 'rgba(124,106,247,0.1)',
        top: -160, right: -160, filter: 'blur(90px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        background: dark ? 'rgba(79,216,196,0.05)' : 'rgba(79,216,196,0.08)',
        bottom: -100, left: -100, filter: 'blur(70px)', pointerEvents: 'none'
      }} />

      {/* Theme toggle */}
      <button
        onClick={() => setDark(!dark)}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: dark ? '#111118' : '#ffffff',
          border: `1px solid ${dark ? '#2a2a38' : '#e2e4ed'}`,
          borderRadius: 8, padding: '7px 13px',
          color: dark ? '#6b6b80' : '#6b7280',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', letterSpacing: '-0.01em',
        }}>
        {dark ? '☀️ Light' : '🌙 Dark'}
      </button>

      {/* Card */}
      <div style={{
        background: dark ? '#111118' : '#ffffff',
        border: `1px solid ${dark ? '#2a2a38' : '#e2e4ed'}`,
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: dark
          ? '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
          : '0 8px 40px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #7c6af7, #4fd8c4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 8px 24px rgba(124,106,247,0.3)',
          }}>⚡</div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '1.9rem',
            letterSpacing: '-0.04em',
            color: dark ? '#e8e8f0' : '#0f1020',
            marginBottom: 10,
          }}>HealthFlow</h1>

          <p style={{
            color: dark ? '#6b6b80' : '#6b7280',
            fontSize: 14,
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
          }}>
            Your AI-powered personal health assistant.<br />
            Track hydration, tasks &amp; wellness.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: dark ? '#0a0a0f' : '#f0f2f8',
          borderRadius: 10,
          padding: 4,
          marginBottom: 28,
          gap: 2,
        }}>
          {['Login', 'Register'].map(tab => {
            const active = (tab === 'Register') === isRegister;
            return (
              <button
                key={tab}
                onClick={() => { setIsRegister(tab === 'Register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 7,
                  border: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                  background: active
                    ? (dark ? '#111118' : '#ffffff')
                    : 'transparent',
                  color: active
                    ? (dark ? '#e8e8f0' : '#0f1020')
                    : (dark ? '#6b6b80' : '#6b7280'),
                  boxShadow: active
                    ? (dark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.1)')
                    : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}>
                {tab}
              </button>
            );
          })}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <FieldGroup label="Full Name" dark={dark}>
              <input
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle(dark)}
              />
            </FieldGroup>
          )}

          <FieldGroup label="Email" dark={dark}>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle(dark)}
            />
          </FieldGroup>

          <FieldGroup label="Password" dark={dark}>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={inputStyle(dark)}
            />
          </FieldGroup>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(249,112,102,0.08)',
            border: '1px solid rgba(249,112,102,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            marginTop: 16,
            color: '#f97066',
            fontSize: 13,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handle}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 24,
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: loading
              ? (dark ? '#2a2a38' : '#e2e4ed')
              : 'linear-gradient(135deg, #7c6af7, #4fd8c4)',
            color: loading ? (dark ? '#6b6b80' : '#9ca3af') : 'white',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.02em',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(124,106,247,0.3)',
          }}>
          {loading
            ? (isRegister ? 'Creating account…' : 'Signing in…')
            : (isRegister ? 'Create Account' : 'Sign In')}
        </button>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 12,
          color: dark ? '#6b6b80' : '#9ca3af',
          letterSpacing: '-0.01em',
        }}>
          {isRegister
            ? 'Already have an account? '
            : "Don't have an account? "}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ color: '#7c6af7', cursor: 'pointer', fontWeight: 600 }}>
            {isRegister ? 'Sign in' : 'Register'}
          </span>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FieldGroup({ label, dark, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: dark ? '#6b6b80' : '#6b7280',
        marginBottom: 6,
        textTransform: 'uppercase',
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = (dark) => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: 9,
  border: `1px solid ${dark ? '#2a2a38' : '#e2e4ed'}`,
  background: dark ? '#0a0a0f' : '#f7f8fc',
  color: dark ? '#e8e8f0' : '#0f1020',
  fontSize: 14,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  letterSpacing: '-0.01em',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box',
});