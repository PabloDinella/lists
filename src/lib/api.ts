import { supabase } from "@/lib/supabase";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "inbox" | "next" | "waiting" | "scheduled" | "someday" | "completed" | "trashed";
  createdAt: Date;
  dueDate?: Date;
  project?: string;
  area?: string;
  tags?: string[];
}

export type TaskRow = Omit<Task, 'createdAt' | 'dueDate'> & {
  created_at: string;
  due_date?: string;
};

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((t: TaskRow) => ({
    ...t,
    createdAt: new Date(t.created_at),
    dueDate: t.due_date ? new Date(t.due_date) : undefined,
  }));
}

export async function createTask({ title, userId }: { title: string; userId: string }): Promise<Task | null> {
  const newTask = {
    title,
    description: "",
    status: "inbox",
    created_at: new Date().toISOString(),
    user_id: userId,
  };
  const { data, error } = await supabase
    .from('tasks')
    .insert([newTask])
    .select()
    .single();
  if (error || !data) return null;
  return {
    ...data,
    createdAt: new Date(data.created_at),
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
  };
}

export async function updateTask(task: Task): Promise<Task | null> {
  const { id, createdAt, dueDate, ...rest } = task;
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...rest,
      created_at: createdAt.toISOString(),
      due_date: dueDate ? dueDate.toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return {
    ...data,
    createdAt: new Date(data.created_at),
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
  };
}

export async function completeTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return {
    ...data,
    createdAt: new Date(data.created_at),
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
  };
}

export async function deleteTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'trashed' })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return {
    ...data,
    createdAt: new Date(data.created_at),
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
  };
}
