import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';
import { runHealthAgent } from './healthAgent.js';
import { runTaskAgent } from './taskAgent.js';
import { runReminderAgent } from './reminderAgent.js';
import { v4 as uuidv4 } from 'uuid';

export async function runOrchestrator(userId, userMessage) {
  const { data: history } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const recentHistory = (history || []).reverse();

  const routingPrompt = `You are HealthFlow, a personal health assistant. You coordinate specialist agents.

Analyze the user's message and decide which agent(s) to call:
- HEALTH_AGENT: hydration questions, BMI, wellness analysis, water intake, health stats
- TASK_AGENT: creating tasks, listing tasks, completing tasks, scheduling health activities
- BOTH: when the request involves both analysis and task creation
- DIRECT: simple greetings, general chat, explaining what you can do

Respond with ONLY one of: HEALTH_AGENT, TASK_AGENT, BOTH, DIRECT
Then on the next line, if DIRECT, write your response.`;

  const routingResponse = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: routingPrompt },
      ...recentHistory.slice(-4).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ],
    temperature: 0.3,
    max_tokens: 300
  });

  const routingContent = routingResponse.choices[0].message.content;
  const firstLine = routingContent.split('\n')[0].trim();
  const directResponse = routingContent.split('\n').slice(1).join('\n').trim();

  let finalResponse = '';
  let agentUsed = 'orchestrator';
  let metadata = {};

  if (firstLine === 'HEALTH_AGENT') {
    agentUsed = 'health';
    const result = await runHealthAgent(userId, userMessage);
    finalResponse = result.response;
    metadata = result.data;
  } else if (firstLine === 'TASK_AGENT') {
    agentUsed = 'task';
    const result = await runTaskAgent(userId, userMessage);
    finalResponse = result.response;
    metadata = { taskCreated: result.taskCreated };
    if (result.taskCreated?.priority === 'high' || result.taskCreated?.due_time) {
      await runReminderAgent(
        userId,
        result.taskCreated.id,
        `Reminder: ${result.taskCreated.title}`,
        result.taskCreated.due_time
      );
    }
  } else if (firstLine === 'BOTH') {
    agentUsed = 'multi';
    const [healthResult, taskResult] = await Promise.all([
      runHealthAgent(userId, userMessage),
      runTaskAgent(userId, userMessage)
    ]);
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
  } else {
    agentUsed = 'direct';
    finalResponse = directResponse || routingContent;
  }

  await supabase.from('chat_history').insert([
    { id: uuidv4(), user_id: userId, role: 'user', content: userMessage },
    { id: uuidv4(), user_id: userId, role: 'assistant', content: finalResponse, agent_used: agentUsed }
  ]);

  return { response: finalResponse, agentUsed, metadata };
}