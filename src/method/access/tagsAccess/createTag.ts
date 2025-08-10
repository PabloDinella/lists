import { supabase } from "@/lib/supabase";

type CreateTagParams = {
  name: string;
  userId: string;
};

type CreateTagResult =
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

export async function createTag(
  params: CreateTagParams
): Promise<CreateTagResult> {
  const newTag = {
    name: params.name,
    user_id: params.userId,
  };

  const { data, error } = await supabase
    .from("tag")
    .insert([newTag])
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
      createdAt: new Date(data.created_at),
    },
  };
}
