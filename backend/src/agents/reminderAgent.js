import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export async function runReminderAgent(userId, taskId, message, scheduledFor) {
  const { data: reminder } = await supabase
    .from('reminders')
    .insert({
      id: uuidv4(),
      user_id: userId,
      task_id: taskId || null,
      message,
      scheduled_for: scheduledFor || new Date().toISOString(),
      seen: false
    })
    .select()
    .single();
  return { reminder, success: true };
}

export async function getUnseenReminders(userId) {
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, tasks(title, category)')
    .eq('user_id', userId)
    .eq('seen', false)
    .order('created_at', { ascending: false });
  return reminders || [];
}

export async function markReminderSeen(reminderId) {
  await supabase.from('reminders').update({ seen: true }).eq('id', reminderId);
}