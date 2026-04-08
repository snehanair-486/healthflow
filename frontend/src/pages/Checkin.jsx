import { useState, useEffect } from 'react';
import { checkinAPI } from '../api';
import toast from 'react-hot-toast';
import { Moon, Smile, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const symptoms = ['Headache', 'Fatigue', 'Nausea', 'Sore throat', 'Runny nose', 'Body ache', 'Fever', 'Stress', 'Anxiety', 'None'];

export default function Checkin() {
  const [form, setForm] = useState({ sleep_hours: '', mood_score: 5, energy_level: 5, symptoms: '', notes: '' });
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkinAPI.today().then(r => {
      if (r.data) {
        setSaved(r.data);
        setForm({
          sleep_hours: r.data.sleep_hours || '',
          mood_score: r.data.mood_score || 5,
          energy_level: r.data.energy_level || 5,
          symptoms: r.data.symptoms || '',
          notes: r.data.notes || ''
        });
        if (r.data.symptoms) setSelected(r.data.symptoms.split(', ').filter(Boolean));
      }
    }).catch(() => {});
  }, []);

  const toggleSymptom = (s) => {
    const updated = selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s];
    setSelected(updated);
    setForm(f => ({ ...f, symptoms: updated.filter(x => x !== 'None').join(', ') }));
  };

  const save = async () => {
    if (!form.sleep_hours) { toast.error('Please enter sleep hours'); return; }
    setLoading(true);
    try {
      const res = await checkinAPI.save(form);
      setSaved(res.data);
      toast.success(saved ? 'Check-in updated!' : 'Check-in saved!');
    } catch {
      toast.error('Could not save. Try again.');
    }
    setLoading(false);
  };

  const sleepFeedback = () => {
    const h = parseFloat(form.sleep_hours);
    if (!h) return null;
    if (h < 6) return { text: 'Too little sleep. Aim for 7-9 hours.', color: '#f97066' };
    if (h <= 9) return { text: 'Great sleep duration!', color: '#4fd8c4' };
    return { text: 'Slightly over — 7-9 hours is ideal.', color: '#f5a623' };
  };

  const feedback = sleepFeedback();

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Daily Check-in</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {saved ? 'You\'ve checked in today — you can update anytime.' : 'How are you doing today?'}
        </p>
      </div>

      {saved && (
        <div style={{
          background: 'rgba(79,216,196,0.08)', border: '1px solid rgba(79,216,196,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4fd8c4'
        }}>
          <CheckCircle size={16} /> Today's check-in saved. Edit and save again to update.
        </div>
      )}

      {/* Sleep */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Moon size={18} color="var(--accent)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sleep</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number" min="0" max="24" step="0.5"
            placeholder="Hours slept"
            value={form.sleep_hours}
            onChange={e => setForm({ ...form, sleep_hours: e.target.value })}
            style={{ ...inputStyle, width: 140 }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>hours last night</span>
        </div>
        {feedback && (
          <p style={{ marginTop: 10, fontSize: 13, color: feedback.color }}>{feedback.text}</p>
        )}
      </div>

      {/* Mood */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Smile size={18} color="#f5a623" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mood — {form.mood_score}/10</h3>
        </div>
        <input type="range" min="1" max="10" value={form.mood_score}
          onChange={e => setForm({ ...form, mood_score: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          <span>😔 Very low</span><span>😐 Neutral</span><span>😄 Great</span>
        </div>
      </div>

      {/* Energy */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={18} color="#4fd8c4" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Energy Level — {form.energy_level}/10</h3>
        </div>
        <input type="range" min="1" max="10" value={form.energy_level}
          onChange={e => setForm({ ...form, energy_level: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent2)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          <span>🪫 Exhausted</span><span>⚡ Normal</span><span>🚀 Energized</span>
        </div>
      </div>

      {/* Symptoms */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertCircle size={18} color="#f97066" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>How do you feel?</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {symptoms.map(s => (
            <button key={s} onClick={() => toggleSymptom(s)} style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${selected.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
              background: selected.includes(s) ? 'rgba(124,106,247,0.15)' : 'var(--surface2)',
              color: selected.includes(s) ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.15s'
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Notes (optional)</h3>
        <textarea
          placeholder="Anything else on your mind today?"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      <button onClick={save} disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif"
      }}>
        {loading ? 'Saving...' : saved ? 'Update Check-in' : 'Save Check-in'}
      </button>
    </div>
  );
}

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: 20, marginBottom: 14
};

const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
  fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box'
};