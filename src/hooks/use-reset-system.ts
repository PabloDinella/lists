import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createNode } from "@/method/access/nodeAccess/createNode";
import { Metadata } from "@/method/access/nodeAccess/models";

interface DefaultNode {
  name: string;
  description?: string;
  metadata?: Metadata;
  children?: DefaultNode[];
}

export function useResetSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // First, delete all existing user data
      await deleteAllUserData(userId);

      // Then, create the default structure from YAML
      await createDefaultStructure(userId);

      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
      queryClient.invalidateQueries({
        queryKey: ["settings", variables.userId],
      });
    },
  });
}

async function deleteAllUserData(userId: string) {
  // Delete all nodes for this user (cascading will handle children)
  const { error: nodesError } = await supabase
    .from("node")
    .delete()
    .eq("user_id", userId);

  if (nodesError) throw nodesError;

  // Delete settings for this user
  const { error: settingsError } = await supabase
    .from("settings")
    .delete()
    .eq("user_id", userId);

  if (settingsError) throw settingsError;

  // Delete any other user data (tasks, projects, areas) if they exist
  // Note: These tables might not exist in the current schema, so we skip them for now
}

async function createDefaultStructure(userId: string) {
  // Default GTD structure as JSON
  const defaultNodes: DefaultNode[] = [
    {
      name: "Root",
      metadata: {
        type: "root",
      },
      children: [
        {
          name: "Lists",
          metadata: {
            type: "list",
            defaultChildrenMetadata: {
              type: "list",
            },
          },
          children: [
            {
              name: "Inbox",
              description:
                "Capture everything that has your attention, unprocessed and unorganized.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
            },
            {
              name: "Next actions",
              description: "Concrete, visible steps you can take now.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
            },
            {
              name: "Waiting",
              description: "Items you've delegated or are pending from others.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
            },
            {
              name: "Someday/Maybe",
              description:
                "Ideas or goals you might act on in the future, but not now.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
            },
            {
              name: "Scheduled",
              description:
                "Date-specific commitments or actions; only what truly belongs on a calendar.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
            },
          ],
        },
        {
          name: "Projects",
          description: "Goals, or tasks that require more than one action.",
          metadata: {
            type: "list",
            defaultChildrenMetadata: {
              type: "loop",
            },
          },
        },
        {
          name: "Areas of focus",
          description:
            "Key spheres of responsibility that define what you must maintain or improve over time.",
          metadata: {
            type: "tagging",
            defaultChildrenMetadata: {
              type: "tag",
            },
          },
          children: [
            {
              name: "Life",
              metadata: {
                type: "tag",
              },
            },
            {
              name: "Work",
              metadata: {
                type: "tag",
              },
            },
            {
              name: "Church",
              metadata: {
                type: "tag",
              },
            },
            {
              name: "Health",
              metadata: {
                type: "tag",
              },
            },
          ],
        },
        {
          name: "Contexts",
          description:
            "Tags that group actions by the tools, locations, or situations needed to do them.",
          metadata: {
            type: "tagging",
            defaultChildrenMetadata: {
              type: "tag",
            },
          },
          children: [
            {
              name: "Office",
              metadata: {
                type: "tag",
              },
            },
            {
              name: "Home",
              metadata: {
                type: "tag",
              },
            },
            {
              name: "Out",
              metadata: {
                type: "tag",
              },
            },
          ],
        },
        {
          name: "Reference",
          description: "For stuff you want to keep around as a reference.",
          metadata: {
            type: "list",
            defaultChildrenMetadata: {
              type: "loop",
            },
          },
        },
      ],
    },
  ];

  // Create nodes recursively
  const nodeIdMap = new Map<string, number>();

  await createNodesRecursively(defaultNodes, null, userId, nodeIdMap);
}

async function createNodesRecursively(
  nodes: DefaultNode[],
  parentId: number | null,
  userId: string,
  nodeIdMap: Map<string, number>,
): Promise<void> {
  for (const node of nodes) {
    const result = await createNode({
      name: node.name,
      content: node.description || undefined,
      parentNode: parentId || undefined,
      userId,
      metadata: node.metadata,
    });

    if ("error" in result) {
      throw new Error(`Failed to create node ${node.name}: ${result.error}`);
    }

    const nodeId = result.result.id;
    nodeIdMap.set(node.name, nodeId);

    if (node.children && node.children.length > 0) {
      await createNodesRecursively(node.children, nodeId, userId, nodeIdMap);
    }
  }
}
