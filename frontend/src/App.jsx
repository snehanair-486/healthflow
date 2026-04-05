import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Hydration from './pages/Hydration';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import Login from './pages/Login';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('hf_user') || 'null'));
  const [dark, setDark] = useState(() => localStorage.getItem('hf_theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('hf_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogin = (userData) => setUser(userData);

  // Fix 3: theme is NOT cleared on logout
  const handleLogout = () => {
    localStorage.removeItem('hf_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
      }} />
      <div style={{ display: 'flex' }}>
        <Sidebar />

        <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

          {/* Top navbar */}
          <div style={{
            height: 60, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '0 32px', gap: 12, position: 'sticky', top: 0, zIndex: 99
          }}>
            {/* Theme toggle */}
            <button onClick={() => setDark(!dark)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* User name */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px'
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white'
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{user.name}</span>
            </div>

            {/* Logout */}
            <button onClick={handleLogout} style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <LogOut size={14} /> Logout
            </button>
          </div>

          {/* Page content */}
          <main style={{ flex: 1, padding: '32px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/hydration" element={<Hydration />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}