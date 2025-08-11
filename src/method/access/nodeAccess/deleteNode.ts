import { supabase } from "@/lib/supabase";

type DeleteNodeParams = {
  node_id: number;
  user_id: string;
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
    .eq("id", params.node_id)
    .eq("user_id", params.user_id);

  if (error) {
    return { error };
  }

  return {
    result: { success: true },
  };
}
