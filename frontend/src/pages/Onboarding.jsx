import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profileAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Lightly Active', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Very Active', desc: '6–7 days/week' },
];

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain', label: 'Stay Healthy' },
  { value: 'gain_muscle', label: 'Build Muscle' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '',
    activity_level: '', goal: '', gender: 'male',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Compute BMI for the summary step
  const bmi = form.weight && form.height
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  const inputStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 6,
    display: 'block',
  };

  const canNext1 = form.name.trim() && form.age && form.weight && form.height;
  const canNext2 = form.activity_level && form.goal;

  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      await profileAPI.save({
        name: form.name.trim(),
        age: Number(form.age),
        // Send BOTH field name variants so backend and AppShell both work
        weight: Number(form.weight),
        weight_kg: Number(form.weight),
        height: Number(form.height),
        height_cm: Number(form.height),
        gender: form.gender,
        activity_level: form.activity_level,
        goal: form.goal,
        bmi: bmi ? Number(bmi) : null,
      });
      onComplete?.();
      navigate('/');
    } catch (e) {
      setError('Something went wrong saving your profile. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 28, fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.04em',
            marginBottom: 6,
          }}>
            HealthFlow
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Set up your profile so we can personalise everything for you.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: 4, borderRadius: 99, flex: 1, maxWidth: 80,
              background: s <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        {/* Card */}
        <motion.div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '32px 28px',
        }}>
          <AnimatePresence mode="wait">

            {/* Step 1: Basic info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Tell us about yourself
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
                  We use this to calculate your hydration goal, BMI, and daily targets.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Your name</label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. Alex"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Age</label>
                      <input
                        style={inputStyle}
                        type="number" min="10" max="100"
                        placeholder="25"
                        value={form.age}
                        onChange={e => set('age', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select
                        style={inputStyle}
                        value={form.gender}
                        onChange={e => set('gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Weight (kg)</label>
                      <input
                        style={inputStyle}
                        type="number" min="30" max="250"
                        placeholder="70"
                        value={form.weight}
                        onChange={e => set('weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Height (cm)</label>
                      <input
                        style={inputStyle}
                        type="number" min="100" max="250"
                        placeholder="175"
                        value={form.height}
                        onChange={e => set('height', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canNext1}
                  onClick={() => setStep(2)}
                  style={{
                    marginTop: 28, width: '100%',
                    padding: '14px',
                    background: canNext1 ? 'var(--accent)' : 'var(--border)',
                    color: canNext1 ? '#fff' : 'var(--muted)',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700,
                    cursor: canNext1 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2: Activity + Goal */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Lifestyle and goal
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
                  This helps us tailor your nutrition, hydration, and task recommendations.
                </p>

                <label style={labelStyle}>Activity level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {ACTIVITY_LEVELS.map(a => (
                    <div
                      key={a.value}
                      onClick={() => set('activity_level', a.value)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${form.activity_level === a.value ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.activity_level === a.value ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.desc}</span>
                    </div>
                  ))}
                </div>

                <label style={labelStyle}>Your goal</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {GOALS.map(g => (
                    <div
                      key={g.value}
                      onClick={() => set('goal', g.value)}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 12,
                        border: `1px solid ${form.goal === g.value ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.goal === g.value ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {g.label}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: '14px',
                      background: 'transparent',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)', borderRadius: 12,
                      fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Back
                  </button>
                  <button
                    disabled={!canNext2}
                    onClick={() => setStep(3)}
                    style={{
                      flex: 2, padding: '14px',
                      background: canNext2 ? 'var(--accent)' : 'var(--border)',
                      color: canNext2 ? '#fff' : 'var(--muted)',
                      border: 'none', borderRadius: 12,
                      fontSize: 14, fontWeight: 700,
                      cursor: canNext2 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review + save */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Review your profile
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
                  Everything looks good, {form.name}? Hit save and your dashboard is ready.
                </p>

                {/* Summary grid */}
                <div style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '20px',
                  marginBottom: 24,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}>
                  {[
                    { label: 'Weight', value: `${form.weight} kg` },
                    { label: 'Height', value: `${form.height} cm` },
                    { label: 'Age', value: `${form.age} yrs` },
                    { label: 'Gender', value: form.gender.charAt(0).toUpperCase() + form.gender.slice(1) },
                    {
                      label: 'BMI',
                      value: bmi,
                      sub: bmiCategory,
                    },
                    {
                      label: 'Goal',
                      value: GOALS.find(g => g.value === form.goal)?.label,
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                        {item.value}
                      </div>
                      {item.sub && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.sub}</div>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <p style={{ color: 'var(--accent3)', fontSize: 13, marginBottom: 16 }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1, padding: '14px',
                      background: 'transparent',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)', borderRadius: 12,
                      fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={saving}
                    style={{
                      flex: 2, padding: '15px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none', borderRadius: 12,
                      fontSize: 14, fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      fontFamily: 'inherit',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save and go to dashboard'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
          Step {step} of 3
        </p>
      </div>
    </div>
  );
}