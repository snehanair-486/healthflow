import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { healthAPI } from '../api';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';

const quickAmounts = [150, 250, 350, 500, 750];

export default function Hydration() {
  const { recommendedWater } = useProfile();
  const [logs, setLogs] = useState([]);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = () => healthAPI.todayHydration().then(r => setLogs(r.data || [])).catch(() => {});
  useEffect(() => { fetchLogs(); }, []);

  const total = logs.reduce((s, l) => s + l.amount_ml, 0);
  const pct = Math.min(total / recommendedWater, 1);

  const logWater = async (amount) => {
    setLoading(true);
    try {
      await healthAPI.logWater(amount);
      toast.success(`+${amount}ml logged!`);
      await fetchLogs();
    } catch { toast.error('Failed to log water'); }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Hydration Tracker</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Track your daily water intake</p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 160, height: 200, margin: '0 auto 24px' }}>
          <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            <motion.div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(79,216,196,0.6), rgba(79,216,196,0.2))',
              }}
              initial={{ height: 0 }}
              animate={{ height: `${pct * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>{(total / 1000).toFixed(2)}L</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>of {(recommendedWater/1000).toFixed(1)}L</div>
            </div>
          </div>
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 18, marginBottom: 4 }}>
          {pct >= 1 ? '🎉 Goal reached!' : pct >= 0.7 ? '💪 Almost there!' : pct >= 0.4 ? '👍 Keep going!' : '💧 Stay hydrated!'}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
          {pct >= 1 ? 'Great job staying hydrated today' : `${recommendedWater - total}ml more to reach your goal`}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>QUICK LOG</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {quickAmounts.map(amt => (
            <motion.button key={amt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => logWater(amt)} disabled={loading}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px', color: 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: 500
              }}>
              💧 {amt}ml
            </motion.button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="Custom amount (ml)" type="number"
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none'
            }} />
          <button onClick={() => { if (custom) { logWater(parseInt(custom)); setCustom(''); } }}
            style={{
              background: 'var(--accent2)', border: 'none', borderRadius: 10,
              padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 6, color: '#0a0a0f', fontWeight: 600, fontSize: 14
            }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>TODAY'S LOG</h2>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No entries yet. Log your first drink!</p>
        ) : (
          logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span>💧 {log.amount_ml}ml</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}