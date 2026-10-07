import type { Tables } from "../database.types.ts";
import { metadataSchema, type Node } from "../method/access/nodeAccess/models.ts";

type NodeRow = Tables<"node">;
type RelationshipRow = Tables<"relationship">;

export function buildNodeViews(
  allNodes: NodeRow[],
  relationships: RelationshipRow[],
  userId: string,
  parentNodeId?: number | null,
): Node[] {
  const nodesById = new Map(allNodes.map((row) => [row.id, row]));
  const selected = allNodes
    .filter((row) => parentNodeId === undefined || row.parent_node === parentNodeId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const toNode = (row: NodeRow): Node => ({
    id: row.id,
    name: row.name,
    content: row.content,
    parent_node: row.parent_node,
    user_id: row.user_id ?? userId,
    created_at: row.created_at,
    metadata: metadataSchema.safeParse(row.metadata).data ?? null,
    related_nodes: [],
  });

  return selected.map((row) => {
    const node = toNode(row);
    node.related_nodes = relationships.flatMap((edge) => {
      const outgoing = edge.node_id_1 === row.id;
      const incoming = edge.node_id_2 === row.id;
      if (!outgoing && !incoming) return [];
      const related = nodesById.get(outgoing ? edge.node_id_2 ?? NaN : edge.node_id_1 ?? NaN);
      if (!related) return [];
      return [{
        ...toNode(related),
        relation_type: edge.relation_type,
        relation_direction: outgoing ? "outgoing" as const : "incoming" as const,
      }];
    });
    return node;
  });
}

export function getOutgoingTagIds(node: Pick<Node, "related_nodes">): number[] {
  return node.related_nodes
    .filter((related) =>
      related.relation_type === "tagged_with" &&
      related.relation_direction === "outgoing"
    )
    .map((related) => related.id);
}
