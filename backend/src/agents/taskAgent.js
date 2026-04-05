import { groq, MODEL } from '../groq.js';
import { supabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export async function runTaskAgent(userId, query) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const systemPrompt = `You are a Task Agent specializing in health and wellness task management.

Current tasks:
${tasks?.length ? tasks.map(t => `- [${t.completed ? 'DONE' : 'PENDING'}] ${t.title} (${t.category})`).join('\n') : 'No tasks yet.'}

When asked to create a task, respond with a JSON block in this exact format followed by a friendly message:
<TASK_ACTION>
{
  "action": "create",
  "title": "task title",
  "category": "hydration|exercise|medication|nutrition|sleep|general",
  "priority": "low|medium|high",
  "due_time": "ISO string or null",
  "recurrence": "none|daily|weekly"
}
</TASK_ACTION>

When asked to complete a task:
<TASK_ACTION>{"action": "complete", "title": "partial title to match"}</TASK_ACTION>

Otherwise just answer health task questions helpfully.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    temperature: 0.6,
    max_tokens: 400
  });

  const content = response.choices[0].message.content;
  const taskActionMatch = content.match(/<TASK_ACTION>([\s\S]*?)<\/TASK_ACTION>/);
  let taskCreated = null;

  if (taskActionMatch) {
    try {
      const taskData = JSON.parse(taskActionMatch[1]);
      if (taskData.action === 'create') {
        const { data: newTask } = await supabase
          .from('tasks')
          .insert({
            id: uuidv4(),
            user_id: userId,
            title: taskData.title,
            category: taskData.category || 'general',
            priority: taskData.priority || 'medium',
            due_time: taskData.due_time || null,
            recurrence: taskData.recurrence || 'none'
          })
          .select()
          .single();
        taskCreated = newTask;
      } else if (taskData.action === 'complete') {
        const matchingTask = tasks?.find(t =>
          t.title.toLowerCase().includes(taskData.title.toLowerCase()) && !t.completed
        );
        if (matchingTask) {
          await supabase
            .from('tasks')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', matchingTask.id);
        }
      }
    } catch (e) {
      console.error('Task action parse error:', e);
    }
  }

  const cleanResponse = content.replace(/<TASK_ACTION>[\s\S]*?<\/TASK_ACTION>/g, '').trim();
  return { response: cleanResponse, taskCreated, tasks };
}