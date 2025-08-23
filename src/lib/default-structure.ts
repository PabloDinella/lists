import { createNode } from "@/method/access/nodeAccess/createNode";
import { Metadata } from "@/method/access/nodeAccess/models";
import { supabase } from "@/lib/supabase";
import { GTDSettings } from "@/hooks/use-settings";
import { Json } from "@/database.types";

interface DefaultNode {
  name: string;
  description?: string;
  metadata?: Metadata;
  children?: DefaultNode[];
}

export async function createDefaultStructure(
  userId: string,
): Promise<Map<string, number>> {
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
            renderInline: true,
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
            renderInline: true,
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
          name: "Contacts",
          description: "People you need to keep in touch with or follow up on.",
          metadata: {
            type: "tagging",
            renderInline: true,
            defaultChildrenMetadata: {
              type: "tag",
            },
          },
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

  // Create default settings based on the created nodes
  await createDefaultSettings(userId, nodeIdMap);

  return nodeIdMap;
}

async function createDefaultSettings(
  userId: string,
  nodeIdMap: Map<string, number>,
): Promise<void> {
  const defaultSettings: GTDSettings = {
    inbox: nodeIdMap.get("Inbox") ?? null,
    nextActions: nodeIdMap.get("Next actions") ?? null,
    projects: nodeIdMap.get("Projects") ?? null,
    somedayMaybe: nodeIdMap.get("Someday/Maybe") ?? null,
    contexts: nodeIdMap.get("Contexts") ?? null,
    areasOfFocus: nodeIdMap.get("Areas of focus") ?? null,
    reference: nodeIdMap.get("Reference") ?? null,
  };

  // Insert the default settings
  const { error } = await supabase.from("settings").upsert({
    user_id: userId,
    settings: defaultSettings as unknown as Json,
  });

  if (error) {
    throw new Error(`Failed to create default settings: ${error.message}`);
  }
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
