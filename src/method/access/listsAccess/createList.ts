import { supabase } from "@/lib/supabase";

type CreateListParams = {
  name: string;
};

type CreateListResult =
  | {
      result: {
        id: number;
        name: string;
        createdAt: Date;
      };
    }
  | {
      error: unknown;
    };

export async function createList(
  params: CreateListParams
): Promise<CreateListResult> {
  const newList = {
    ...params,
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
