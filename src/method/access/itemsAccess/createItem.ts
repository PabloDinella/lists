import { supabase } from "@/lib/supabase";

export interface Task {
  id: string;
  title: string;
  description: string;
  status:
    | "inbox"
    | "next"
    | "waiting"
    | "scheduled"
    | "someday"
    | "completed"
    | "trashed";
  createdAt: Date;
  dueDate?: Date;
  project?: string;
  area?: string;
  tags?: string[];
}

export async function createItem({
  title,
  userId,
}: {
  title: string;
  userId: string;
}): Promise<Task | null> {
  const newTask = {
    title,
    description: "",
    status: "inbox",
    created_at: new Date().toISOString(),
    user_id: userId,
  };
  const { data, error } = await supabase
    .from("tasks")
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
