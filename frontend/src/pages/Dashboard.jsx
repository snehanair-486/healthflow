import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, CheckSquare, Flame, TrendingUp } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { healthAPI, tasksAPI, checkinAPI, nutritionAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import ProactiveNudges from '../components/ProactiveNudges';

function RingProgress({ value, max, color, size = 120, label, sublabel }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={7} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - dash}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
        }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em' }}>
            {label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.01em', fontWeight: 500 }}>
            {sublabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
        {onClick && <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '-0.01em' }}>→</span>}
      </div>
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 28, fontWeight: 800,
        letterSpacing: '-0.04em', marginBottom: 3, color: 'var(--text)',
      }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '-0.01em' }}>
        {label}
      </div>
    </motion.div>
  );
}

const priorityColors = { high: 'var(--accent3)', medium: 'var(--accent)', low: 'var(--accent2)' };

export default function Dashboard() {
  const { profile, recommendedWater, bmi } = useProfile();
  const [todayWater, setTodayWater] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [hasCheckin, setHasCheckin] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    // Hydration
    healthAPI.todayHydration()
      .then(r => setTodayWater(r.data.reduce((s, l) => s + l.amount_ml, 0)))
      .catch(() => {});

    // Tasks
    tasksAPI.list()
      .then(r => setTasks(r.data || []))
      .catch(() => {});

    // Nutrition — total calories today
    nutritionAPI.today()
      .then(r => {
        const logs = r.data || [];
        const total = logs.reduce((s, l) => s + (l.calories || 0), 0);
        setTodayCalories(Math.round(total));
      })
      .catch(() => {});

    // Check-in — did user check in today?
    checkinAPI.today()
      .then(r => setHasCheckin(!!r.data))
      .catch(() => setHasCheckin(false));
  }, []);

  const completedToday = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const waterPct = Math.round((todayWater / recommendedWater) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.04em' }}>
          {greeting}{profile?.name ? `, ${profile.name}` : ''} 👋
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, letterSpacing: '-0.01em' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Proactive nudges — appear only when conditions are met */}
      <ProactiveNudges
        todayWater={todayWater}
        waterGoal={recommendedWater}
        todayCalories={todayCalories}
        hasCheckin={hasCheckin}
        streak={0}
      />

      {/* Rings + progress card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 22,
        padding: '28px 32px',
        marginBottom: 20,
        display: 'flex',
        gap: 40,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div>
          <p className="label-caps" style={{ marginBottom: 20 }}>Today's Rings</p>
          <div style={{ display: 'flex', gap: 28 }}>
            <RingProgress
              value={todayWater} max={recommendedWater}
              color="var(--accent2)" size={116}
              label={`${waterPct}%`} sublabel="hydration"
            />
            <RingProgress
              value={completedToday} max={Math.max(tasks.length, 1)}
              color="var(--accent)" size={116}
              label={`${completedToday}/${tasks.length}`} sublabel="tasks"
            />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ marginBottom: 6 }}>
            <p className="label-caps" style={{ marginBottom: 8 }}>Hydration</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>
                {todayWater}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
                / {recommendedWater}ml
              </span>
            </div>
          </div>

          <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent2), #38c9af)',
                borderRadius: 99,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(waterPct, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <p style={{
            fontSize: 12, marginTop: 10, fontWeight: 500, letterSpacing: '-0.01em',
            color: waterPct >= 100 ? 'var(--accent2)' : waterPct >= 50 ? 'var(--accent)' : 'var(--accent3)',
          }}>
            {waterPct >= 100
              ? '✓ Daily goal reached!'
              : waterPct >= 50
              ? `${recommendedWater - todayWater}ml more to reach your goal`
              : 'Keep drinking water!'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        <StatCard icon={Droplets} label="Water today" value={`${(todayWater / 1000).toFixed(1)}L`} color="var(--accent2)" onClick={() => navigate('/hydration')} />
        <StatCard icon={CheckSquare} label="Tasks pending" value={pending} color="var(--accent)" onClick={() => navigate('/tasks')} />
        <StatCard icon={Flame} label="Completed" value={completedToday} color="var(--accent3)" />
        <StatCard icon={TrendingUp} label="BMI" value={bmi || '--'} color="#f5a623" />
      </div>

      {/* Upcoming tasks */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 28px',
      }}>
        <p className="label-caps" style={{ marginBottom: 16 }}>Upcoming Tasks</p>

        {tasks.filter(t => !t.completed).slice(0, 4).length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14, letterSpacing: '-0.01em' }}>
            No pending tasks. Ask the AI to create some!
          </p>
        ) : (
          tasks.filter(t => !t.completed).slice(0, 4).map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: priorityColors[task.priority] || 'var(--accent)',
                boxShadow: `0 0 6px ${priorityColors[task.priority] || 'var(--accent)'}80`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, letterSpacing: '-0.01em' }}>
                  {task.category}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
                background: `${priorityColors[task.priority] || 'var(--accent)'}18`,
                color: priorityColors[task.priority] || 'var(--accent)',
              }}>
                {task.priority}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}