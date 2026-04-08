import axios from 'axios';

const API = axios.create({
  baseURL: 'https://healthflow-backend-399487985042.asia-south1.run.app/api',
});

export const getUser = () => JSON.parse(localStorage.getItem('hf_user') || 'null');
export const getUserId = () => getUser()?.userId || null;

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

export const chatAPI = {
  send: (message) => API.post('/chat/message', { userId: getUserId(), message }),
  history: () => API.get(`/chat/history/${getUserId()}`),
};

export const healthAPI = {
  logWater: (amount_ml, note) => API.post('/health/hydration', { userId: getUserId(), amount_ml, note }),
  todayHydration: () => API.get(`/health/hydration/${getUserId()}/today`),
  weekHydration: () => API.get(`/health/hydration/${getUserId()}/week`),
};

export const tasksAPI = {
  list: () => API.get(`/tasks/${getUserId()}`),
  create: (task) => API.post('/tasks', { userId: getUserId(), ...task }),
  complete: (id) => API.patch(`/tasks/${id}/complete`),
  delete: (id) => API.delete(`/tasks/${id}`),
};

export const profileAPI = {
  get: () => API.get(`/profile/${getUserId()}`),
  save: (data) => API.post('/profile', { userId: getUserId(), ...data }),
};

export const nutritionAPI = {
  analyze: (meal_description, meal_type) => API.post('/nutrition/analyze', { userId: getUserId(), meal_description, meal_type }),
  today: () => API.get(`/nutrition/${getUserId()}/today`),
  week: () => API.get(`/nutrition/${getUserId()}/week`),
  delete: (id) => API.delete(`/nutrition/${id}`),
};

export const checkinAPI = {
  save: (data) => API.post('/checkin', { userId: getUserId(), ...data }),
  today: () => API.get(`/checkin/${getUserId()}/today`),
  recent: () => API.get(`/checkin/${getUserId()}/recent`),
};