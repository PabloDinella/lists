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

  // Create a map of node ID to related nodes
  const relatedNodesMap = new Map<number, { id: number; name: string }[]>();
  
  // Initialize empty arrays for all nodes
  nodeIds.forEach(id => {
    relatedNodesMap.set(id, []);
  });

  // Process relationships to build related nodes map
  if (relationships) {
    relationships.forEach(rel => {
      if (rel.node_id_1 && rel.node_id_2) {
        // Find the names of related nodes
        const node1 = data.find(n => n.id === rel.node_id_1);
        const node2 = data.find(n => n.id === rel.node_id_2);
        
        if (node1 && node2) {
          // Add node2 as related to node1
          const node1Related = relatedNodesMap.get(rel.node_id_1) || [];
          node1Related.push({ id: rel.node_id_2, name: node2.name });
          relatedNodesMap.set(rel.node_id_1, node1Related);
          
          // Add node1 as related to node2 (bidirectional)
          const node2Related = relatedNodesMap.get(rel.node_id_2) || [];
          node2Related.push({ id: rel.node_id_1, name: node1.name });
          relatedNodesMap.set(rel.node_id_2, node2Related);
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
