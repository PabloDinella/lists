import { supabase } from "@/lib/supabase";

export type Ordering = {
  id: number;
  order: number[];
  root_node: number | null;
  user_id: string;
  created_at: string;
};

type ViewOrderingParams = {
  user_id: string;
  root_node?: number | null;
};

type ViewOrderingResult =
  | { result: Ordering | null }
  | { error: unknown };

export async function viewOrdering(params: ViewOrderingParams): Promise<ViewOrderingResult> {
  let query = supabase
    .from("ordering")
    .select("*")
    .eq("user_id", params.user_id)
    .limit(1);

  if (params.root_node !== undefined) {
    if (params.root_node === null) {
      query = query.is("root_node", null);
    } else {
      query = query.eq("root_node", params.root_node);
    }
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: No rows found for single
    return { error };
  }

  return { result: data ? {
    id: data.id,
    order: data.order,
    root_node: data.root_node,
    user_id: data.user_id,
    created_at: data.created_at,
  } : null };
}
