import { supabase } from "@/lib/supabase";

type CreateListParams = {
  name: string;
  userId: string;
};

type CreateListResult =
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

export async function createList(
  params: CreateListParams
): Promise<CreateListResult> {
  const newList = {
    name: params.name,
    user_id: params.userId,
  };

  const { data, error } = await supabase
    .from("lists")
    .insert([newList])
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
