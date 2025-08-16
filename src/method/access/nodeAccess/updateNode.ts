import { supabase } from "@/lib/supabase";
import { Node } from "./createNode";
import type { Json } from "@/database.types";

type UpdateNodeParams = {
  node_id: number;
  name?: string;
  content?: string;
  parent_node?: number | null;
  user_id: string;
  order?: number | null;
  metadata?: Json;
};

type UpdateNodeResult =
  | {
      result: Node;
    }
  | {
      error: unknown;
    };

export async function updateNode(
  params: UpdateNodeParams
): Promise<UpdateNodeResult> {
  const updateData: {
    name?: string;
    content?: string | null;
    parent_node?: number | null;
    order?: number | null;
    metadata?: Json;
  } = {};
  
  if (params.name !== undefined) updateData.name = params.name;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.parent_node !== undefined) updateData.parent_node = params.parent_node;
  if (params.order !== undefined) updateData.order = params.order;
  if (params.metadata !== undefined) updateData.metadata = params.metadata;

  const { data, error } = await supabase
    .from("node")
    .update(updateData)
    .eq("id", params.node_id)
    .eq("user_id", params.user_id)
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
      id: data.id,
      name: data.name,
      content: data.content,
      parent_node: data.parent_node,
      user_id: data.user_id!,
      created_at: data.created_at,
      order: data.order,
      metadata: data.metadata,
    },
  };
}
