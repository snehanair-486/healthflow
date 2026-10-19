export const BASELINE_PROMPT = `You are HealthFlow, a personal health assistant. You coordinate specialist agents.

Analyze the user's message and decide which agent(s) to call:
- HEALTH_AGENT: ANY message containing ml or water amount ("I drank Xml", "add Xml water", "log Xml", "had Xml water", hydration questions, BMI, wellness analysis, health stats
- TASK_AGENT: creating tasks ("create a task", "add a task", "remind me to"), listing tasks, completing tasks, scheduling health activities
- BOTH: when the request involves both health analysis AND task creation together
- DIRECT: simple greetings, general chat, explaining what you can do

IMPORTANT: If the user mentions drinking water or logging water intake, ALWAYS use HEALTH_AGENT.
IMPORTANT: If the user wants to create or add a task, ALWAYS use TASK_AGENT.

Respond with ONLY one of: HEALTH_AGENT, TASK_AGENT, BOTH, DIRECT
Then on the next line, if DIRECT, write your response.`;

// [agent, confidence, wholeMessageStandalone, partForThisAgent]
// None of these example messages may appear in eval/dataset.json
const EXAMPLES = [
  { msg: 'I drank 300ml water', intents: [['health', 0.97, 'I drank 300ml water', 'I drank 300ml water']] },
  { msg: 'remind me to stretch at 6pm', intents: [['task', 0.96, 'remind me to stretch at 6pm', 'remind me to stretch at 6pm']] },
  { msg: 'log 250ml water and remind me to take iron tablets',
    intents: [
      ['health', 0.95, 'log 250ml water and remind me to take iron tablets', 'log 250ml water'],
      ['task', 0.94, 'log 250ml water and remind me to take iron tablets', 'remind me to take iron tablets']
    ] },
  { prior: 'user: I should walk 30 minutes every day', msg: 'put that on my to-do list',
    intents: [['task', 0.93, 'add a task to walk 30 minutes every day', 'add a task to walk 30 minutes every day']] },
  { msg: 'hmm not feeling great today', intents: [['health', 0.4, 'hmm not feeling great today', 'hmm not feeling great today']],
    clarify: 'Sorry to hear that. Do you want to log how you feel, or get some health advice?' },
  { msg: 'thanks!', intents: [['direct', 0.95, '', '']], direct: "You're welcome!" },
];

function renderExample(mode, e) {
  const intents = e.intents.map(([agent, confidence, whole, part]) => ({
    agent, confidence,
    ...(mode === 'rewrite' && whole ? { query: whole } : {}),
    ...(mode === 'split' && part ? { query: part } : {})
  }));
  const out = {
    intents,
    direct_reply: e.direct ?? null,
    needs_clarification: Boolean(e.clarify),
    clarifying_question: e.clarify ?? null
  };
  return `${e.prior ? `Earlier: ${e.prior}\n` : ''}Message: "${e.msg}"\n${JSON.stringify(out)}`;
}

export function structuredPrompt(mode) {
  const queryField = mode === 'none' ? '' : ',"query":"..."';
  const queryRule = {
    none: '',
    rewrite: `\n- "query": the user's whole last message rewritten as a complete standalone request. Use the earlier conversation to replace references such as "that", "it" or "the same" with what they refer to. Use the same query for every intent.`,
    split: `\n- "query": only the part of the last message this agent should handle, rewritten as a complete standalone request. Use the earlier conversation to replace references such as "that", "it" or "the same" with what they refer to.`
  }[mode];

  return `You are the intent router for HealthFlow, a personal health assistant. Decide which specialist agent(s) should handle the user's LAST message. Earlier messages are context only.

Agents:
- health: ANY message containing ml or a water amount ("I drank Xml", "add Xml water", "log Xml", "had Xml water"), hydration questions, BMI, wellness analysis, health stats
- task: creating tasks ("create a task", "add a task", "remind me to"), listing tasks, completing tasks, scheduling health activities
- direct: simple greetings, general chat, explaining what you can do

IMPORTANT: If the user mentions drinking water or logging water intake, ALWAYS use health.
IMPORTANT: If the user wants to create or add a task, ALWAYS use task.

Respond with ONLY a JSON object:
{"intents":[{"agent":"health|task|direct","confidence":0.0${queryField}}],"direct_reply":null,"needs_clarification":false,"clarifying_question":null}

Rules:
- Return one intent per agent needed. If the message needs both health and task, return two intents.
- "confidence": your honest probability (0 to 1) that this agent is correct.${queryRule}
- If the only intent is "direct", put your short friendly reply in "direct_reply".
- A bare confirmation ("do it", "yes", "go ahead", "ok") is only a request if the previous assistant message offered a specific action. If the previous assistant message already completed an action, or offered nothing, set needs_clarification to true and ask what the user would like to do. Never repeat an action the assistant already completed unless the user clearly asks for it again ("again", "one more", "same again").
- If the message is too vague to route, set needs_clarification to true and write one short clarifying_question.

Examples:
${EXAMPLES.map(e => renderExample(mode, e)).join('\n\n')}`;
}