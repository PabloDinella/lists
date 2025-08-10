import { supabase } from "@/lib/supabase";

export async function deleteTagType(
  tagTypeId: number,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  // First verify the user owns this tag type
  const { data: tagTypeData, error: checkError } = await supabase
    .from("tag_type")
    .select("id")
    .eq("id", tagTypeId)
    .eq("user_id", userId)
    .single();

  if (checkError || !tagTypeData) {
    return { success: false, error: "Tag type not found or access denied" };
  }

  const { error } = await supabase
    .from("tag_type")
    .delete()
    .eq("id", tagTypeId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}
