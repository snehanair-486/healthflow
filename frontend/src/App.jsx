import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Hydration from './pages/Hydration';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import Nutrition from './pages/Nutrition';
import Checkin from './pages/Checkin';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { profileAPI } from './api';

// Cache key for profile completion status
const PROFILE_CACHE_KEY = 'hf_profile_complete';

function AppShell({ user, onLogout, dark, setDark }) {
  const [hasProfile, setHasProfile] = useState(() => {
    // Check localStorage cache first — avoids flash of onboarding on every refresh
    return localStorage.getItem(PROFILE_CACHE_KEY) === 'true' ? true : null;
  });

  useEffect(() => {
    // If we already have a cached 'true', still verify in background silently
    // but don't show loading screen — trust the cache
    profileAPI.get()
      .then(r => {
        const p = r.data;
        // Match the field names your backend actually returns
        // Backend receives: weight, height → check both naming conventions
        const hasRequiredFields =
          p && p.age && (p.weight_kg || p.weight) && (p.height_cm || p.height);

        if (hasRequiredFields) {
          localStorage.setItem(PROFILE_CACHE_KEY, 'true');
          setHasProfile(true);
        } else {
          localStorage.removeItem(PROFILE_CACHE_KEY);
          setHasProfile(false);
        }
      })
      .catch(() => {
        // Network error — if we had a cached value, trust it
        // Only redirect to onboarding if there was no cached value
        if (localStorage.getItem(PROFILE_CACHE_KEY) !== 'true') {
          setHasProfile(false);
        }
      });
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(PROFILE_CACHE_KEY, 'true');
    setHasProfile(true);
  };

  // Still loading — but only show spinner if we have no cached answer
  if (hasProfile === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--muted)'
      }}>
        Loading...
      </div>
    );
  }

  // New user — show onboarding fullscreen
  if (hasProfile === false) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
        }} />
        <Routes>
          <Route path="*" element={<Onboarding onComplete={handleOnboardingComplete} />} />
        </Routes>
      </>
    );
  }

  // Existing user — normal app
  return (
    <>
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
            <button onClick={() => setDark(!dark)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>

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

            <button onClick={onLogout} style={{
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
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/checkin" element={<Checkin />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('hf_user') || 'null'));
  const [dark, setDark] = useState(() => localStorage.getItem('hf_theme') !== 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('hf_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('hf_user');
    localStorage.removeItem(PROFILE_CACHE_KEY); // Clear profile cache on logout
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <AppShell user={user} onLogout={handleLogout} dark={dark} setDark={setDark} />
    </BrowserRouter>
  );
}