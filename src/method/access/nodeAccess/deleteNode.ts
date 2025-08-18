import { supabase } from "@/lib/supabase";

type DeleteNodeParams = {
  nodeId: number;
  userId: string;
};

type DeleteNodeResult =
  | {
      result: { success: true };
    }
  | {
      error: unknown;
    };

export async function deleteNode(
  params: DeleteNodeParams
): Promise<DeleteNodeResult> {
  const { error } = await supabase
    .from("node")
    .delete()
    .eq("id", params.nodeId)
    .eq("user_id", params.userId);

  if (error) {
    return { error };
  }

  return {
    result: { success: true },
  };
}
