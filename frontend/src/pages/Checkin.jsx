import { useState, useEffect } from 'react';
import { checkinAPI } from '../api';
import toast from 'react-hot-toast';
import { Moon, Smile, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const SYMPTOMS = ['Headache','Fatigue','Nausea','Sore throat','Runny nose','Body ache','Fever','Stress','Anxiety','None'];

export default function Checkin() {
  const [form, setForm] = useState({ sleep_hours:'', mood_score:5, energy_level:5, symptoms:'', notes:'' });
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

  const toggleSymptom = s => {
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
    } catch { toast.error('Could not save. Try again.'); }
    setLoading(false);
  };

  const sleepFeedback = () => {
    const h = parseFloat(form.sleep_hours);
    if (!h) return null;
    if (h < 6) return { text: 'Too little sleep. Aim for 7–9 hours.', color: '#f97066' };
    if (h <= 9) return { text: 'Great sleep duration!', color: '#4fd8c4' };
    return { text: 'Slightly over — 7–9 hours is ideal.', color: '#f5a623' };
  };
  const fb = sleepFeedback();

  return (
    <div style={{ maxWidth: 600 }}>
      <style>{`
        .hf-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 20px;
          background: transparent;
          cursor: pointer;
          outline: none;
          border: none;
          padding: 0;
          margin: 0;
          display: block;
        }
        .hf-slider::-webkit-slider-runnable-track {
          height: 5px;
          border-radius: 99px;
          background: var(--border);
        }
        .hf-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-top: -7.5px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.35);
          transition: transform 0.12s ease;
        }
        .hf-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .hf-slider::-moz-range-track {
          height: 5px;
          border-radius: 99px;
          background: var(--border);
        }
        .hf-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          box-shadow: 0 1px 5px rgba(0,0,0,0.35);
        }
        .hf-slider-mood::-webkit-slider-thumb { background: #f5a623; }
        .hf-slider-mood::-moz-range-thumb     { background: #f5a623; }
        .hf-slider-energy::-webkit-slider-thumb { background: #4fd8c4; }
        .hf-slider-energy::-moz-range-thumb     { background: #4fd8c4; }

        .hf-pill {
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--muted);
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.01em;
          transition: all 0.15s ease;
        }
        .hf-pill:hover { border-color: var(--accent); color: var(--text); }
        .hf-pill.active {
          background: rgba(124,106,247,0.12);
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>

      <div className="page-header">
        <h1>Daily Check-in</h1>
        <p>{saved ? "You've checked in today — you can update anytime." : 'How are you doing today?'}</p>
      </div>

      {saved && (
        <div style={{
          background: 'rgba(79,216,196,0.07)',
          border: '1px solid rgba(79,216,196,0.25)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: '#4fd8c4', letterSpacing: '-0.01em'
        }}>
          <CheckCircle size={15} /> Today's check-in saved. Edit and save again to update.
        </div>
      )}

      {/* Sleep */}
      <Card icon={<Moon size={17} color="var(--accent)" />} title="Sleep">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number" min="0" max="24" step="0.5"
            placeholder="Hours slept"
            value={form.sleep_hours}
            onChange={e => setForm({ ...form, sleep_hours: e.target.value })}
            style={{ width: 140 }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>hours last night</span>
        </div>
        {fb && (
          <p style={{ marginTop: 10, fontSize: 13, color: fb.color, fontWeight: 500, letterSpacing: '-0.01em' }}>
            {fb.text}
          </p>
        )}
      </Card>

      {/* Mood */}
      <Card icon={<Smile size={17} color="#f5a623" />} title={`Mood — ${form.mood_score}/10`}>
        <input
          type="range" min="1" max="10"
          value={form.mood_score}
          onChange={e => setForm({ ...form, mood_score: parseInt(e.target.value) })}
          className="hf-slider hf-slider-mood"
        />
        <ScaleLabels left="😔 Very low" center="😐 Neutral" right="😄 Great" />
        <FillBar value={form.mood_score} color="#f5a623" />
      </Card>

      {/* Energy */}
      <Card icon={<Zap size={17} color="#4fd8c4" />} title={`Energy Level — ${form.energy_level}/10`}>
        <input
          type="range" min="1" max="10"
          value={form.energy_level}
          onChange={e => setForm({ ...form, energy_level: parseInt(e.target.value) })}
          className="hf-slider hf-slider-energy"
        />
        <ScaleLabels left="🪫 Exhausted" center="⚡ Normal" right="🚀 Energized" />
        <FillBar value={form.energy_level} color="#4fd8c4" />
      </Card>

      {/* Symptoms */}
      <Card icon={<AlertCircle size={17} color="var(--accent3)" />} title="How do you feel?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SYMPTOMS.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`hf-pill${selected.includes(s) ? ' active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card title="Notes (optional)">
        <textarea
          placeholder="Anything else on your mind today?"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
        />
      </Card>

      <button
        onClick={save}
        disabled={loading}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: loading ? 'var(--muted)' : 'white',
          fontSize: 15, fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.02em',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(124,106,247,0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? 'Saving…' : saved ? 'Update Check-in' : 'Save Check-in'}
      </button>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16, padding: 22, marginBottom: 14
    }}>
      {(icon || title) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {icon}
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function ScaleLabels({ left, center, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 11, color: 'var(--muted)', marginTop: 6,
      letterSpacing: '-0.01em'
    }}>
      <span>{left}</span><span>{center}</span><span>{right}</span>
    </div>
  );
}

/* Secondary filled progress bar beneath each slider for extra clarity */
function FillBar({ value, color }) {
  return (
    <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${((value - 1) / 9) * 100}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.12s ease',
      }} />
    </div>
  );
}