import { viewOrdering } from "../../access/orderingAccess/viewOrdering";

export async function viewOrderingManager(params: { user_id: string; root_node?: number | null }) {
  return await viewOrdering(params);
}
