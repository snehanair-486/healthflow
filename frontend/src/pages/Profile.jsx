import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'active', label: 'Active', desc: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Physical job or 2x/day' },
];

export default function Profile() {
  const { profile, saveProfile, recommendedWater, bmi } = useProfile();
  const [form, setForm] = useState({
    name: '', weight_kg: '', height_cm: '', age: '',
    gender: 'male', activity_level: 'moderate', goal: 'general_health'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ ...form, ...profile });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile(form);
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const inp = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
        placeholder={placeholder} style={{
          width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none'
        }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Health Profile</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Used by AI agents to personalize your recommendations</p>

      {profile?.weight_kg && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'BMI', value: bmi, note: parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese' },
            { label: 'Daily Water Goal', value: `${(recommendedWater/1000).toFixed(1)}L`, note: `${recommendedWater}ml` },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--accent2)' }}>{s.note}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
        {inp('Name', 'name', 'text', 'Your name')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>{inp('Weight (kg)', 'weight_kg', 'number', '70')}</div>
          <div>{inp('Height (cm)', 'height_cm', 'number', '170')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>{inp('Age', 'age', 'number', '25')}</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Gender</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none'
            }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Activity Level</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {activityOptions.map(opt => (
            <button key={opt.value} onClick={() => setForm({ ...form, activity_level: opt.value })} style={{
              background: form.activity_level === opt.value ? 'rgba(124,106,247,0.2)' : 'var(--surface2)',
              border: `1px solid ${form.activity_level === opt.value ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={save} disabled={saving} style={{
            width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 12,
            padding: '14px', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 600,
            fontFamily: 'Syne', opacity: saving ? 0.7 : 1
          }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </motion.button>
      </div>
    </div>
  );
}