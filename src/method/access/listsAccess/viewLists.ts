import { supabase } from "@/lib/supabase";

type ViewListsResult =
  | {
      result: {
        id: number;
        name: string;
        createdAt: Date;
        user_id: string;
      }[];
    }
  | {
      error: unknown;
    };

export async function viewLists(userId: string): Promise<ViewListsResult> {
  const { data, error } = await supabase
    .from("list")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error };

  return {
    result: data.map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: new Date(list.created_at),
      user_id: list.user_id,
    })),
  };
}
