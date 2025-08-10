import { supabase } from "@/lib/supabase";

type ViewTagTypesResult =
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

export async function viewTagTypes(userId: string): Promise<ViewTagTypesResult> {
  const { data, error } = await supabase
    .from("tag_type")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error };

  return {
    result: data.map((tagType) => ({
      id: tagType.id,
      name: tagType.name || "",
      createdAt: new Date(tagType.created_at),
      user_id: tagType.user_id,
    })),
  };
}
