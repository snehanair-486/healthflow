import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, sleep_hours, mood_score, energy_level, symptoms, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    let data;
    if (existing) {
      const result = await supabase
        .from('daily_checkins')
        .update({ sleep_hours, mood_score, energy_level, symptoms, notes, logged_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
    } else {
      const result = await supabase
        .from('daily_checkins')
        .insert({ id: uuidv4(), user_id: userId, sleep_hours, mood_score, energy_level, symptoms, notes, date: today, logged_at: new Date().toISOString() })
        .select()
        .single();
      data = result.data;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('date', today)
      .single();
    res.json(data || null);
  } catch (err) {
    res.json(null);
  }
});

router.get('/:userId/recent', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.params.userId)
      .gte('date', weekAgo)
      .order('date', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;