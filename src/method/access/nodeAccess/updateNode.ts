import { supabase } from "@/lib/supabase";
import { Metadata, metadataSchema, Node } from "./models";

type UpdateNodeParams = {
  nodeId: number;
  name?: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
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
  // If we're updating metadata, we need to merge it with existing metadata
  let finalMetadata = params.metadata;
  if (params.metadata !== undefined) {
    // First get the current node to merge metadata
    const { data: currentNode } = await supabase
      .from("node")
      .select("metadata")
      .eq("id", params.nodeId)
      .eq("user_id", params.userId)
      .single();

    if (currentNode && currentNode.metadata) {
      // Merge existing metadata with new metadata - ensure both are objects
      const existingMetadata =
        typeof currentNode.metadata === "object" &&
        currentNode.metadata !== null
          ? (currentNode.metadata as Record<string, unknown>)
          : {};
      const newMetadata =
        typeof params.metadata === "object" && params.metadata !== null
          ? (params.metadata as Record<string, unknown>)
          : {};
      finalMetadata = { ...existingMetadata, ...newMetadata };
    }
  }

  const updateData: {
    name?: string;
    content?: string | null;
    parent_node?: number | null;
    metadata?: Metadata;
  } = {};

  if (params.name !== undefined) updateData.name = params.name;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.parentNode !== undefined)
    updateData.parent_node = params.parentNode;
  if (finalMetadata !== undefined)
    updateData.metadata = metadataSchema.parse(finalMetadata);

  const { data, error } = await supabase
    .from("node")
    .update(updateData)
    .eq("id", params.nodeId)
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
      id: data.id,
      name: data.name,
      content: data.content,
      parent_node: data.parent_node,
      user_id: data.user_id!,
      created_at: data.created_at,
      metadata: metadataSchema.safeParse(data.metadata).data || null,
    },
  };
}
