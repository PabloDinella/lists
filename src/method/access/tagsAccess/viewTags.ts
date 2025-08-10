import { supabase } from "@/lib/supabase";

type ViewTagsResult =
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

export async function viewTags(userId: string): Promise<ViewTagsResult> {
  const { data, error } = await supabase
    .from("tag")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error };

  return {
    result: data.map((tag) => ({
      id: tag.id,
      name: tag.name,
      createdAt: new Date(tag.created_at),
      user_id: tag.user_id,
    })),
  };
}
