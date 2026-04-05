import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

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
    .eq('date', today)
    .order('logged_at', { ascending: true });
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

  // Check if user is logging water
  const waterMatch = query.match(/(\d+)\s*ml/i);
  const isLogging = waterMatch && (
    query.toLowerCase().includes('drank') ||
    query.toLowerCase().includes('drank') ||
    query.toLowerCase().includes('drunk') ||
    query.toLowerCase().includes('had') ||
    query.toLowerCase().includes('drink') ||
    query.toLowerCase().includes('log') ||
    query.toLowerCase().includes('add') ||
    query.toLowerCase().includes('consumed')
  );

  let actualTotal = todayTotal;

  if (isLogging && waterMatch) {
    const amount = parseInt(waterMatch[1]);
    const { error: insertError } = await supabase.from('hydration_logs').insert({
      id: uuidv4(),
      user_id: userId,
      amount_ml: amount,
      note: `Logged via AI chat`,
      date: today,
      logged_at: new Date().toISOString()
    });
    if (insertError) console.error('Hydration insert error:', insertError);
    actualTotal = todayTotal + amount;
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

Today's Hydration: ${actualTotal}ml / ${recommendedMl}ml recommended
Deficit/Surplus: ${actualTotal - recommendedMl}ml
Weekly data: ${JSON.stringify(weekLogs || [])}

${isLogging && waterMatch ? `The user just logged ${waterMatch[1]}ml. Their new total is ${actualTotal}ml. Confirm this and tell them how much more they need.` : ''}

Be warm but direct. Use the EXACT numbers above — never make up numbers. Keep response under 150 words.`;

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
    data: { todayHydration: actualTotal, recommendedMl, profile, deficit: actualTotal - recommendedMl }
  };
}