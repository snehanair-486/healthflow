import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, CheckSquare, Flame, TrendingUp } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { healthAPI, tasksAPI } from '../api';
import { useNavigate } from 'react-router-dom';

function RingProgress({ value, max, color, size = 120, label, sublabel }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - dash}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{sublabel}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20, cursor: onClick ? 'pointer' : 'default'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile, recommendedWater, bmi } = useProfile();
  const [todayWater, setTodayWater] = useState(0);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    healthAPI.todayHydration().then(r => {
      const total = r.data.reduce((s, l) => s + l.amount_ml, 0);
      setTodayWater(total);
    }).catch(() => {});
    tasksAPI.list().then(r => setTasks(r.data || [])).catch(() => {});
  }, []);

  const completedToday = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const waterPct = Math.round((todayWater / recommendedWater) * 100);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}{profile?.name ? `, ${profile.name}` : ''} 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 32, marginBottom: 24,
          display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 16, marginBottom: 24, color: 'var(--muted)' }}>TODAY'S RINGS</h2>
            <div style={{ display: 'flex', gap: 32 }}>
              <RingProgress value={todayWater} max={recommendedWater} color="var(--accent2)" size={120}
                label={`${waterPct}%`} sublabel="hydration" />
              <RingProgress value={completedToday} max={Math.max(tasks.length, 1)} color="var(--accent)" size={120}
                label={`${completedToday}/${tasks.length}`} sublabel="tasks done" />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Hydration</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>
                {todayWater}ml <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>/ {recommendedWater}ml</span>
              </div>
              <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <motion.div
                  style={{ height: '100%', background: 'var(--accent2)', borderRadius: 2 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(waterPct, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            <div style={{ fontSize: 13, color: waterPct >= 100 ? 'var(--accent2)' : waterPct >= 50 ? 'var(--accent)' : 'var(--accent3)' }}>
              {waterPct >= 100 ? '✓ Daily goal reached!' : waterPct >= 50 ? `${recommendedWater - todayWater}ml more to go` : 'Keep drinking water!'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Droplets} label="Water today" value={`${(todayWater/1000).toFixed(1)}L`} color="var(--accent2)" onClick={() => navigate('/hydration')} />
          <StatCard icon={CheckSquare} label="Tasks pending" value={pending} color="var(--accent)" onClick={() => navigate('/tasks')} />
          <StatCard icon={Flame} label="Completed" value={completedToday} color="var(--accent3)" />
          <StatCard icon={TrendingUp} label="BMI" value={bmi || '--'} color="#f5a623" />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 16, marginBottom: 16 }}>UPCOMING TASKS</h2>
          {tasks.filter(t => !t.completed).slice(0, 4).length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pending tasks. Ask the AI to create some!</p>
          ) : (
            tasks.filter(t => !t.completed).slice(0, 4).map(task => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: { high: 'var(--accent3)', medium: 'var(--accent)', low: 'var(--accent2)' }[task.priority] || 'var(--accent)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{task.category}</div>
                </div>
                
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}