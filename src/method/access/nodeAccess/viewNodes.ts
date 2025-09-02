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

  // Get all relationships for these nodes
  const nodeIds = data.map(node => node.id);
  const { data: relationships, error: relationshipError } = await supabase
    .from("relationship")
    .select("node_id_1, node_id_2, relation_type")
    .eq("user_id", params.userId)
    .or(`node_id_1.in.(${nodeIds.join(",")}),node_id_2.in.(${nodeIds.join(",")})`);

  if (relationshipError) {
    return { error: relationshipError };
  }

  // Get all unique related node IDs
  const allRelatedNodeIds = new Set<number>();
  if (relationships) {
    relationships.forEach(rel => {
      if (rel.node_id_1 && rel.node_id_2) {
        // For each relationship, add the "other" node as a related node
        if (nodeIds.includes(rel.node_id_1)) {
          allRelatedNodeIds.add(rel.node_id_2);
        }
        if (nodeIds.includes(rel.node_id_2)) {
          allRelatedNodeIds.add(rel.node_id_1);
        }
      }
    });
  }

  // Fetch complete node data for all related nodes
  let relatedNodesData: typeof data = [];
  if (allRelatedNodeIds.size > 0) {
    const { data: relatedData, error: relatedError } = await supabase
      .from("node")
      .select("*")
      .eq("user_id", params.userId)
      .in("id", Array.from(allRelatedNodeIds));

    if (relatedError) {
      return { error: relatedError };
    }

    relatedNodesData = relatedData || [];
  }

  // Create a map of node ID to complete related nodes
  const relatedNodesMap = new Map<number, Node[]>();
  
  // Initialize empty arrays for all nodes
  nodeIds.forEach(id => {
    relatedNodesMap.set(id, []);
  });

  // Process relationships to build related nodes map with complete Node data
  if (relationships) {
    relationships.forEach(rel => {
      if (rel.node_id_1 && rel.node_id_2) {
        // Add node2 as related to node1 if node1 is in our main data
        if (nodeIds.includes(rel.node_id_1)) {
          const relatedNodeData = relatedNodesData.find(n => n.id === rel.node_id_2);
          if (relatedNodeData) {
            const node1Related = relatedNodesMap.get(rel.node_id_1) || [];
            node1Related.push({
              id: relatedNodeData.id,
              name: relatedNodeData.name,
              content: relatedNodeData.content,
              parent_node: relatedNodeData.parent_node,
              user_id: relatedNodeData.user_id!,
              created_at: relatedNodeData.created_at,
              metadata: metadataSchema.safeParse(relatedNodeData.metadata).data || null,
              related_nodes: [], // We don't need nested related nodes for now
            });
            relatedNodesMap.set(rel.node_id_1, node1Related);
          }
        }
        
        // Add node1 as related to node2 if node2 is in our main data (bidirectional)
        if (nodeIds.includes(rel.node_id_2)) {
          const relatedNodeData = relatedNodesData.find(n => n.id === rel.node_id_1);
          if (relatedNodeData) {
            const node2Related = relatedNodesMap.get(rel.node_id_2) || [];
            node2Related.push({
              id: relatedNodeData.id,
              name: relatedNodeData.name,
              content: relatedNodeData.content,
              parent_node: relatedNodeData.parent_node,
              user_id: relatedNodeData.user_id!,
              created_at: relatedNodeData.created_at,
              metadata: metadataSchema.safeParse(relatedNodeData.metadata).data || null,
              related_nodes: [], // We don't need nested related nodes for now
            });
            relatedNodesMap.set(rel.node_id_2, node2Related);
          }
        }
      }
    });
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
      related_nodes: relatedNodesMap.get(node.id) || [],
    })),
  };
}
