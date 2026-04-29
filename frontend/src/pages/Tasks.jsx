import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { tasksAPI } from '../api';
import toast from 'react-hot-toast';
 
const CATEGORIES = ['all','hydration','exercise','medication','nutrition','sleep','general'];
const CAT_COLORS = {
  hydration:'var(--accent2)', exercise:'#f5a623', medication:'var(--accent3)',
  nutrition:'#a8d97f', sleep:'var(--accent)', general:'var(--muted)'
};
const PRI_COLORS = { high:'var(--accent3)', medium:'var(--accent)', low:'var(--accent2)' };
 
export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:'', category:'general', priority:'medium' });
 
  const loadTasks = () => tasksAPI.list().then(r => setTasks(r.data || [])).catch(() => {});
  useEffect(() => { loadTasks(); }, []);
 
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.category === filter);
  const pending  = filtered.filter(t => !t.completed);
  const done     = filtered.filter(t =>  t.completed);
 
  const complete = async id => { await tasksAPI.complete(id); toast.success('Task completed! ✓'); loadTasks(); };
  const remove   = async id => { await tasksAPI.delete(id); loadTasks(); };
 
  const add = async () => {
    if (!form.title.trim()) return;
    await tasksAPI.create(form);
    toast.success('Task created!');
    setForm({ title:'', category:'general', priority:'medium' });
    setShowAdd(false);
    setTimeout(loadTasks, 500);
  };
 
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Health Tasks</h1>
          <p>{pending.length} pending · {done.length} completed</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          background:'var(--accent)', border:'none', borderRadius:10,
          padding:'10px 18px', color:'white',
          display:'flex', alignItems:'center', gap:6,
          fontSize:13, fontWeight:700,
          fontFamily:"'Plus Jakarta Sans', sans-serif",
          letterSpacing:'-0.01em',
          boxShadow:'0 4px 12px rgba(124,106,247,0.25)',
          cursor:'pointer',
        }}>
          <Plus size={15} /> New Task
        </button>
      </div>
 
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Task title" style={{ flex:2, minWidth:200 }} />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ minWidth:120 }}>
                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={{ minWidth:100 }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button onClick={add} style={{
                background:'var(--accent)', border:'none', borderRadius:9,
                padding:'9px 18px', color:'white', cursor:'pointer',
                fontSize:13, fontWeight:700,
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                letterSpacing:'-0.01em',
              }}>Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Category filters */}
      <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? 'var(--accent)' : 'var(--surface)',
            border: `1px solid ${filter === c ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:99, padding:'5px 14px',
            color: filter === c ? 'white' : 'var(--muted)',
            cursor:'pointer', fontSize:12, fontWeight:600,
            fontFamily:"'Plus Jakarta Sans', sans-serif",
            letterSpacing:'-0.01em',
            transition:'all 0.15s ease',
            boxShadow: filter === c ? '0 2px 8px rgba(124,106,247,0.2)' : 'none',
          }}>{c}</button>
        ))}
      </div>
 
      {/* Pending */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'20px 24px', marginBottom:14 }}>
        <p className="label-caps" style={{ marginBottom:12 }}>Pending ({pending.length})</p>
        <AnimatePresence>
          {pending.map(task => (
            <motion.div key={task.id} layout initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, height:0 }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <button onClick={() => complete(task.id)} style={{
                width:20, height:20, borderRadius:6, flexShrink:0,
                border:'1.5px solid var(--border)', background:'transparent',
                cursor:'pointer', transition:'all 0.15s ease',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent2)'; e.target.style.background = 'rgba(79,216,196,0.1)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'transparent'; }}
              />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, letterSpacing:'-0.01em', marginBottom:3 }}>{task.title}</div>
                <span style={{
                  fontSize:10, fontWeight:600,
                  color: CAT_COLORS[task.category] || 'var(--muted)',
                  background: `${CAT_COLORS[task.category] || 'var(--muted)'}15`,
                  padding:'2px 8px', borderRadius:99, letterSpacing:'0.02em', textTransform:'capitalize',
                }}>{task.category}</span>
              </div>
              <span style={{
                fontSize:10, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
                padding:'3px 9px', borderRadius:99,
                background: `${PRI_COLORS[task.priority] || 'var(--accent)'}15`,
                color: PRI_COLORS[task.priority] || 'var(--accent)',
              }}>{task.priority}</span>
              <button onClick={() => remove(task.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', padding:4, opacity:0.6 }}>
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && <p style={{ color:'var(--muted)', fontSize:14, letterSpacing:'-0.01em' }}>All clear! No pending tasks.</p>}
      </div>
 
      {/* Completed */}
      {done.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'20px 24px', opacity:0.65 }}>
          <p className="label-caps" style={{ marginBottom:12 }}>Completed ({done.length})</p>
          {done.slice(0, 5).map(task => (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:16, height:16, borderRadius:5, background:'rgba(79,216,196,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:9, color:'var(--accent2)', fontWeight:800 }}>✓</span>
              </div>
              <span style={{ fontSize:14, textDecoration:'line-through', color:'var(--muted)', letterSpacing:'-0.01em' }}>{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Tasks;