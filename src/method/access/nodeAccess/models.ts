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
  childrenOrder: z.array(z.number()).optional(),
  completed: z.boolean().optional(),
  defaultChildrenMetadata: z
    .object({
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
      childrenOrder: z.array(z.number()).optional(),
      completed: z.boolean().optional(),
    })
    .optional(),
});

export type Metadata = z.infer<typeof metadataSchema>;

export type Node = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  metadata: Metadata | null;
};
