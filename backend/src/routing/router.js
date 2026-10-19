import { groq, MODEL } from '../groq.js';
import { STRATEGIES } from './strategies.js';
import { BASELINE_PROMPT, structuredPrompt } from './prompts.js';

const ROUTER_MODEL = process.env.ROUTER_MODEL || MODEL;
const AGENTS = ['health', 'task', 'direct'];
const LABELS = { HEALTH_AGENT: ['health'], TASK_AGENT: ['task'], BOTH: ['health', 'task'], DIRECT: ['direct'] };

function parseBaseline(raw, message) {
  // mirrors the old orchestrator: exact first-line match, anything else falls through to direct
  const lines = raw.split('\n');
  const first = lines[0].trim();
  const rest = lines.slice(1).join('\n').trim();
  const agents = LABELS[first];
  if (!agents) {
    return { intents: [{ agent: 'direct', confidence: null, query: message }], directReply: rest || raw, clarify: false, clarifyingQuestion: null, parseError: true };
  }
  return {
    intents: agents.map(a => ({ agent: a, confidence: null, query: message })),
    directReply: agents[0] === 'direct' ? (rest || raw) : null,
    clarify: false, clarifyingQuestion: null, parseError: false
  };
}

function parseStructured(raw, message, cfg) {
  const obj = JSON.parse(raw.replace(/```json|```/g, '').trim());
  const valid = (obj.intents || []).filter(i => AGENTS.includes(i.agent));

  if (!valid.length) {
    // Nothing routable. If the model is asking a question, that is a clarification, not a failure.
    if (obj.needs_clarification === true || obj.clarifying_question) {
      return {
        intents: [{ agent: 'direct', confidence: null, query: message }],
        directReply: null,
        clarify: true,
        clarifyingQuestion: obj.clarifying_question || null,
        parseError: false
      };
    }
    throw new Error('no valid intents');
  }

  const specialists = valid.filter(i => i.agent !== 'direct');
  const used = specialists.length ? specialists : [valid[0]];

  const merged = new Map(); // one intent per agent
  for (const i of used) {
    const query = cfg.queryMode === 'none' ? message : (i.query || message);
    const prev = merged.get(i.agent);
    if (!prev) merged.set(i.agent, { agent: i.agent, confidence: i.confidence ?? null, query });
    else if (typeof i.confidence === 'number') prev.confidence = Math.min(prev.confidence ?? 1, i.confidence);
  }
  const intents = [...merged.values()];

  const confs = intents.map(i => i.confidence).filter(c => typeof c === 'number');
  const thresh = Number(process.env.CONF_THRESHOLD ?? 0.5);
  const low = confs.length > 0 && Math.min(...confs) < thresh;

  return {
    intents,
    directReply: intents[0].agent === 'direct' ? (obj.direct_reply || null) : null,
    clarify: obj.needs_clarification === true || low,
    clarifyingQuestion: obj.clarifying_question || null,
    parseError: false
  };
}

export async function routeMessage({ message, history = [], strategy = 'full' }) {
  const cfg = STRATEGIES[strategy];
  if (!cfg) throw new Error(`Unknown routing strategy: ${strategy}`);

  const window = Number(process.env.HISTORY_WINDOW ?? 4);
  const ctx = (window > 0 ? history.slice(-window) : []).map(h => ({ role: h.role, content: h.content }));

  const system = cfg.structured ? structuredPrompt(cfg.queryMode) : BASELINE_PROMPT;
  const t0 = Date.now();
  const res = await groq.chat.completions.create({
    model: ROUTER_MODEL,
    messages: [{ role: 'system', content: system }, ...ctx, { role: 'user', content: message }],
    temperature: Number(process.env.ROUTER_TEMPERATURE ?? 0),
    max_tokens: 2000,
    reasoning_effort: 'low',
    ...(cfg.structured ? { response_format: { type: 'json_object' } } : {})
  });
  const raw = res.choices[0].message.content || '';

  let parsed;
  try {
    parsed = cfg.structured ? parseStructured(raw, message, cfg) : parseBaseline(raw, message);
  } catch (err) {
    if (process.env.DEBUG_ROUTER) console.error(`PARSE FAIL [${strategy}] "${message}" ->`, err.message, '| RAW:', JSON.stringify(raw));
    parsed = { intents: [{ agent: 'direct', confidence: null, query: message }], directReply: null, clarify: false, clarifyingQuestion: null, parseError: true };
  }

  return {
    ...parsed, strategy, raw, historyUsed: ctx,
    latencyMs: Date.now() - t0, tokens: res.usage?.total_tokens ?? null, model: ROUTER_MODEL
  };
}