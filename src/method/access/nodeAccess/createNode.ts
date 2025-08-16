import { supabase } from "@/lib/supabase";
import { z } from "zod";

export const metadataSchema = z.object({
  type: z
    .union([
      z.literal("root"),
      z.literal("structure"),
      z.literal("list"),
      z.literal("tagging"),
      z.literal("loop"),
    ])
    .optional(),
  renderDepth: z.number().optional(),
  children_order: z.array(z.number()).optional(),
  completed: z.boolean().optional(),
});

export type Metadata = z.infer<typeof metadataSchema>;

export type Node = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  order: number | null;
  metadata: Metadata | null;
};

type CreateNodeParams = {
  name: string;
  content?: string;
  parent_node?: number;
  user_id: string;
  order?: number;
  metadata?: Metadata;
};

type CreateNodeResult =
  | {
      result: Node;
    }
  | {
      error: unknown;
    };

export async function createNode(
  params: CreateNodeParams
): Promise<CreateNodeResult> {
  const newNode = {
    name: params.name,
    content: params.content || null,
    parent_node: params.parent_node || null,
    user_id: params.user_id,
    order: params.order ?? null,
    metadata: params.metadata || null,
  };

  const { data, error } = await supabase
    .from("node")
    .insert([newNode])
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
    result: {
      id: data.id,
      name: data.name,
      content: data.content,
      parent_node: data.parent_node,
      user_id: data.user_id!,
      created_at: data.created_at,
      order: data.order,
      metadata: metadataSchema.safeParse(data.metadata).data || null,
    },
  };
}
