import { supabase } from "@/lib/supabase";
import { Node } from "./createNode";

type ViewNodesParams = {
  user_id: string;
  parent_node?: number | null;
};

type ViewNodesResult =
  | {
      result: Node[];
    }
  | {
      error: unknown;
    };

export async function viewNodes(
  params: ViewNodesParams
): Promise<ViewNodesResult> {
  let query = supabase
    .from("node")
    .select("*")
    .eq("user_id", params.user_id)
    .order("created_at", { ascending: true });

  if (params.parent_node !== undefined) {
    if (params.parent_node === null) {
      query = query.is("parent_node", null);
    } else {
      query = query.eq("parent_node", params.parent_node);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { error };
  }

  if (!data) {
    return {
      result: [],
    };
  }

  return {
    result: data.map((node) => ({
      id: node.id,
      name: node.name,
      content: node.content,
      parent_node: node.parent_node,
      user_id: node.user_id!,
      created_at: node.created_at,
      order: node.order,
      metadata: node.metadata,
    })),
  };
}
