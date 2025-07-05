import { supabase } from "@/lib/supabase";

type ViewListsResult =
  | {
      result: {
        id: number;
        name: string;
        createdAt: Date;
      }[];
    }
  | {
      error: unknown;
    };

export async function viewLists(): Promise<ViewListsResult> {
  const { data, error } = await supabase
    .from("lists")
    .select()
    .order("created_at", { ascending: false });

  if (error) return { error };

  return {
    result: data.map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: new Date(list.created_at),
    })),
  };
}
