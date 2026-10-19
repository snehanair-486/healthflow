import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';
import { runHealthAgent } from './healthAgent.js';
import { runTaskAgent } from './taskAgent.js';
import { runReminderAgent } from './reminderAgent.js';
import { routeMessage } from '../routing/router.js';
import { logRouting } from '../routing/logger.js';
import { v4 as uuidv4 } from 'uuid';

async function maybeRemind(userId, taskCreated) {
  if (taskCreated && (taskCreated.priority === 'high' || taskCreated.due_time)) {
    await runReminderAgent(userId, taskCreated.id, `Reminder: ${taskCreated.title}`, taskCreated.due_time);
  }
}

export async function runOrchestrator(userId, userMessage) {
  const strategy = process.env.ROUTING_STRATEGY || 'full';

  const { data: history } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  const recentHistory = (history || []).reverse();

  const decision = await routeMessage({ message: userMessage, history: recentHistory, strategy });
  logRouting(userId, userMessage, decision); // fire and forget

  const agents = decision.intents.filter(i => i.agent !== 'direct');
  let finalResponse = '';
  let agentUsed = 'orchestrator';
  let metadata = {};

  if (decision.clarify && decision.clarifyingQuestion) {
    agentUsed = 'direct';
    finalResponse = decision.clarifyingQuestion;
  } else if (agents.length === 0) {
    agentUsed = 'direct';
    finalResponse = decision.directReply || "Sorry, I didn't quite catch that. Could you rephrase?";
  } else if (agents.length === 1 && agents[0].agent === 'health') {
    agentUsed = 'health';
    const result = await runHealthAgent(userId, agents[0].query);
    finalResponse = result.response;
    metadata = result.data;
  } else if (agents.length === 1) {
    agentUsed = 'task';
    const result = await runTaskAgent(userId, agents[0].query);
    finalResponse = result.response;
    metadata = { taskCreated: result.taskCreated };
    await maybeRemind(userId, result.taskCreated);
  } else {
    agentUsed = 'multi';
    const hq = agents.find(a => a.agent === 'health').query;
    const tq = agents.find(a => a.agent === 'task').query;
    const [healthResult, taskResult] = await Promise.all([
      runHealthAgent(userId, hq),
      runTaskAgent(userId, tq)
    ]);
    await maybeRemind(userId, taskResult.taskCreated);
    const synthesisResponse = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are HealthFlow. Combine these two agent responses into one cohesive, concise reply. Don\'t mention "agents". Just give the unified answer naturally. Max 200 words.' },
        { role: 'user', content: `Health Agent said: ${healthResult.response}\n\nTask Agent said: ${taskResult.response}\n\nUser asked: ${userMessage}` }
      ],
      max_tokens: 300
    });
    finalResponse = synthesisResponse.choices[0].message.content;
    metadata = { ...healthResult.data, taskCreated: taskResult.taskCreated };
  }

    const now = Date.now();
  await supabase.from('chat_history').insert([
    { id: uuidv4(), user_id: userId, role: 'user', content: userMessage, created_at: new Date(now).toISOString() },
    { id: uuidv4(), user_id: userId, role: 'assistant', content: finalResponse, agent_used: agentUsed, created_at: new Date(now + 1).toISOString() }
  ]);

  return {
    response: finalResponse,
    agentUsed,
    metadata,
    routing: { strategy, intents: decision.intents, clarify: decision.clarify }
  };
}