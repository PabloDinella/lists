import { supabase } from "@/lib/supabase";

type DeleteRelationshipsParams = {
  nodeId: number;
  userId: string;
  relationType?: string;
};

type DeleteRelationshipsResult =
  | {
      result: { success: true };
    }
  | {
      error: unknown;
    };

export async function deleteRelationships(
  params: DeleteRelationshipsParams
): Promise<DeleteRelationshipsResult> {
  let query = supabase
    .from("relationship")
    .delete()
    .eq("user_id", params.userId)
    .or(`node_id_1.eq.${params.nodeId},node_id_2.eq.${params.nodeId}`);

  if (params.relationType) {
    query = query.eq("relation_type", params.relationType);
  }

  const { error } = await query;

  if (error) {
    return { error };
  }

  return {
    result: { success: true },
  };
}
