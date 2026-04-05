import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/hydration', async (req, res) => {
  try {
    const { userId, amount_ml, note } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('hydration_logs')
      .insert({ id: uuidv4(), user_id: userId, amount_ml, note, date: today })
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hydration/:userId/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('date', today)
      .order('logged_at', { ascending: true });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hydration/:userId/week', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data } = await supabase
      .from('hydration_logs')
      .select('date, amount_ml')
      .eq('user_id', req.params.userId)
      .gte('date', weekAgo)
      .order('date');
    const grouped = data?.reduce((acc, log) => {
      acc[log.date] = (acc[log.date] || 0) + log.amount_ml;
      return acc;
    }, {});
    res.json(grouped || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;