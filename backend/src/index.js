import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import tasksRoutes from './routes/tasks.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/ping', (req, res) => res.json({ status: 'HealthOS backend running' }));

app.listen(PORT, () => {
  console.log(`HealthOS backend running on port ${PORT}`);
});