import express from 'express';
import { runOrchestrator } from '../agents/orchestrator.js';
import { supabase } from '../db.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });
    const result = await runOrchestrator(userId, message);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: true })
      .limit(50);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;