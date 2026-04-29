import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Droplets, Flame, Smile, Trophy, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'hf_dismissed_nudges';

function getDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const today = new Date().toDateString();
    return parsed.date === today ? parsed.ids : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: new Date().toDateString(),
    ids,
  }));
}

function buildNudges({ todayWater = 0, waterGoal = 2000, todayCalories = 0, hasCheckin = false, streak = 0 }) {
  const hour = new Date().getHours();
  const nudges = [];

  if (todayWater < waterGoal * 0.5) {
    const pct = Math.round((todayWater / waterGoal) * 100);
    nudges.push({
      id: 'hydration',
      icon: Droplets,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.06)',
      border: 'rgba(56,189,248,0.18)',
      title: 'Drink up',
      body: `You're at ${pct}% of your water goal. Dehydration hits focus first.`,
      cta: 'Log water',
      ctaPath: '/hydration',
      aiPrompt: null,
    });
  }

  if (todayCalories < 500) {
    nudges.push({
      id: 'nutrition',
      icon: Flame,
      color: '#ddc38b',
      bg: 'rgba(251,146,60,0.06)',
      border: 'rgba(251,146,60,0.18)',
      title: 'Fuel your day',
      body: `Only ${todayCalories} kcal logged so far. Your body needs more to keep going.`,
      cta: 'Log a meal',
      ctaPath: '/nutrition',
      aiPrompt: `Suggest a quick healthy meal for someone who has only eaten ${todayCalories} calories today.`,
    });
  }

  if (!hasCheckin) {
    nudges.push({
      id: 'checkin',
      icon: Smile,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.06)',
      border: 'rgba(167,139,250,0.18)',
      title: 'How are you feeling?',
      body: "You haven't done your daily check-in yet. It takes 30 seconds.",
      cta: 'Check in now',
      ctaPath: '/checkin',
      aiPrompt: null,
    });
  }

  if (streak > 0 && streak % 7 === 0) {
    nudges.push({
      id: `streak-${streak}`,
      icon: Trophy,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.06)',
      border: 'rgba(251,191,36,0.18)',
      title: `${streak}-day streak`,
      body: `You've been consistent for ${streak} days. That's real discipline.`,
      cta: 'Ask AI for next goal',
      ctaPath: '/chat',
      aiPrompt: `I've maintained a ${streak}-day health streak. What should my next challenge be?`,
    });
  }

  return nudges;
}

function NudgeCard({ nudge, onDismiss }) {
  const navigate = useNavigate();
  const Icon = nudge.icon;

  function handleCta() {
    if (nudge.aiPrompt) {
      sessionStorage.setItem('hf_prefill_chat', nudge.aiPrompt);
    }
    navigate(nudge.ctaPath);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.96 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        background: nudge.bg,
        border: `1px solid ${nudge.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: `${nudge.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={17} color={nudge.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 2 }}>
          {nudge.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
          {nudge.body}
        </div>
      </div>

      <button
        onClick={handleCta}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 4,
          background: nudge.color,
          color: '#fff',
          border: 'none', borderRadius: 8,
          padding: '6px 11px',
          fontSize: 12, fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.01em',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {nudge.cta}
        <ChevronRight size={12} />
      </button>

      <button
        onClick={() => onDismiss(nudge.id)}
        style={{
          position: 'absolute', top: 7, right: 7,
          background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--muted)',
          padding: 2, display: 'flex', alignItems: 'center',
          borderRadius: 4,
        }}
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

export default function ProactiveNudges({ todayWater, waterGoal, todayCalories, hasCheckin, streak }) {
  const [dismissed, setDismissed] = useState(getDismissed);
  const allNudges = buildNudges({ todayWater, waterGoal, todayCalories, hasCheckin, streak });
  const visible = allNudges.filter(n => !dismissed.includes(n.id));

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
  }

  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      <AnimatePresence mode="popLayout">
        {visible.map(nudge => (
          <NudgeCard key={nudge.id} nudge={nudge} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}