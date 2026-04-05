import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { healthAPI, tasksAPI } from '../api';
import { useProfile } from '../hooks/useProfile';

export default function Insights() {
  const { recommendedWater } = useProfile();
  const [weekData, setWeekData] = useState({});
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    healthAPI.weekHydration().then(r => setWeekData(r.data || {})).catch(() => {});
    tasksAPI.list().then(r => setTasks(r.data || [])).catch(() => {});
  }, []);

  const chartData = Object.entries(weekData).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    amount, goal: recommendedWater
  }));

  const catData = ['hydration', 'exercise', 'medication', 'nutrition', 'sleep', 'general'].map(cat => ({
    name: cat,
    total: tasks.filter(t => t.category === cat).length,
    done: tasks.filter(t => t.category === cat && t.completed).length
  })).filter(d => d.total > 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Insights</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Your health trends this week</p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>HYDRATION THIS WEEK (ml)</h2>
        {chartData.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data yet. Start logging water!</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="goal" fill="var(--border)" radius={[4, 4, 0, 0]} name="Goal" />
              <Bar dataKey="amount" fill="var(--accent2)" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {catData.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>TASKS BY CATEGORY</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="total" fill="var(--border)" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="done" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}