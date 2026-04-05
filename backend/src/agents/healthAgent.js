import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';

export async function runHealthAgent(userId, query) {
  const { data: profile } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const { data: hydrationLogs } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: weekLogs } = await supabase
    .from('hydration_logs')
    .select('date, amount_ml')
    .eq('user_id', userId)
    .gte('date', weekAgo);

  const todayTotal = hydrationLogs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;

  let recommendedMl = 2000;
  if (profile?.weight_kg) {
    const activityMultipliers = {
      sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.4, very_active: 1.6
    };
    recommendedMl = Math.round(profile.weight_kg * 35 * (activityMultipliers[profile.activity_level] || 1.2));
  }

  const systemPrompt = `You are a Health Agent, a specialist in hydration, BMI, and wellness analysis.

User Profile:
${profile ? `- Name: ${profile.name || 'User'}
- Weight: ${profile.weight_kg}kg
- Height: ${profile.height_cm}cm
- Age: ${profile.age} years
- Gender: ${profile.gender}
- Activity Level: ${profile.activity_level}
- Goal: ${profile.goal}
- BMI: ${profile.weight_kg && profile.height_cm ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1) : 'not calculated'}` : 'No profile set up yet.'}

Today's Hydration: ${todayTotal}ml / ${recommendedMl}ml recommended
Deficit/Surplus: ${todayTotal - recommendedMl}ml
Weekly data: ${JSON.stringify(weekLogs || [])}

Be warm but direct. Use numbers. Keep response under 150 words unless doing a full analysis.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return {
    response: response.choices[0].message.content,
    data: { todayHydration: todayTotal, recommendedMl, profile, deficit: todayTotal - recommendedMl }
  };
}