import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';
 
const ACTIVITY_OPTIONS = [
  { value:'sedentary',  label:'Sedentary',   desc:'Little or no exercise' },
  { value:'light',      label:'Light',        desc:'1–3 days/week' },
  { value:'moderate',   label:'Moderate',     desc:'3–5 days/week' },
  { value:'active',     label:'Active',       desc:'6–7 days/week' },
  { value:'very_active',label:'Very Active',  desc:'Physical job or 2×/day' },
];
 
export function Profile() {
  const { profile, saveProfile, recommendedWater, bmi } = useProfile();
  const [form, setForm] = useState({ name:'', weight_kg:'', height_cm:'', age:'', gender:'male', activity_level:'moderate', goal:'general_health' });
  const [saving, setSaving] = useState(false);
 
  useEffect(() => { if (profile) setForm(f => ({ ...f, ...profile })); }, [profile]);
 
  const save = async () => {
    setSaving(true);
    try { await saveProfile(form); toast.success('Profile saved!'); }
    catch { toast.error('Failed to save'); }
    setSaving(false);
  };
 
  return (
    <div style={{ maxWidth:600 }}>
      <div className="page-header">
        <h1>Health Profile</h1>
        <p>Used by AI agents to personalise your recommendations</p>
      </div>
 
      {profile?.weight_kg && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:22 }}>
          {[
            { label:'BMI', value:bmi, note: parseFloat(bmi)<18.5?'Underweight':parseFloat(bmi)<25?'Normal':parseFloat(bmi)<30?'Overweight':'Obese' },
            { label:'Daily Water Goal', value:`${(recommendedWater/1000).toFixed(1)}L`, note:`${recommendedWater}ml recommended` },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
              <p style={{ fontSize:11, color:'var(--muted)', fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</p>
              <div style={{ fontFamily:"'Outfit', sans-serif", fontSize:24, fontWeight:800, letterSpacing:'-0.04em', marginBottom:3 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--accent2)', fontWeight:500, letterSpacing:'-0.01em' }}>{s.note}</div>
            </div>
          ))}
        </div>
      )}
 
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'24px 28px' }}>
        <FormField label="Name">
          <input value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" style={{ width:'100%' }} />
        </FormField>
 
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FormField label="Weight (kg)">
            <input type="number" value={form.weight_kg||''} onChange={e => setForm({...form, weight_kg: parseFloat(e.target.value)})} placeholder="70" style={{ width:'100%' }} />
          </FormField>
          <FormField label="Height (cm)">
            <input type="number" value={form.height_cm||''} onChange={e => setForm({...form, height_cm: parseFloat(e.target.value)})} placeholder="170" style={{ width:'100%' }} />
          </FormField>
        </div>
 
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FormField label="Age">
            <input type="number" value={form.age||''} onChange={e => setForm({...form, age: parseFloat(e.target.value)})} placeholder="25" style={{ width:'100%' }} />
          </FormField>
          <FormField label="Gender">
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} style={{ width:'100%' }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
        </div>
 
        <FormField label="Activity Level">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:2 }}>
            {ACTIVITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setForm({...form, activity_level: opt.value})} style={{
                background: form.activity_level === opt.value ? 'rgba(124,106,247,0.12)' : 'var(--surface2)',
                border: `1px solid ${form.activity_level === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:9, padding:'8px 12px', cursor:'pointer', textAlign:'left',
                transition:'all 0.15s ease',
              }}>
                <div style={{ fontSize:12, color:'var(--text)', fontWeight:600, letterSpacing:'-0.01em' }}>{opt.label}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:1, letterSpacing:'-0.01em' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </FormField>
 
        <motion.button
          whileHover={{ scale:1.01, y:-1 }}
          whileTap={{ scale:0.99 }}
          onClick={save}
          disabled={saving}
          style={{
            width:'100%', background: saving ? 'var(--surface2)' : 'var(--accent)',
            border:'none', borderRadius:12, padding:'13px',
            color: saving ? 'var(--muted)' : 'white',
            cursor: saving ? 'not-allowed':'pointer',
            fontSize:15, fontWeight:700,
            fontFamily:"'Plus Jakarta Sans', sans-serif",
            letterSpacing:'-0.02em',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(124,106,247,0.25)',
            marginTop:8,
          }}>
          {saving ? 'Saving…' : 'Save Profile'}
        </motion.button>
      </div>
    </div>
  );
}
 
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
export default Profile;