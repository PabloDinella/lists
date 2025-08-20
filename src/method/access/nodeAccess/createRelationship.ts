import { supabase } from "@/lib/supabase";

type CreateRelationshipParams = {
  nodeId1: number;
  nodeId2: number;
  relationType: string;
  userId: string;
};

type CreateRelationshipResult =
  | {
      result: { success: true; id: number };
    }
  | {
      error: unknown;
    };

export async function createRelationship(
  params: CreateRelationshipParams
): Promise<CreateRelationshipResult> {
  const { data, error } = await supabase
    .from("relationship")
    .insert({
      node_id_1: params.nodeId1,
      node_id_2: params.nodeId2,
      relation_type: params.relationType,
      user_id: params.userId,
    })
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
    result: { success: true, id: data.id },
  };
}
