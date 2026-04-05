import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', req.params.userId)
      .single();
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, name, weight_kg, height_cm, age, gender, activity_level, goal } = req.body;
    const { data: existing } = await supabase
      .from('health_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { data } = await supabase
        .from('health_profiles')
        .update({ name, weight_kg, height_cm, age, gender, activity_level, goal, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      return res.json(data);
    }

    const { data } = await supabase
      .from('health_profiles')
      .insert({ id: uuidv4(), user_id: userId, name, weight_kg, height_cm, age, gender, activity_level, goal })
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;