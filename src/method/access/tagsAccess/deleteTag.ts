import { supabase } from "@/lib/supabase";

export async function deleteTag(
  tagId: number,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  // First verify the user owns this tag
  const { data: tagData, error: checkError } = await supabase
    .from("tag")
    .select("id")
    .eq("id", tagId)
    .eq("user_id", userId)
    .single();

  if (checkError || !tagData) {
    return { success: false, error: "Tag not found or access denied" };
  }

  const { error } = await supabase
    .from("tag")
    .delete()
    .eq("id", tagId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}
