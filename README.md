# ⚡ HealthFlow - AI Health Assistant

HealthFlow is a multi-agent AI system that helps users manage their daily health and wellness through intelligent conversations. Instead of juggling multiple apps for hydration, nutrition, tasks, and mood tracking, users get one unified platform where they simply chat with an AI that understands, responds, and acts on their health needs.

HealthFlow is also a testbed for research on **context-aware intent routing in multi-agent LLM systems** (see [Research](#-research-intent-routing)).

---

## 🧠 System Architecture

HealthFlow uses a multi-agent architecture. An Orchestrator receives every user message and asks a **routing layer** to decide which specialist agent(s) should handle it. Each specialist owns a health domain, has its own system prompt, and reads/writes directly to the user's Supabase database, making every response personalised and data-driven.

```
              User Message
                   │
                   ▼
   ┌───────────────────────────────┐
   │         Orchestrator          │
   │  ┌─────────────────────────┐  │
   │  │      Routing layer      │  │   swappable strategy:
   │  │     (src/routing/)      │  │   baseline | structured |
   │  └─────────────────────────┘  │   context | full
   └──────┬─────────────────┬──────┘
          │                 │
   standalone          standalone
   sub-query           sub-query
          ▼                 ▼
   ┌────────────┐    ┌────────────┐
   │  Health    │    │   Task     │
   │  Agent     │    │   Agent    │──► Reminder service (DB only)
   └─────┬──────┘    └─────┬──────┘
         └────────┬────────┘
                  ▼
        Response merge (only when a message needs both agents)
                  │
                  ▼
        ┌──────────────────┐
        │   Supabase DB    │
        │   (PostgreSQL)   │
        └──────────────────┘
                  │
                  ▼
        Response to user + dashboard updated
```

**How intent routing works:** the router reads the latest message plus a sliding window of recent conversation and returns structured JSON: which agent(s) to call, a confidence score for each, a self-contained rewrite of the part of the message each agent should handle ("add that to my tasks" becomes "add a task to buy vitamin D"), and whether it needs to ask the user a clarifying question first. Messages that need both agents are split into one sub-query per agent and the replies are merged into one answer.

**Why multi-agent over a single chatbot:** each agent has a focused system prompt and domain context. The Health Agent reads your full nutrition logs, sleep history, mood scores, and hydration data before responding, giving answers that are actually personalised. A single generalist bot would dilute this context.

### Components

| Component | Type | Role |
|-----------|------|------|
| Orchestrator + router | LLM | Intent detection, context resolution, multi-intent splitting, clarification |
| Health Agent | LLM | Hydration logging, wellness and health questions, uses profile and logs as context |
| Task Agent | LLM | Create, complete and list tasks |
| Response merge | LLM call | Combines two agent replies into one message (multi-intent only) |
| Reminder service | Database helper | Stores reminders for high-priority or timed tasks (no LLM) |
| Nutrition analysis | LLM endpoint | Meal analysis from the Nutrition page (outside the router) |

---

## ✨ Features

- 🤖 **Multi-Agent AI Chat** - log water, create tasks, ask health questions, all from one chat interface. The router picks the right agent automatically, handles messages that contain two requests, and asks a question when a message is too vague to act on.
- 🧠 **Context-Aware AI** - references like "that", "it" or "the first one" are resolved from recent conversation, and the Health Agent reads your nutrition logs, sleep history, mood, and hydration together before every response.
- 🔔 **Proactive Nudges** - smart dashboard alerts when hydration is low, check-in is missed, or calories are too low. Dismissible per day, each links directly to the relevant page.
- 🧭 **Onboarding Flow** - 3-step profile setup (body metrics → activity level → goal) for new users. Powers BMI, personalised water goals, and AI recommendations from day one.
- 📋 **Daily Check-in** - log sleep, mood (1-10), energy, and symptoms in under 30 seconds. The Health Agent reads this history when answering wellness questions.
- 🍽️ **Nutrition Tracker** - describe a meal in plain text and get instant AI analysis: calories, protein, carbs, fat, and a health score out of 100.
- 💧 **Hydration Tracker** - quick-log buttons, custom input, and an animated bottle visualiser. Also loggable directly from AI chat.
- ✅ **Task Manager** - health tasks with priority levels and categories, creatable manually or via AI chat.
- 📊 **Dashboard** - animated SVG progress rings, stat cards, and upcoming tasks, updated in real time.
- 👤 **User Authentication** - email/password login. All data is private and scoped per user.
- 🌙 **Light/Dark Mode** - persists across sessions and logout.
- 📱 **Mobile-Friendly** - responsive layout that works in a mobile browser.

---

## 🛠 Tech Stack

| Layer      | Technology                                                       |
|------------|------------------------------------------------------------------|
| Frontend   | React + Vite                                                     |
| Backend    | Node.js + Express                                                |
| Database   | Supabase (PostgreSQL)                                            |
| AI         | Groq (default model `openai/gpt-oss-120b`, set via `GROQ_MODEL`) |
| Styling    | CSS Variables + Framer Motion                                    |

HealthFlow is run locally (backend on port 3001, frontend on Vite's dev server).

---

## 🗄 Database Schema

| Table | Key Columns |
|-------|-------------|
| `users` | `id`, `email`, `password`, `name`, `created_at` |
| `health_profiles` | `id`, `user_id`, `name`, `weight_kg`, `height_cm`, `age`, `gender`, `activity_level`, `goal`, `updated_at` |
| `hydration_logs` | `id`, `user_id`, `amount_ml`, `note`, `date`, `logged_at` |
| `tasks` | `id`, `user_id`, `title`, `category`, `priority`, `completed`, `completed_at`, `due_time`, `recurrence`, `created_at` |
| `reminders` | `id`, `user_id`, `task_id`, `message`, `scheduled_for`, `seen`, `created_at` |
| `chat_history` | `id`, `user_id`, `role`, `content`, `agent_used`, `created_at` |
| `nutrition_logs` | `id`, `user_id`, `meal_description`, `meal_type`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `health_score`, `analysis`, `date`, `logged_at` |
| `daily_checkins` | `id`, `user_id`, `sleep_hours`, `mood_score`, `energy_level`, `symptoms`, `notes`, `date`, `logged_at` |
| `routing_logs` | `id`, `user_id`, `message`, `history`, `strategy`, `intents`, `clarify`, `parse_error`, `latency_ms`, `tokens`, `model`, `created_at` |

---

## 📁 Project Structure

```
healthflow/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview with rings, stats, nudges
│   │   │   ├── Chat.jsx            # Multi-agent AI chat (renders markdown replies)
│   │   │   ├── Hydration.jsx       # Water intake tracker
│   │   │   ├── Nutrition.jsx       # Meal logging + AI analysis
│   │   │   ├── Checkin.jsx         # Daily mood/sleep/energy check-in
│   │   │   ├── Tasks.jsx           # Health task manager
│   │   │   ├── Profile.jsx         # User health profile settings
│   │   │   ├── Insights.jsx        # Weekly charts and trends
│   │   │   ├── Login.jsx           # Auth (login + register)
│   │   │   └── Onboarding.jsx      # 3-step new user setup
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── ProactiveNudges.jsx # Context-aware smart alerts
│   │   ├── hooks/
│   │   │   └── useProfile.js       # Profile + BMI + water goal hook
│   │   ├── api.js                  # Axios API client (points at the local backend)
│   │   ├── App.jsx                 # Router + layout
│   │   └── index.css               # Global styles + design tokens
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.js                # Express server entry
│   │   ├── db.js                   # Supabase client
│   │   ├── groq.js                 # Groq client + MODEL
│   │   ├── agents/
│   │   │   ├── orchestrator.js     # Asks the router, then dispatches to agents
│   │   │   ├── healthAgent.js      # Health + hydration + wellness
│   │   │   ├── taskAgent.js        # Task management
│   │   │   └── reminderAgent.js    # Reminder storage (DB helper, no LLM)
│   │   ├── routing/
│   │   │   ├── router.js           # Routing decision + output parsing
│   │   │   ├── prompts.js          # Baseline and structured routing prompts
│   │   │   ├── strategies.js       # baseline | structured | context | full
│   │   │   └── logger.js           # Writes decisions to routing_logs
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── chat.js
│   │       ├── checkin.js
│   │       ├── health.js
│   │       ├── nutrition.js
│   │       ├── profile.js
│   │       └── tasks.js
│   ├── eval/
│   │   ├── dataset.json            # Hand-written routing test messages (dev/test split)
│   │   ├── run.js                  # Evaluation harness
│   │   └── results/                # One CSV per evaluation run
│   └── package.json
│
├── README.md
└── summary.md                      # Project and research summary
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key

### Backend
```bash
cd backend
npm install
cp .env.example .env  # fill in your keys
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend talks to the backend at `http://localhost:3001/api` (set in `frontend/src/api.js`). Open the URL printed by `npm run dev` (normally `http://localhost:5173`).

### Environment Variables (Backend)

| Variable | Example | Purpose |
|----------|---------|---------|
| `GROQ_API_KEY` | `your_groq_key` | Groq API key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Model used by every agent. Models get retired, so keep it configurable |
| `SUPABASE_URL` | `your_supabase_url` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `your_supabase_anon_key` | Supabase anon key |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `PORT` | `3001` | Server port |
| `ROUTING_STRATEGY` | `full` | `baseline`, `structured`, `context` or `full` |
| `HISTORY_WINDOW` | `6` | How many recent messages the router sees |
| `CONF_THRESHOLD` | `0.5` | Below this confidence the router asks a clarifying question |
| `ROUTER_TEMPERATURE` | `0` | Router sampling temperature (0 for reproducible routing) |
| `ROUTER_MODEL` | *(optional)* | Use a different model for routing only |
| `DEBUG_ROUTER` | *(optional)* | Set to `1` to print raw model output when parsing fails |

Never commit your `.env` file. Only `.env.example` (placeholders) belongs in the repository.

### Notes on running locally

- Groq's free tier has per-minute and per-day limits. Each chat message makes two to four model calls, and evaluation runs use the same quota, so avoid running evaluations while using the app.
- Supabase free projects pause when idle. If the app suddenly fails to load data, check that the project is resumed.

---

## 🔬 Research: Intent Routing

**Question.** In an orchestrator-based multi-agent assistant, does adding structured output, conversation context and per-agent sub-queries improve how user messages are routed and handled?

**Observed failure modes of the original router** (git tag `baseline-v0`):
1. The router had no way to express uncertainty or ask for clarification.
2. It could see recent history, but the specialist agents received the raw message only, so "add that to my tasks" reached the Task Agent without the referent.
3. Messages with two requests were sent to both agents in full, so each agent received (and could act on) the other agent's request.

### Strategies

Each strategy adds one idea, so differences between them can be attributed to that idea.

| Strategy | What it adds |
|----------|--------------|
| `baseline` | The original router prompt, unchanged. Single label output, raw message passed to agents |
| `structured` | JSON output with a confidence score and optional clarifying question |
| `context` | A self-contained rewrite of the user's request, with references resolved from recent history |
| `full` | One self-contained sub-query per agent for messages with several requests |

Select one with `ROUTING_STRATEGY`. The routing layer only *decides*, it never executes, so routing can be evaluated without touching the database.

### Evaluation

```powershell
cd backend
npm run eval -- baseline,structured,context,full dev
```

The dataset (`backend/eval/dataset.json`) holds about 90 hand-written English messages across simple requests, direct chat, ambiguous and clarification-worthy messages, context-dependent messages (including references beyond the window), confirmations, multi-intent messages and adversarial wording (such as a water amount appearing in a task request). Every case has a ground-truth label and a `dev` or `test` split. Prompts are tuned on `dev` only, and `test` is run once at the end.

Metrics: agent accuracy (exact set match), context resolution accuracy, sub-query correctness for multi-intent messages, clarification correctness (including false and missed clarifications), latency and token cost, parse errors.

Useful switches (set as environment variables in PowerShell, e.g. `$env:HISTORY_WINDOW = "2"`):

| Variable | Effect |
|----------|--------|
| `HISTORY_WINDOW` | History window size (ablation) |
| `CONF_THRESHOLD` | Clarification threshold (ablation) |
| `ROUTER_MODEL` | Run the router on a different model |
| `CATS` | Comma-separated categories to run, e.g. `context,context_long` |
| `RUNS` | Repeats per case |
| `SLEEP_MS` | Pause between requests (default 1000) to stay under rate limits |
| `TAG` | Label added to the result filename |
| `DEBUG_ROUTER` | Print raw model output on parse failures |

Each run writes a CSV to `backend/eval/results/` with the prediction, queries, confidence, latency, tokens and raw model output for every case. Preliminary numbers and caveats are in [`summary.md`](summary.md); final numbers will be added after the held-out test run.

### Limitations

Single domain (health assistant), a small hand-written dataset from one author, one model provider, and only two specialist agents, so agent choice is close to a binary decision. Results from the free Groq tier are subject to rate limits, and hosted models can be retired (this happened during development), so the model name is pinned through `GROQ_MODEL`.