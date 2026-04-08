import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export async function runHealthAgent(userId, query) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch everything in parallel
  const [profileRes, hydrationRes, weekHydrationRes, nutritionRes, checkinRes, recentCheckinsRes] = await Promise.all([
    supabase.from('health_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('hydration_logs').select('*').eq('user_id', userId).eq('date', today).order('logged_at', { ascending: true }),
    supabase.from('hydration_logs').select('date, amount_ml').eq('user_id', userId).gte('date', weekAgo),
    supabase.from('nutrition_logs').select('*').eq('user_id', userId).eq('date', today).order('logged_at', { ascending: true }),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).gte('date', weekAgo).order('date', { ascending: false })
  ]);

  const profile = profileRes.data;
  const hydrationLogs = hydrationRes.data || [];
  const weekHydration = weekHydrationRes.data || [];
  const nutritionLogs = nutritionRes.data || [];
  const todayCheckin = checkinRes.data || null;
  const recentCheckins = recentCheckinsRes.data || [];

  const todayHydration = hydrationLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const todayCalories = nutritionLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const todayMeals = nutritionLogs.map(l => l.meal_description).join(', ');

  let recommendedMl = 2000;
  if (profile?.weight_kg) {
    const activityMultipliers = { sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.4, very_active: 1.6 };
    recommendedMl = Math.round(profile.weight_kg * 35 * (activityMultipliers[profile.activity_level] || 1.2));
  }

  // Check if user is logging water
  const waterMatch = query.match(/(\d+)\s*ml/i);
  const isLoggingWater = waterMatch && (
    query.toLowerCase().includes('drank') ||
    query.toLowerCase().includes('drunk') ||
    query.toLowerCase().includes('had') ||
    query.toLowerCase().includes('drink') ||
    query.toLowerCase().includes('log') ||
    query.toLowerCase().includes('add') ||
    query.toLowerCase().includes('consumed') ||
    query.toLowerCase().includes('water')
  );

  let actualHydration = todayHydration;

  if (isLoggingWater && waterMatch) {
    const amount = parseInt(waterMatch[1]);
    const { error: insertError } = await supabase.from('hydration_logs').insert({
      id: uuidv4(),
      user_id: userId,
      amount_ml: amount,
      note: 'Logged via AI chat',
      date: today,
      logged_at: new Date().toISOString()
    });
    if (!insertError) actualHydration = todayHydration + amount;
  }

  // Average sleep from recent checkins
  const avgSleep = recentCheckins.length > 0
    ? (recentCheckins.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / recentCheckins.length).toFixed(1)
    : null;

  const systemPrompt = `You are HealthFlow's Health Agent — a warm, knowledgeable personal health assistant. You have full context about the user's health data and can answer any wellness question intelligently.

USER PROFILE:
${profile ? `- Name: ${profile.name || 'User'}
- Weight: ${profile.weight_kg}kg | Height: ${profile.height_cm}cm | Age: ${profile.age} | Gender: ${profile.gender}
- Activity Level: ${profile.activity_level} | Goal: ${profile.goal}
- BMI: ${profile.weight_kg && profile.height_cm ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1) : 'not set'}` : 'No profile set up yet. Encourage the user to fill in their profile.'}

TODAY'S DATA:
- Hydration: ${actualHydration}ml / ${recommendedMl}ml recommended (${actualHydration >= recommendedMl ? '✅ Goal met!' : `${recommendedMl - actualHydration}ml remaining`})
- Calories consumed: ${todayCalories > 0 ? `${todayCalories} kcal` : 'No meals logged yet'}
- Meals today: ${todayMeals || 'None logged'}
- Sleep last night: ${todayCheckin?.sleep_hours ? `${todayCheckin.sleep_hours} hours` : 'Not logged'}
- Mood today: ${todayCheckin?.mood_score ? `${todayCheckin.mood_score}/10` : 'Not logged'}
- Energy level: ${todayCheckin?.energy_level ? `${todayCheckin.energy_level}/10` : 'Not logged'}
- Symptoms: ${todayCheckin?.symptoms || 'None reported'}

RECENT HISTORY (last 7 days):
- Average sleep: ${avgSleep ? `${avgSleep} hours/night` : 'No data'}
- Recent check-ins: ${recentCheckins.length > 0 ? recentCheckins.slice(0, 3).map(c => `${c.date}: ${c.sleep_hours}h sleep, mood ${c.mood_score}/10`).join(' | ') : 'No recent data'}
- Weekly hydration: ${weekHydration.length > 0 ? weekHydration.slice(0, 3).map(w => `${w.date}: ${w.amount_ml}ml`).join(' | ') : 'No data'}

${isLoggingWater && waterMatch ? `JUST LOGGED: ${waterMatch[1]}ml water. New total: ${actualHydration}ml. Confirm this warmly and tell them how much more they need.` : ''}

INSTRUCTIONS:
- Use ONLY the exact numbers above — never make up data
- If asked about meal recommendations, look at what they've eaten today and suggest what's missing (protein, vegetables, fruits etc.)
- If asked about sleep, use their recent sleep history to give personalized advice
- If someone says they feel sick or has symptoms, give practical general wellness advice and suggest seeing a doctor for serious issues
- If asked general health questions (what to eat, how much to sleep etc.) answer based on their profile data
- Keep responses warm, concise, and under 180 words
- Never diagnose medical conditions`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    temperature: 0.7,
    max_tokens: 600
  });

  return {
    response: response.choices[0].message.content,
    data: { todayHydration: actualHydration, recommendedMl, todayCalories, profile }
  };
}