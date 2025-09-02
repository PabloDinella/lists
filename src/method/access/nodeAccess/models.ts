import { z } from "zod";

export const metadataSchema = z.object({
  type: z
    .union([
      z.literal("root"),
      z.literal("list"),
      z.literal("loop"),
      z.literal("tagging"),
      z.literal("tag"),
    ])
    .optional(),
  renderDepth: z.number().optional(),
  childrenOrder: z.array(z.number()).optional(),
  completed: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  renderInline: z.boolean().optional(),
  focus: z.boolean().optional(),
  energy: z.string().optional(),
  time: z.string().optional(),
  dueDate: z.string().optional(),
  waitingFor: z.string().optional(),
  scheduledDate: z.string().optional(),
  isRepeating: z.boolean().optional(),
  defaultChildrenMetadata: z
    .object({
      type: z
        .union([
          z.literal("root"),
          z.literal("list"),
          z.literal("loop"),
          z.literal("tagging"),
          z.literal("tag"),
        ])
        .optional(),
      renderDepth: z.number().optional(),
      childrenOrder: z.array(z.number()).optional(),
      completed: z.boolean().optional(),
      collapsed: z.boolean().optional(),
      renderInline: z.boolean().optional(),
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
  related_nodes: Node[];
};
