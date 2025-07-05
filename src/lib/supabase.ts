import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';

// Task interface based on GTD method
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "inbox" | "next" | "waiting" | "scheduled" | "someday" | "completed" | "trashed";
  created_at: Date | string;
  due_date?: Date | string | null;
  project?: string | null;
  area?: string | null;
  tags?: string[] | null;
  user_id: string;
}

// Initialize Supabase client
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Task Service
export const TaskService = {
  // Get all tasks for the current user
  async getTasks(): Promise<Task[]> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      console.error('User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    
    return data as Task[];
  },
  
  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at'>): Promise<Task | null> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: user.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    
    return data as Task;
  },
  
  // Update an existing task
  async updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    
    return data as Task;
  },
  
  // Delete a task
  async deleteTask(id: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      console.error('User not authenticated');
      return false;
    }
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);
      
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    
    return true;
  },
  
  // Move a task to trash (soft delete)
  async trashTask(id: string): Promise<Task | null> {
    return this.updateTask(id, { status: 'trashed' });
  },
  
  // Mark a task as completed
  async completeTask(id: string): Promise<Task | null> {
    return this.updateTask(id, { status: 'completed' });
  },
};