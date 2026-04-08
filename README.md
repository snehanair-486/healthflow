# ⚡ HealthFlow — AI-Powered Personal Health Assistant

HealthFlow is a multi-agent AI system that helps users manage their health, tasks, hydration, nutrition, and daily wellness through intelligent agents and real-time data.

---

## 🌐 Live Demo
[https://healthflow-frontend-399487985042.asia-south1.run.app](https://healthflow-frontend-399487985042.asia-south1.run.app)

---

## 🧠 System Architecture

HealthFlow uses a multi-agent architecture where a primary orchestrator routes user requests to specialized sub-agents:

- **Orchestrator Agent** — understands user intent and delegates to the right agent
- **Health Agent** — handles hydration, nutrition context, sleep history, and wellness questions with full user context
- **Task Agent** — creates, manages, and tracks health-related tasks
- **Reminder Agent** — manages reminders and scheduling

---

## ✨ Features

- 🤖 **Multi-Agent AI Chat** — 3 specialized agents powered by Groq LLaMA 3.3; can log water, create tasks, and answer personalized health questions
- 💧 **Hydration Tracker** — log water intake manually or via AI chat, track daily goals with a progress ring
- 🍽️ **Nutrition Tracker** — log meals in plain text and get instant AI-powered calorie, protein, carbs, fat and health score analysis
- 📋 **Daily Check-in** — log sleep hours, mood (1–10), energy level and symptoms every day; AI references this history for personalized advice
- ✅ **Task Manager** — create and manage health tasks with priority levels and categories
- 📊 **Dashboard** — real-time health overview with progress rings and daily stats
- 👤 **User Authentication** — register and login with email and password; all data is private per user
- 🌙 **Light/Dark Mode** — theme toggle that persists across sessions and logout
- 📱 **Works on mobile** — accessible from any device via browser
- 🧠 **Context-aware AI** — Health Agent reads nutrition logs, sleep history, mood and hydration together to answer questions like "what should I eat for dinner today" or "I have a headache, what should I do"

---

## 🛠 Tech Stack

- **Frontend** — React + Vite
- **Backend** — Node.js + Express
- **Database** — Supabase (PostgreSQL)
- **AI** — Groq LLaMA 3.3
- **Deployment** — Google Cloud Run
- **Styling** — CSS Variables + Framer Motion

---

## 🗄 Database Schema

- **users** — `id`, `email`, `password`, `name`, `created_at`
- **health_profiles** — `id`, `user_id`, `name`, `weight_kg`, `height_cm`, `age`, `gender`, `activity_level`, `goal`, `updated_at`
- **hydration_logs** — `id`, `user_id`, `amount_ml`, `note`, `date`, `logged_at`
- **tasks** — `id`, `user_id`, `title`, `category`, `priority`, `completed`, `completed_at`, `created_at`
- **chat_history** — `id`, `user_id`, `role`, `content`, `created_at`
- **nutrition_logs** — `id`, `user_id`, `meal_description`, `meal_type`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `health_score`, `analysis`, `date`, `logged_at`
- **daily_checkins** — `id`, `user_id`, `sleep_hours`, `mood_score`, `energy_level`, `symptoms`, `notes`, `date`, `logged_at`

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
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173
PORT=3001
