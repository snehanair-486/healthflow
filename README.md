# ⚡ HealthFlow — AI-Powered Personal Health Assistant

HealthFlow is a multi-agent AI system that helps users manage their health, tasks, hydration, and wellness through intelligent agents and real-time data.

## 🌐 Live Demo
[https://healthflow-frontend-399487985042.asia-south1.run.app](https://healthflow-frontend-399487985042.asia-south1.run.app)

## 🧠 System Architecture

HealthFlow uses a multi-agent architecture where a primary orchestrator routes user requests to specialized sub-agents:

- **Orchestrator Agent** — understands user intent and delegates to the right agent
- **Health Agent** — handles hydration tracking, water goals, and health metrics
- **Task Agent** — creates, manages, and tracks health-related tasks
- **Reminder Agent** — manages reminders and scheduling

## ✨ Features

- 🤖 **Multi-Agent AI Chat** — talk to 3 specialized AI agents powered by Groq LLaMA
- 💧 **Hydration Tracker** — log water intake, track daily goals, view progress
- ✅ **Task Manager** — create and manage health tasks with priority levels
- 📊 **Dashboard** — real-time health overview with progress rings and stats
- 👤 **User Authentication** — register and login with email and password
- 🌙 **Light/Dark Mode** — theme toggle that persists across sessions
- 📱 **Works on mobile** — accessible from any device via browser

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI | Groq LLaMA 3.3 |
| Deployment | Google Cloud Run |
| Styling | CSS Variables + Framer Motion |

## 🗄 Database Schema

- `users` — authentication and user profiles
- `health_profiles` — BMI, weight, height, activity level
- `hydration_logs` — water intake entries
- `tasks` — health tasks with priority and category
- `chat_history` — AI conversation history per user

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

## 📦 Deployment

Both services are deployed on **Google Cloud Run**:
```bash
# Deploy backend
cd backend
gcloud run deploy healthflow-backend --source . --region asia-south1 --allow-unauthenticated --platform managed

# Deploy frontend  
cd frontend
gcloud run deploy healthflow-frontend --source . --region asia-south1 --allow-unauthenticated --platform managed --port 8080
```

## 👩‍💻 Author
Sneha Nair