import { supabase } from "@/lib/supabase";

export interface Item {
  id: number;
  title: string;
  createdAt: Date;
  listId: number;
}

export async function createItem({
  title,
  listId,
  userId,
}: {
  title: string;
  listId: number;
  userId: string;
}): Promise<Item | null> {
  // First, verify that the user owns the list
  const { data: listData, error: listError } = await supabase
    .from("list")
    .select("id")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();

  if (listError || !listData) {
    console.error("User does not own this list or list not found");
    return null;
  }

  const newItem = {
    title,
    list: listId,
    created_at: new Date().toISOString(),
    user_id: userId,
  };
  const { data, error } = await supabase
    .from("item")
    .insert([newItem])
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    createdAt: new Date(data.created_at),
    listId: data.list || 0,
  };
}
