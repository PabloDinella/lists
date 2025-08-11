import { upsertOrdering } from "../../access/orderingAccess/upsertOrdering";

export async function upsertOrderingManager(params: { user_id: string; root_node?: number | null; order: number[] }) {
  return await upsertOrdering(params);
}
