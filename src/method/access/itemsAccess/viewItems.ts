import { supabase } from "@/lib/supabase";

type ViewItemsResult =
  | {
      result: {
        id: number;
        title: string;
        createdAt: Date;
        listId: number;
      }[];
    }
  | {
      error: unknown;
    };

export async function viewItems(listId: number): Promise<ViewItemsResult> {
  const { data, error } = await supabase
    .from("item")
    .select()
    .eq("list", listId)
    .order("created_at", { ascending: false });

  if (error) return { error };

  return {
    result: data.map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: new Date(item.created_at),
      listId: item.list || 0, // Handle null case with default value
    })),
  };
}
