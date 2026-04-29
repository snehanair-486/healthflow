import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Flame, Loader } from 'lucide-react';
import { nutritionAPI } from '../api';
import toast from 'react-hot-toast';
 
const MEAL_TYPES = ['breakfast','lunch','dinner','snack','general'];
 
const healthColor = s => s >= 75 ? '#4fd8c4' : s >= 50 ? '#f5a623' : '#f97066';
 
export function Nutrition() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ meal_description:'', meal_type:'general' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
 
  const loadLogs = () => nutritionAPI.today().then(r => setLogs(r.data || [])).catch(() => {});
  useEffect(() => { loadLogs(); }, []);
 
  const totalCalories = logs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProtein  = logs.reduce((s, l) => s + (l.protein_g || 0), 0);
  const totalCarbs    = logs.reduce((s, l) => s + (l.carbs_g  || 0), 0);
  const totalFat      = logs.reduce((s, l) => s + (l.fat_g    || 0), 0);
  const avgHealth     = logs.length > 0 ? Math.round(logs.reduce((s,l) => s+(l.health_score||0),0)/logs.length) : null;
 
  const analyze = async () => {
    if (!form.meal_description.trim()) return;
    setLoading(true);
    try {
      await nutritionAPI.analyze(form.meal_description, form.meal_type);
      toast.success('Meal analyzed and logged!');
      setForm({ meal_description:'', meal_type:'general' });
      setShowForm(false);
      setTimeout(loadLogs, 500);
    } catch { toast.error('Could not analyze meal. Try again.'); }
    setLoading(false);
  };
 
  const remove = async id => { await nutritionAPI.delete(id); loadLogs(); };
 
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Nutrition</h1>
          <p>{logs.length} meals logged today · {totalCalories} kcal total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background:'var(--accent)', border:'none', borderRadius:10,
          padding:'10px 18px', color:'white',
          display:'flex', alignItems:'center', gap:6,
          fontSize:13, fontWeight:700,
          fontFamily:"'Plus Jakarta Sans', sans-serif",
          letterSpacing:'-0.01em',
          boxShadow:'0 4px 12px rgba(124,106,247,0.25)',
          cursor:'pointer',
        }}>
          <Plus size={15} /> Log Meal
        </button>
      </div>
 
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'18px 20px', marginBottom:18 }}>
            <p style={{ color:'var(--muted)', fontSize:12, marginBottom:12, letterSpacing:'-0.01em' }}>
              Describe what you ate — be specific for better analysis. E.g. "2 scrambled eggs with toast and OJ"
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input
                value={form.meal_description}
                onChange={e => setForm({...form, meal_description: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="e.g. bowl of oats with banana and honey"
                style={{ flex:2, minWidth:220 }}
              />
              <select value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})} style={{ minWidth:110 }}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
              <button onClick={analyze} disabled={loading} style={{
                background: loading ? 'var(--surface2)' : 'var(--accent)', border:'none',
                borderRadius:10, padding:'10px 18px',
                color: loading ? 'var(--muted)' : 'white',
                cursor: loading ? 'not-allowed':'pointer',
                fontSize:13, fontWeight:700,
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                letterSpacing:'-0.01em',
                display:'flex', alignItems:'center', gap:6,
              }}>
                {loading ? <><Loader size={13} className="spin" /> Analyzing…</> : 'Analyze'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Summary macros */}
      {logs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:10, marginBottom:18 }}>
          {[
            { label:'Calories', value: totalCalories, unit:'kcal', color:'#f97066' },
            { label:'Protein',  value: totalProtein.toFixed(1), unit:'g', color:'#7c6af7' },
            { label:'Carbs',    value: totalCarbs.toFixed(1), unit:'g', color:'#f5a623' },
            { label:'Fat',      value: totalFat.toFixed(1), unit:'g', color:'#4fd8c4' },
            { label:'Health',   value: avgHealth, unit:'/100', color: healthColor(avgHealth) },
          ].map(card => (
            <div key={card.label} style={{
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:12, padding:'14px 16px', textAlign:'center',
            }}>
              <div style={{ fontFamily:"'Outfit', sans-serif", fontSize:22, fontWeight:800, letterSpacing:'-0.04em', color:card.color }}>
                {card.value}<span style={{ fontSize:11, fontWeight:500, color:'var(--muted)' }}>{card.unit}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2, fontWeight:500, letterSpacing:'-0.01em' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}
 
      {/* Meal list */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'22px 24px' }}>
        <p className="label-caps" style={{ marginBottom:16 }}>Today's Meals ({logs.length})</p>
 
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'36px 0' }}>
            <Flame size={30} color="var(--muted)" style={{ marginBottom:10 }} />
            <p style={{ color:'var(--muted)', fontSize:14, letterSpacing:'-0.01em' }}>No meals logged yet today.</p>
            <p style={{ color:'var(--muted)', fontSize:12, marginTop:4, letterSpacing:'-0.01em' }}>Click "Log Meal" to get started!</p>
          </div>
        ) : (
          <AnimatePresence>
            {logs.map(log => (
              <motion.div key={log.id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ padding:'14px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:14, alignItems:'flex-start' }}>
                {/* Score circle */}
                <div style={{
                  width:42, height:42, borderRadius:'50%', flexShrink:0,
                  background:`${healthColor(log.health_score)}12`,
                  border:`1.5px solid ${healthColor(log.health_score)}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:800, color:healthColor(log.health_score),
                  fontFamily:"'Outfit', sans-serif",
                }}>
                  {log.health_score}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em' }}>{log.meal_description}</span>
                    <span style={{
                      fontSize:10, padding:'2px 8px', borderRadius:99,
                      background:'var(--surface2)', color:'var(--muted)',
                      textTransform:'capitalize', fontWeight:600, letterSpacing:'0.02em',
                    }}>{log.meal_type}</span>
                  </div>
                  <div style={{ display:'flex', gap:14, marginBottom:5, flexWrap:'wrap' }}>
                    {[
                      { label:'Cal', value:log.calories, unit:'kcal', color:'#f97066' },
                      { label:'Protein', value:log.protein_g, unit:'g', color:'#7c6af7' },
                      { label:'Carbs', value:log.carbs_g, unit:'g', color:'#f5a623' },
                      { label:'Fat', value:log.fat_g, unit:'g', color:'#4fd8c4' },
                    ].map(m => (
                      <span key={m.label} style={{ fontSize:12, color:m.color, letterSpacing:'-0.01em' }}>
                        {m.label}: <strong>{m.value}{m.unit}</strong>
                      </span>
                    ))}
                  </div>
                  {log.analysis && <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.55, letterSpacing:'-0.01em' }}>{log.analysis}</p>}
                </div>
                <button onClick={() => remove(log.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', padding:4, flexShrink:0, opacity:0.6 }}>
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
 
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
}
export default Nutrition;