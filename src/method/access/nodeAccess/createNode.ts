import { supabase } from "@/lib/supabase";
import { Metadata, metadataSchema, Node } from "./models";
import { createRelationship } from "./createRelationship";

type CreateNodeParams = {
  name: string;
  content?: string;
  parentNode?: number;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

type CreateNodeResult =
  | {
      result: Node;
    }
  | {
      error: unknown;
    };

export async function createNode(
  params: CreateNodeParams
): Promise<CreateNodeResult> {
  let finalMetadata = params.metadata;

  // If no metadata is provided and there's a parent node, check for defaultChildrenMetadata
  if (!params.metadata && params.parentNode) {
    const { data: parentNode, error: parentError } = await supabase
      .from("node")
      .select("metadata")
      .eq("id", params.parentNode)
      .eq("user_id", params.userId)
      .single();

    if (!parentError && parentNode && parentNode.metadata) {
      const parentMetadata = metadataSchema.safeParse(parentNode.metadata).data;
      if (parentMetadata?.defaultChildrenMetadata) {
        finalMetadata = {
          ...parentMetadata.defaultChildrenMetadata,
          // Inherit the same defaultChildrenMetadata so this node can pass it to its children
          defaultChildrenMetadata: parentMetadata.defaultChildrenMetadata,
        };
      }
    }
  }

  const newNode = {
    name: params.name,
    content: params.content || null,
    parent_node: params.parentNode || null,
    user_id: params.userId,
    metadata: finalMetadata || null,
  };

  const { data, error } = await supabase
    .from("node")
    .insert([newNode])
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

  // Create relationships if provided
  if (params.relatedNodeIds && params.relatedNodeIds.length > 0) {
    const relationType = params.relationType || "tagged_with";
    
    for (const relatedNodeId of params.relatedNodeIds) {
      const relationshipResult = await createRelationship({
        nodeId1: data.id,
        nodeId2: relatedNodeId,
        relationType: relationType,
        userId: params.userId,
      });

      // Log relationship creation errors but don't fail the entire operation
      if ("error" in relationshipResult) {
        console.error("Failed to create relationship:", relationshipResult.error);
      }
    }
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
