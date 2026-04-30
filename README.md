# ⚡ HealthFlow - AI Health Assistant
 
HealthFlow is a multi-agent AI system that helps users manage their daily health and wellness through intelligent conversations. Instead of juggling multiple apps for hydration, nutrition, tasks, and mood tracking, users get one unified platform where they simply chat with an AI that understands, responds, and acts on their health needs.

---
 
## 🌐 Live Demo
[https://healthflow-frontend-399487985042.asia-south1.run.app](https://healthflow-frontend-399487985042.asia-south1.run.app)
 
---
 
## 🧠 System Architecture
 
HealthFlow uses a multi-agent architecture where a primary Orchestrator Agent receives every user message, determines intent, and routes it to the right specialised sub-agent. Each sub-agent owns a specific health domain, has its own system prompt, and reads/writes directly to the user's Supabase database — making every response personalised and data-driven.
 
```
         User Message
              │
              ▼
┌─────────────────────────────────┐
│        Orchestrator Agent       │
│   (intent detection + routing)  │
│         Groq LLaMA 3.3          │
└───────────┬─────────────────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────────┐  ┌─────────────┐
│ Health      │  │ Task        │
│ Agent       │  │ Agent       │
│             │  │             │
│ hydration   │  │ create task │
│ nutrition   │  │ delete task │
│ wellness    │  │ list tasks  │
└──────┬──────┘  └──────┬──────┘
       │                │
       └──────┬─────────┘
              ▼
     ┌─────────────────┐
     │   Supabase DB   │
     │  (PostgreSQL)   │
     │  per-user data  │
     └─────────────────┘
              │
              ▼
   Response to User +
   Dashboard Updated in Real Time
```
 
**How intent routing works:** The Orchestrator reads the user's message and classifies it — "log 500ml of water" goes to the Health Agent which calls the hydration API; "create a task to take my medication" goes to the Task Agent which inserts into the tasks table. The user never has to think about which agent handles what.
 
**Why multi-agent over a single chatbot:** Each agent has a focused system prompt and domain context. The Health Agent reads your full nutrition logs, sleep history, mood scores, and hydration data before responding — giving answers that are actually personalised. A single generalist bot would dilute this context.
 
---
 
## ✨ Features
 
- 🤖 **Multi-Agent AI Chat** — log water, create tasks, ask health questions — all from one chat interface. The Orchestrator routes each message to the right agent automatically.
- 🧠 **Context-Aware AI** — the Health Agent reads your nutrition logs, sleep history, mood, and hydration together before every response, so answers are actually personalised to your day.
- 🔔 **Proactive Nudges** — smart dashboard alerts when hydration is low, check-in is missed, or calories are too low. Dismissible per day, each links directly to the relevant page.
- 🧭 **Onboarding Flow** — 3-step profile setup (body metrics → activity level → goal) for new users. Powers BMI, personalised water goals, and AI recommendations from day one.
- 📋 **Daily Check-in** — log sleep, mood (1–10), energy, and symptoms in under 30 seconds. The Health Agent reads this history when answering wellness questions.
- 🍽️ **Nutrition Tracker** — describe a meal in plain text and get instant AI analysis: calories, protein, carbs, fat, and a health score out of 100.
- 💧 **Hydration Tracker** — quick-log buttons, custom input, and an animated bottle visualiser. Also loggable directly from AI chat.
- ✅ **Task Manager** — health tasks with priority levels and categories, creatable manually or via AI chat.
- 📊 **Dashboard** — animated SVG progress rings, stat cards, and upcoming tasks — updated in real time.
- 👤 **User Authentication** — email/password login. All data is private and scoped per user.
- 🌙 **Light/Dark Mode** — persists across sessions and logout.
- 📱 **Mobile-Friendly** — accessible from any mobile browser, no install needed.

---
 
## 🛠 Tech Stack
 
| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React + Vite                  |
| Backend    | Node.js + Express             |
| Database   | Supabase (PostgreSQL)         |
| AI         | Groq LLaMA 3.3                |
| Deployment | Google Cloud Run              |
| Styling    | CSS Variables + Framer Motion |
 
---
 
## 🗄 Database Schema
 
| Table | Key Columns |
|-------|-------------|
| `users` | `id`, `email`, `password`, `name`, `created_at` |
| `health_profiles` | `id`, `user_id`, `name`, `weight_kg`, `height_cm`, `age`, `gender`, `activity_level`, `goal`, `updated_at` |
| `hydration_logs` | `id`, `user_id`, `amount_ml`, `note`, `date`, `logged_at` |
| `tasks` | `id`, `user_id`, `title`, `category`, `priority`, `completed`, `completed_at`, `created_at` |
| `chat_history` | `id`, `user_id`, `role`, `content`, `created_at` |
| `nutrition_logs` | `id`, `user_id`, `meal_description`, `meal_type`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `health_score`, `analysis`, `date`, `logged_at` |
| `daily_checkins` | `id`, `user_id`, `sleep_hours`, `mood_score`, `energy_level`, `symptoms`, `notes`, `date`, `logged_at` |
 
---
 
## 📁 Project Structure
 
```
healthflow/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview with rings, stats, nudges
│   │   │   ├── Chat.jsx            # Multi-agent AI chat
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
│   │   ├── api.js                  # Axios API client
│   │   ├── App.jsx                 # Router + layout
│   │   └── index.css               # Global styles + design tokens
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── index.js                # Express server entry
    │   ├── agents/
    │   │   ├── orchestrator.js     # Routes intent to sub-agents
    │   │   ├── healthAgent.js      # Health + hydration + wellness
    │   │   └── taskAgent.js        # Task management
    │   └── routes/
    │       ├── auth.js
    │       ├── chat.js
    │       ├── checkin.js
    │       ├── health.js
    │       ├── nutrition.js
    │       ├── profile.js
    │       └── tasks.js
    └── package.json
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
 
### Environment Variables (Backend)
```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173
PORT=3001
```
 