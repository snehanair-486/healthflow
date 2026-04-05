import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Droplets, CheckSquare, MessageCircle, User, Activity } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { to: '/hydration', icon: Droplets, label: 'Hydration' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/insights', icon: Activity, label: 'Insights' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '24px 0', position: 'fixed', top: 0, left: 0, zIndex: 100
    }}>
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>⚡</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>HealthFlow</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              background: isActive ? 'rgba(124,106,247,0.1)' : 'transparent',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'all 0.15s'
            })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
          Multi-Agent System<br />
          <span style={{ color: 'var(--accent2)' }}>● 3 agents active</span>
        </div>
      </div>
    </aside>
  );
}