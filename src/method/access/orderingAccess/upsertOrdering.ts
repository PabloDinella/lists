import { supabase } from "@/lib/supabase";
import type { Ordering } from "./viewOrdering";

type UpsertOrderingParams = {
  user_id: string;
  root_node?: number | null;
  order: number[];
};

type UpsertOrderingResult =
  | { result: Ordering }
  | { error: unknown };

export async function upsertOrdering(params: UpsertOrderingParams): Promise<UpsertOrderingResult> {
  // find existing row for (user_id, root_node)
  let selectQuery = supabase
    .from("ordering")
    .select("id")
    .eq("user_id", params.user_id)
    .limit(1);

  if (params.root_node === null || params.root_node === undefined) {
    selectQuery = selectQuery.is("root_node", null);
  } else {
    selectQuery = selectQuery.eq("root_node", params.root_node);
  }

  const { data: rows, error: selectError } = await selectQuery;
  if (selectError) return { error: selectError };

  if (rows && rows.length > 0) {
    // update existing
    const id = rows[0].id as number;
    const { data, error } = await supabase
      .from("ordering")
      .update({ order: params.order })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    return {
      result: {
        id: data.id,
        order: data.order,
        root_node: data.root_node,
        user_id: data.user_id,
        created_at: data.created_at,
      },
    };
  }

  // insert new
  const insertRow = {
    user_id: params.user_id,
    root_node: params.root_node ?? null,
    order: params.order,
  };

  const { data, error } = await supabase
    .from("ordering")
    .insert(insertRow)
    .select()
    .single();

  if (error) return { error };

  return {
    result: {
      id: data.id,
      order: data.order,
      root_node: data.root_node,
      user_id: data.user_id,
      created_at: data.created_at,
    },
  };
}
