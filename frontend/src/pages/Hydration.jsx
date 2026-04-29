import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { healthAPI } from '../api';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [150, 250, 350, 500, 750];

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

  const statusEmoji = pct >= 1 ? '🎉' : pct >= 0.7 ? '💪' : pct >= 0.4 ? '👍' : '💧';
  const statusText = pct >= 1 ? 'Goal reached!' : pct >= 0.7 ? 'Almost there!' : pct >= 0.4 ? 'Keep going!' : 'Stay hydrated!';

  return (
    <div>
      <div className="page-header">
        <h1>Hydration Tracker</h1>
        <p>Track your daily water intake</p>
      </div>

      {/* Main tracker */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:24, padding:'32px 28px', marginBottom:20, textAlign:'center' }}>
        {/* Bottle visualizer */}
        <div style={{ position:'relative', width:140, height:190, margin:'0 auto 24px' }}>
          <div style={{
            position:'absolute', inset:0,
            border:'1.5px solid var(--border)', borderRadius:20,
            overflow:'hidden', background:'var(--surface2)',
          }}>
            <motion.div
              style={{
                position:'absolute', bottom:0, left:0, right:0,
                background:'linear-gradient(to top, rgba(79,216,196,0.55), rgba(79,216,196,0.15))',
              }}
              initial={{ height:0 }}
              animate={{ height:`${pct * 100}%` }}
              transition={{ duration:1.1, ease:'easeOut' }}
            />
            {/* Tick marks */}
            {[0.25, 0.5, 0.75].map(t => (
              <div key={t} style={{
                position:'absolute', left:10, right:10,
                bottom:`${t * 100}%`,
                height:'1px', background:'rgba(255,255,255,0.08)',
              }} />
            ))}
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:"'Outfit', sans-serif", fontSize:30, fontWeight:800, letterSpacing:'-0.04em' }}>
                {(total / 1000).toFixed(2)}L
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500, letterSpacing:'-0.01em' }}>
                of {(recommendedWater / 1000).toFixed(1)}L
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ maxWidth:280, margin:'0 auto 16px', height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
          <motion.div
            style={{ height:'100%', background:'linear-gradient(90deg, var(--accent2), #38c9af)', borderRadius:99 }}
            initial={{ width:0 }}
            animate={{ width:`${pct * 100}%` }}
            transition={{ duration:1, ease:'easeOut' }}
          />
        </div>

        <div style={{ fontFamily:"'Outfit', sans-serif", fontSize:17, fontWeight:700, letterSpacing:'-0.03em', marginBottom:4 }}>
          {statusEmoji} {statusText}
        </div>
        <div style={{ color:'var(--muted)', fontSize:13, letterSpacing:'-0.01em' }}>
          {pct >= 1
            ? 'Great job staying hydrated today'
            : `${recommendedWater - total}ml more to reach your goal`}
        </div>
      </div>

      {/* Quick log */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'22px 24px', marginBottom:16 }}>
        <p className="label-caps" style={{ marginBottom:14 }}>Quick Log</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          {QUICK_AMOUNTS.map(amt => (
            <motion.button
              key={amt}
              whileHover={{ scale:1.04, y:-1 }}
              whileTap={{ scale:0.96 }}
              onClick={() => logWater(amt)}
              disabled={loading}
              style={{
                background:'var(--surface2)', border:'1px solid var(--border)',
                borderRadius:10, padding:'9px 16px',
                color:'var(--text)', fontSize:13, fontWeight:600,
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                letterSpacing:'-0.01em',
                transition:'border-color 0.15s ease',
                cursor:'pointer',
              }}
            >
              💧 {amt}ml
            </motion.button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Custom amount (ml)"
            type="number"
            style={{ flex:1 }}
          />
          <button
            onClick={() => { if (custom) { logWater(parseInt(custom)); setCustom(''); } }}
            style={{
              background:'var(--accent2)', border:'none', borderRadius:10,
              padding:'10px 18px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
              color:'#0a0a0f', fontWeight:700, fontSize:13,
              fontFamily:"'Plus Jakarta Sans', sans-serif",
              letterSpacing:'-0.01em',
              boxShadow:'0 2px 8px rgba(79,216,196,0.25)',
            }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Log list */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'22px 24px' }}>
        <p className="label-caps" style={{ marginBottom:14 }}>Today's Log</p>

        {logs.length === 0 ? (
          <p style={{ color:'var(--muted)', fontSize:14, letterSpacing:'-0.01em' }}>No entries yet. Log your first drink!</p>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity:0, x:-8 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom:'1px solid var(--border)',
                fontSize:13, fontWeight:500, letterSpacing:'-0.01em',
              }}
            >
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{
                  width:7, height:7, borderRadius:'50%',
                  background:'var(--accent2)',
                  boxShadow:'0 0 6px rgba(79,216,196,0.5)',
                  display:'inline-block',
                }} />
                {log.amount_ml}ml
              </span>
              {log.note && <span style={{ color:'var(--muted)', fontSize:12 }}>{log.note}</span>}
              <span style={{ color:'var(--muted)', fontSize:11 }}>
                {new Date(log.logged_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
              </span>
            </motion.div>
          ))
        )}

        {logs.length > 0 && (
          <div style={{ paddingTop:12, fontSize:13, color:'var(--muted)', letterSpacing:'-0.01em', fontWeight:500 }}>
            Total: <strong style={{ color:'var(--text)' }}>{total}ml</strong>
          </div>
        )}
      </div>
    </div>
  );
}