import { supabase } from "@/lib/supabase";

type CreateTagTypeParams = {
  name: string;
  userId: string;
};

type CreateTagTypeResult =
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

export async function createTagType(
  params: CreateTagTypeParams
): Promise<CreateTagTypeResult> {
  const newTagType = {
    name: params.name,
    user_id: params.userId,
  };

  const { data, error } = await supabase
    .from("tag_type")
    .insert([newTagType])
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
