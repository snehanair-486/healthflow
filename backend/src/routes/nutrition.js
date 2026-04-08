import express from 'express';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { groq, MODEL } from '../groq.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { userId, meal_description, meal_type } = req.body;

    const aiResponse = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Analyze the given meal and respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Use this exact format:
{"calories":350,"protein_g":12,"carbs_g":45,"fat_g":8,"health_score":72,"analysis":"Brief 2-sentence analysis of how healthy this meal is and one suggestion."}`
        },
        {
          role: 'user',
          content: `Analyze this meal: ${meal_description}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    let nutrition = {};
    try {
      const raw = aiResponse.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      nutrition = JSON.parse(clean);
    } catch {
      nutrition = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, health_score: 50, analysis: 'Could not analyze this meal.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('nutrition_logs')
      .insert({
        id: uuidv4(),
        user_id: userId,
        meal_description,
        meal_type: meal_type || 'general',
        calories: nutrition.calories,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g,
        health_score: nutrition.health_score,
        analysis: nutrition.analysis,
        date: today,
        logged_at: new Date().toISOString()
      })
      .select()
      .single();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('date', today)
      .order('logged_at', { ascending: true });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/week', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .gte('date', weekAgo)
      .order('logged_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('nutrition_logs').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;