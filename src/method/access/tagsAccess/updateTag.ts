import { supabase } from "@/lib/supabase";

type UpdateTagParams = {
  tagId: number;
  name: string;
  userId: string;
};

type UpdateTagResult =
  | {
      result: {
        id: number;
        name: string;
        createdAt: Date;
        user_id: string;
      };
    }
  | {
      error: unknown;
    };

export async function updateTag(
  params: UpdateTagParams
): Promise<UpdateTagResult> {
  const { data, error } = await supabase
    .from("tag")
    .update({ name: params.name })
    .eq("id", params.tagId)
    .eq("user_id", params.userId)
    .select()
    .single();

  if (error) {
    return { error };
  }

  if (!data) {
    return {
      error: "No data returned",
    };
  }

  return {
    result: {
      ...data,
      name: data.name || "",
      createdAt: new Date(data.created_at),
    },
  };
}
