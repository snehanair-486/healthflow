import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const { data } = await supabase
      .from('users')
      .insert({ id: uuidv4(), email, password, name })
      .select()
      .single();
    res.json({ userId: data.id, name: data.name, email: data.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    if (!data) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ userId: data.id, name: data.name, email: data.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;