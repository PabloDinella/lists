import { supabase } from "@/lib/supabase";
import { metadataSchema, Node } from "./models";

type ViewNodesParams = {
  userId: string;
  parentNodeId?: number | null;
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
    .eq("user_id", params.userId)
    .order("created_at", { ascending: true });

  if (params.parentNodeId !== undefined) {
    if (params.parentNodeId === null) {
      query = query.is("parent_node", null);
    } else {
      query = query.eq("parent_node", params.parentNodeId);
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
      metadata: metadataSchema.safeParse(node.metadata).data || null,
    })),
  };
}
