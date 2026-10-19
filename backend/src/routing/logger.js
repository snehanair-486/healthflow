import { supabase } from '../db.js';

export async function logRouting(userId, message, d) {
  const { error } = await supabase.from('routing_logs').insert({
    user_id: String(userId), message, history: d.historyUsed, strategy: d.strategy,
    intents: d.intents, clarify: d.clarify, parse_error: d.parseError,
    latency_ms: d.latencyMs, tokens: d.tokens, model: d.model
  });
  if (error) console.error('routing log failed:', error.message);
}