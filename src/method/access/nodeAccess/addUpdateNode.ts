import { supabase } from "@/lib/supabase";
import { Metadata, metadataSchema, Node } from "./models";
import { createRelationship } from "./createRelationship";
import { deleteRelationships } from "./deleteRelationships";

type AddUpdateNodeParams = {
  nodeId?: number; // If provided, updates existing node; if not, creates new node
  name: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

type AddUpdateNodeResult =
  | {
      result: Node;
    }
  | {
      error: unknown;
    };

export async function addUpdateNode(
  params: AddUpdateNodeParams,
): Promise<AddUpdateNodeResult> {
  const isUpdate = params.nodeId !== undefined;

  if (isUpdate) {
    // UPDATE LOGIC

    const { data, error } = await supabase
      .from("node")
      .update({
        name: params.name,
        content: params.content,
        parent_node: params.parentNode,
        metadata: params.metadata,
      })
      .eq("id", params.nodeId!)
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

    // Update relationships if provided
    if (params.relatedNodeIds !== undefined) {
      const relationType = params.relationType || "tagged_with";

      // First, delete existing relationships of this type
      const deleteResult = await deleteRelationships({
        nodeId: params.nodeId!,
        userId: params.userId,
        relationType: relationType,
      });

      if ("error" in deleteResult) {
        console.error(
          "Failed to delete existing relationships:",
          deleteResult.error,
        );
      }

      // Then, create new relationships
      if (params.relatedNodeIds.length > 0) {
        for (const relatedNodeId of params.relatedNodeIds) {
          const relationshipResult = await createRelationship({
            nodeId1: params.nodeId!,
            nodeId2: relatedNodeId,
            relationType: relationType,
            userId: params.userId,
          });

          // Log relationship creation errors but don't fail the entire operation
          if ("error" in relationshipResult) {
            console.error(
              "Failed to create relationship:",
              relationshipResult.error,
            );
          }
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
        related_nodes: [],
      },
    };
  }

  // CREATE LOGIC

  // // If no metadata is provided and there's a parent node, check for defaultChildrenMetadata
  // if (!params.metadata && params.parentNode) {
  //   const { data: parentNode, error: parentError } = await supabase
  //     .from("node")
  //     .select("metadata")
  //     .eq("id", params.parentNode)
  //     .eq("user_id", params.userId)
  //     .single();

  //   if (!parentError && parentNode && parentNode.metadata) {
  //     const parentMetadata = metadataSchema.safeParse(parentNode.metadata).data;
  //     if (parentMetadata?.defaultChildrenMetadata) {
  //       finalMetadata = {
  //         ...parentMetadata.defaultChildrenMetadata,
  //         // Inherit the same defaultChildrenMetadata so this node can pass it to its children
  //         defaultChildrenMetadata: parentMetadata.defaultChildrenMetadata,
  //       };
  //     }
  //   }
  // }

  const { data, error } = await supabase
    .from("node")
    .insert([
      {
        name: params.name,
        content: params.content,
        parent_node: params.parentNode,
        user_id: params.userId,
        metadata: params.metadata,
      },
    ])
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
        console.error(
          "Failed to create relationship:",
          relationshipResult.error,
        );
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
      related_nodes: [],
    },
  };
}
