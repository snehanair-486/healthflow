import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2 } from 'lucide-react';
import { tasksAPI } from '../api';
import toast from 'react-hot-toast';

const categories = ['all', 'hydration', 'exercise', 'medication', 'nutrition', 'sleep', 'general'];
const catColors = {
  hydration: 'var(--accent2)', exercise: '#f5a623', medication: 'var(--accent3)',
  nutrition: '#a8d97f', sleep: 'var(--accent)', general: 'var(--muted)'
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'general', priority: 'medium'});

  const loadTasks = () => tasksAPI.list().then(r => setTasks(r.data || [])).catch(() => {});
  useEffect(() => { loadTasks(); }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.category === filter);
  const pending = filtered.filter(t => !t.completed);
  const done = filtered.filter(t => t.completed);

  const complete = async (id) => {
    await tasksAPI.complete(id);
    toast.success('Task completed! ✓');
    loadTasks();
  };

  const remove = async (id) => {
    await tasksAPI.delete(id);
    loadTasks();
  };

  const add = async () => {
  if (!form.title.trim()) return;
  await tasksAPI.create(form);
  toast.success('Task created!');
  setForm({ title: '', category: 'general', priority: 'medium'});
  setShowAdd(false);
  setTimeout(() => loadTasks(), 500);
};

  const colorScheme = localStorage.getItem('hf_theme') === 'light' ? 'light' : 'dark';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Health Tasks</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{pending.length} pending · {done.length} completed</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '10px 16px',
          color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14
        }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Task title" style={{
                  flex: 2, minWidth: 200, background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none'
                }} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none'
              }}>
                {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none'
              }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <button onClick={add} style={{
                background: 'var(--accent)', border: 'none', borderRadius: 8,
                padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: 14
              }}>Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? 'var(--accent)' : 'var(--surface)',
            border: `1px solid ${filter === c ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 20, padding: '6px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 13
          }}>{c}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>PENDING ({pending.length})</h2>
        <AnimatePresence>
          {pending.map(task => (
            <motion.div key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => complete(task.id)} style={{
                width: 22, height: 22, borderRadius: 6, border: '2px solid var(--border)',
                background: 'transparent', cursor: 'pointer', flexShrink: 0
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{task.title}</div>
                <span style={{ fontSize: 11, color: catColors[task.category] || 'var(--muted)', background: `${catColors[task.category]}20`, padding: '1px 6px', borderRadius: 4 }}>{task.category}</span>
              </div>
              
              <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: { high: 'rgba(249,112,102,0.15)', medium: 'rgba(124,106,247,0.15)', low: 'rgba(79,216,196,0.15)' }[task.priority], color: { high: 'var(--accent3)', medium: 'var(--accent)', low: 'var(--accent2)' }[task.priority] }}>
                {task.priority}
              </div>
              <button onClick={() => remove(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>All clear! No pending tasks.</p>}
      </div>

      {done.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, opacity: 0.7 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>COMPLETED ({done.length})</h2>
          {done.slice(0, 5).map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Check size={16} color="var(--accent2)" />
              <span style={{ fontSize: 14, textDecoration: 'line-through', color: 'var(--muted)' }}>{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}