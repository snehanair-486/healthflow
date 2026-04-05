import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, category, priority } = req.body;
    const { data } = await supabase
      .from('tasks')
      .insert({ id: uuidv4(), user_id: userId, title, category, priority })
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    const { data } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('tasks').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;