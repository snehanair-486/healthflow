# HealthFlow: Project & Research Summary

_Last updated: 2026-10-19. Numbers below are **preliminary** (dev split, single runs) and will be replaced after the final runs._

## 1. What this project is

HealthFlow is a health assistant web app: users chat with an AI that logs water, creates tasks, analyses meals and answers wellness questions, backed by per-user data in Supabase. It is built as a **multi-agent system**: an orchestrator routes each message to specialist agents.

It doubles as the prototype for research on **improving intent routing in multi-agent LLM systems**: how the orchestrator decides which agent(s) handle a message, and how well that decision uses conversation context.

Stack: React + Vite frontend, Node/Express backend, Supabase (PostgreSQL), Groq-hosted LLM. **Decision: the app is not deployed.** It runs locally, and the code is kept in a GitHub repository.

## 2. What changed in this phase

**Fixes**
- Groq retired `llama-3.3-70b-versatile`, which broke meal analysis and chat. The model is now `openai/gpt-oss-120b`, read from `GROQ_MODEL` so the next retirement is a config change.
- Meal analysis hardened: larger token budget, JSON mode, raw output logged on parse failure, Supabase insert errors surfaced.
- Chat history ordering: the user message and the reply were inserted with identical timestamps, so order was random on reload and in the history fed to the router. They now get explicit, ordered timestamps.
- Chat UI renders markdown (bold, lists, tables). The time column was removed from the hydration log (times were shown in UTC).

**Research infrastructure**
- `backend/src/routing/`: a swappable routing layer with four strategies (`baseline`, `structured`, `context`, `full`), a structured prompt with few-shot examples, a parser, and a logger writing to `routing_logs`.
- `backend/src/agents/orchestrator.js` rewritten to ask the router for a decision and call agents with the router's self-contained sub-queries.
- `backend/eval/`: dataset (about 90 hand-written English cases, dev/test split), evaluation harness, CSV outputs.
- The original router is preserved as git tag `baseline-v0`.

## 3. System at a glance

| Component | Type |
|-----------|------|
| Orchestrator + router | LLM agent |
| Health Agent | LLM agent |
| Task Agent | LLM agent |
| Response merge (multi-intent) | extra LLM call, not an agent |
| Reminder service | database helper, no LLM |
| Nutrition analysis | standalone LLM endpoint outside the router |

"Multi-Agent" in the chat UI is a label for a message that ran both specialist agents, not a separate agent. The sidebar's "3 agents active" is static text.

## 4. Research

### Corrected problem statement

The original router **could** see recent history and **could** return a "both agents" label, so those are not the failures. The observed failures are:

1. **No uncertainty:** the router has no confidence output and no way to ask a clarifying question.
2. **Context stops at the router:** the specialist agents receive the raw message, so "add that to my tasks" arrives without its referent.
3. **Coarse multi-intent handling:** with a "both" label, each agent receives the whole message, including the other agent's request.

### Strategies compared

| Strategy | Adds |
|----------|------|
| `baseline` | Original prompt, label output, raw message to agents |
| `structured` | JSON with confidence and a clarifying question |
| `context` | Standalone rewrite with references resolved from history |
| `full` | One standalone sub-query per agent |

### Dataset and metrics

Hand-written English messages with ground-truth agents and, where relevant, expected keywords in the rewritten query. Categories: simple, direct, clarify, ambiguous, context, context_long, confirmation, multi, multi_same, adversarial. Metrics: agent accuracy (exact set match), context resolution, sub-query correctness, clarification correctness (false and missed), latency, tokens, parse errors.

### Preliminary results (dev split, n=59, single run, temperature 0)

Main comparison (collected **before** the clarification-parser fix):

| | baseline | structured | context | full |
|---|---|---|---|---|
| Agent accuracy | 94.5% | 96.4% | 98.2% | 98.2% |
| Context resolution | 0% | 0% | 81.3% | 81.3% |
| Sub-query correctness | 0% | 0% | 0% | 100% |
| Clarification correct | 91.5% | 89.8% | 93.2% | 89.8% |
| Median latency | 0.9 s | 2.6 s | 2.7 s | 2.7 s |

History window ablation (`full`):

| Window | 0 | 1 | 2 | 4 | 6 |
|---|---|---|---|---|---|
| Agent accuracy | 80.0% | 96.4% | 98.2% | 98.2% | 98.2% |
| Context resolution | 0% | 31.3% | 75.0% | 81.3% | 93.8% |

Clarification after the parser fix (5 dev clarify cases only): `structured` 4/5, `context` 4/5, `full` 5/5 (before the fix: 0/5 for all).

### What the data supports so far

- Agent accuracy differences (94.5% vs 98.2%) are 2 to 3 messages, within run-to-run noise. Not a claim.
- Resolving references and splitting multi-intent requests are the real gains. Caveat: the baseline scores 0% on both partly by construction (it never rewrites anything), so an outcome-based test is needed (did the correct task get created?).
- More history helps steadily; a window of 6 beat the original default of 4.
- Structured routing costs about 3x the latency of the baseline.
- Clarification looked broken, but the cause was a parser bug (an empty intents list plus a clarifying question was treated as a failure). Reported numbers must be the post-fix ones.
- Resolving references from history has a side effect: a bare "do it" after a completed action repeated that action (a duplicate water log was observed). A confirmation rule was added to the prompt and `confirmation` cases to the dataset.

### Threats to validity

Single domain, small hand-written dataset by one author, one model provider, two specialist agents (so agent choice is nearly binary), single runs, a free-tier quota that limits repeats, and model retirement risk.

## 5. Known issues

- "Today" is computed from the UTC date, so daily totals roll over at 5:30 AM IST instead of midnight. Affects hydration, nutrition and check-in.
- Timestamps stored in `logged_at` display 5.5 hours off in the browser, so the hydration page no longer shows them. Check other pages that show times.
- Water logging in `healthAgent.js` is regex-based: a question such as "is 500ml of water too much?" can log 500 ml.
- The Task Agent prompt has no current date, so relative times are unreliable (it may invent a time such as "9 PM").
- No validation on profile values (an implausible BMI of 7.8 was observed and the agent still gave advice).
- Older test messages in `chat_history` are out of order (created before the timestamp fix).
- The sidebar "3 agents active" text is static.
- Free tiers: Groq (about 30 requests per minute and 200k tokens per day on the 120b model) and Supabase (pauses when idle).

## 6. Roadmap

- [x] Fix retired model, meal analysis, chat ordering
- [x] Routing layer with four strategies, logging, eval harness
- [x] Dataset with dev/test split
- [x] Clarification parser fix
- [x] Confirmation rule in the routing prompt
- [x] Decision: no deployment, run locally
- [ ] Push the project to GitHub
- [ ] Full dev rerun of all four strategies after the fixes (final tables)
- [ ] Confidence threshold sweep (0.7 and 0.9 remaining)
- [ ] Model comparison with `openai/gpt-oss-20b`
- [ ] Significance tests between strategies (compare script)
- [ ] Held-out `test` split, run once with frozen prompts
- [ ] Independent labelling of about 20 cases for agreement
- [ ] Outcome-based test (correct task or log actually created)
- [ ] Optional: Nutrition and Check-in agents so routing has more than two targets
- [ ] IST date fix, profile validation, water-logging regex fix
- [ ] Write the paper: corrected problem statement, verified related work, limitations

## 7. Command cheat sheet

```powershell
# run backend / frontend
cd backend; npm start
cd frontend; npm run dev

# evaluation (from backend/)
npm run eval -- baseline,structured,context,full dev
$env:HISTORY_WINDOW = "2"; $env:TAG = "win2"; npm run eval -- full dev; Remove-Item Env:HISTORY_WINDOW, Env:TAG
$env:ROUTER_MODEL = "openai/gpt-oss-20b"; $env:TAG = "m20b"; npm run eval -- baseline,structured,context,full dev; Remove-Item Env:ROUTER_MODEL, Env:TAG
npm run eval -- baseline,structured,context,full test   # once, at the very end
```

Results are saved as CSVs in `backend/eval/results/`. Keep runs from before the parser fix in a separate folder and label them as pre-fix.