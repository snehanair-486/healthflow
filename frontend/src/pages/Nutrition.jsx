import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Flame, Loader } from 'lucide-react';
import { nutritionAPI } from '../api';
import toast from 'react-hot-toast';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'general'];

const healthColor = (score) => {
  if (score >= 75) return '#4fd8c4';
  if (score >= 50) return '#f5a623';
  return '#f97066';
};

export default function Nutrition() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ meal_description: '', meal_type: 'general' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadLogs = () => nutritionAPI.today().then(r => setLogs(r.data || [])).catch(() => {});
  useEffect(() => { loadLogs(); }, []);

  const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein_g || 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs_g || 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fat_g || 0), 0);
  const avgHealthScore = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.health_score || 0), 0) / logs.length)
    : null;

  const analyze = async () => {
    if (!form.meal_description.trim()) return;
    setLoading(true);
    try {
      await nutritionAPI.analyze(form.meal_description, form.meal_type);
      toast.success('Meal analyzed and logged!');
      setForm({ meal_description: '', meal_type: 'general' });
      setShowForm(false);
      setTimeout(() => loadLogs(), 500);
    } catch {
      toast.error('Could not analyze meal. Try again.');
    }
    setLoading(false);
  };

  const remove = async (id) => {
    await nutritionAPI.delete(id);
    loadLogs();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Nutrition</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {logs.length} meals logged today · {totalCalories} kcal total
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: 'var(--accent)', border: 'none', borderRadius: 10,
          padding: '10px 16px', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600
        }}>
          <Plus size={16} /> Log Meal
        </button>
      </div>

      {/* Add meal form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
              Describe what you ate — be specific for better analysis. Example: "2 scrambled eggs with toast and orange juice"
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={form.meal_description}
                onChange={e => setForm({ ...form, meal_description: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="e.g. bowl of oats with banana and honey"
                style={{
                  flex: 2, minWidth: 220, background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none'
                }}
              />
              <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none'
              }}>
                {mealTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <button onClick={analyze} disabled={loading} style={{
                background: loading ? 'var(--muted)' : 'var(--accent)', border: 'none',
                borderRadius: 8, padding: '10px 18px', color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : 'Analyze'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily summary cards */}
      {logs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Calories', value: `${totalCalories}`, unit: 'kcal', color: '#f97066' },
            { label: 'Protein', value: totalProtein.toFixed(1), unit: 'g', color: '#7c6af7' },
            { label: 'Carbs', value: totalCarbs.toFixed(1), unit: 'g', color: '#f5a623' },
            { label: 'Fat', value: totalFat.toFixed(1), unit: 'g', color: '#4fd8c4' },
            { label: 'Health Score', value: avgHealthScore, unit: '/100', color: healthColor(avgHealthScore) },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: card.color, fontFamily: 'Syne' }}>
                {card.value}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>{card.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Meal list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          TODAY'S MEALS ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Flame size={32} color="var(--muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No meals logged yet today.</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Click "Log Meal" to get started!</p>
          </div>
        ) : (
          <AnimatePresence>
            {logs.map(log => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  padding: '14px 0', borderBottom: '1px solid var(--border)',
                  display: 'flex', gap: 14, alignItems: 'flex-start'
                }}>

                {/* Health score circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `${healthColor(log.health_score)}20`,
                  border: `2px solid ${healthColor(log.health_score)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: healthColor(log.health_score)
                }}>
                  {log.health_score}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{log.meal_description}</span>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      background: 'var(--surface2)', color: 'var(--muted)', textTransform: 'capitalize'
                    }}>{log.meal_type}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Cal', value: log.calories, unit: 'kcal', color: '#f97066' },
                      { label: 'Protein', value: log.protein_g, unit: 'g', color: '#7c6af7' },
                      { label: 'Carbs', value: log.carbs_g, unit: 'g', color: '#f5a623' },
                      { label: 'Fat', value: log.fat_g, unit: 'g', color: '#4fd8c4' },
                    ].map(m => (
                      <span key={m.label} style={{ fontSize: 12, color: m.color }}>
                        {m.label}: <strong>{m.value}{m.unit}</strong>
                      </span>
                    ))}
                  </div>

                  {log.analysis && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{log.analysis}</p>
                  )}
                </div>

                <button onClick={() => remove(log.id)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: 4, flexShrink: 0
                }}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}