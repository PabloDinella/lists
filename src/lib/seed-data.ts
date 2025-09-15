import { createNode } from "@/method/access/nodeAccess/createNode";
import { createRelationship } from "@/method/access/nodeAccess/createRelationship";
import { Metadata } from "@/method/access/nodeAccess/models";
import { supabase } from "@/lib/supabase";
import { GTDSettings } from "@/hooks/use-settings";
import { Json } from "@/database.types";

interface SeedNode {
  name: string;
  description?: string;
  metadata?: Metadata;
  children?: SeedNode[];
  tags?: string[]; // Names of tags to relate to this node
}

export async function createSeedData(userId: string): Promise<Map<string, number>> {
  console.log("Creating seed data for user:", userId);
  
  // Comprehensive GTD structure with realistic sample data
  const seedNodes: SeedNode[] = [
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
              description: "Capture everything that has your attention, unprocessed and unorganized.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
              children: [
                {
                  name: "Research team building activities",
                  description: "Find activities for Q4 team retreat",
                  metadata: { type: "loop" },
                  tags: ["Work", "Planning"]
                },
                {
                  name: "Fix leaky kitchen faucet",
                  description: "Water is dripping from the handle",
                  metadata: { type: "loop" },
                  tags: ["Home", "Maintenance"]
                },
                {
                  name: "Plan Sarah's birthday party",
                  description: "Need to book venue and send invitations",
                  metadata: { type: "loop" },
                  tags: ["Life", "Family"]
                },
                {
                  name: "Review insurance policies",
                  description: "Annual review of auto and home insurance",
                  metadata: { type: "loop" },
                  tags: ["Finance", "Life"]
                },
              ],
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
              children: [
                {
                  name: "Call dentist to schedule cleaning",
                  description: "Dr. Smith's office: 555-1234",
                  metadata: { 
                    type: "loop",
                    energy: "low",
                    time: "5min"
                  },
                  tags: ["Health", "Phone"]
                },
                {
                  name: "Review Q3 financial reports",
                  description: "Analyze sales data and prepare summary",
                  metadata: { 
                    type: "loop",
                    energy: "high",
                    time: "2hrs"
                  },
                  tags: ["Work", "Office"]
                },
                {
                  name: "Buy groceries for the week",
                  description: "Milk, bread, eggs, chicken, vegetables",
                  metadata: { 
                    type: "loop",
                    energy: "medium",
                    time: "1hr"
                  },
                  tags: ["Life", "Errands"]
                },
                {
                  name: "Submit expense report",
                  description: "Include receipts from Chicago trip",
                  metadata: { 
                    type: "loop",
                    energy: "low",
                    time: "15min",
                    dueDate: "2025-09-20"
                  },
                  tags: ["Work", "Computer"]
                },
                {
                  name: "Update LinkedIn profile",
                  description: "Add recent project achievements",
                  metadata: { 
                    type: "loop",
                    energy: "medium",
                    time: "30min"
                  },
                  tags: ["Career", "Computer"]
                },
              ],
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
              children: [
                {
                  name: "Contract approval from legal team",
                  description: "Sent to legal on Sept 10th",
                  metadata: { 
                    type: "loop",
                    waitingFor: "Legal Department"
                  },
                  tags: ["Work", "Legal"]
                },
                {
                  name: "Plumber quote for bathroom renovation",
                  description: "Should receive estimate by end of week",
                  metadata: { 
                    type: "loop",
                    waitingFor: "ABC Plumbing"
                  },
                  tags: ["Home", "Renovation"]
                },
                {
                  name: "Doctor's test results",
                  description: "Blood work from annual physical",
                  metadata: { 
                    type: "loop",
                    waitingFor: "Dr. Johnson's Office"
                  },
                  tags: ["Health"]
                },
              ],
            },
            {
              name: "Someday/Maybe",
              description: "Ideas or goals you might act on in the future, but not now.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
              children: [
                {
                  name: "Learn Spanish",
                  description: "Use Duolingo or find local classes",
                  metadata: { type: "loop" },
                  tags: ["Learning", "Personal Development"]
                },
                {
                  name: "Write a novel",
                  description: "Mystery thriller set in San Francisco",
                  metadata: { type: "loop" },
                  tags: ["Creative", "Writing"]
                },
                {
                  name: "Visit Japan",
                  description: "Cherry blossom season would be ideal",
                  metadata: { type: "loop" },
                  tags: ["Travel", "Life"]
                },
                {
                  name: "Start a podcast",
                  description: "Tech industry insights and interviews",
                  metadata: { type: "loop" },
                  tags: ["Creative", "Career"]
                },
                {
                  name: "Build a treehouse",
                  description: "For the kids in the backyard oak tree",
                  metadata: { type: "loop" },
                  tags: ["Home", "Family", "DIY"]
                },
              ],
            },
            {
              name: "Scheduled",
              description: "Date-specific commitments or actions; only what truly belongs on a calendar.",
              metadata: {
                type: "list",
                defaultChildrenMetadata: {
                  type: "loop",
                },
              },
              children: [
                {
                  name: "Team standup meeting",
                  description: "Daily 9 AM with development team",
                  metadata: { 
                    type: "loop",
                    scheduledDate: "2025-09-16T09:00:00",
                    isRepeating: true
                  },
                  tags: ["Work", "Meetings"]
                },
                {
                  name: "Dentist appointment",
                  description: "Regular cleaning with Dr. Smith",
                  metadata: { 
                    type: "loop",
                    scheduledDate: "2025-09-25T14:00:00"
                  },
                  tags: ["Health"]
                },
                {
                  name: "Parent-teacher conference",
                  description: "Emma's teacher meeting",
                  metadata: { 
                    type: "loop",
                    scheduledDate: "2025-09-22T16:30:00"
                  },
                  tags: ["Family", "Education"]
                },
                {
                  name: "Board game night",
                  description: "Monthly gathering with friends",
                  metadata: { 
                    type: "loop",
                    scheduledDate: "2025-09-28T19:00:00",
                    isRepeating: true
                  },
                  tags: ["Social", "Fun"]
                },
              ],
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
          children: [
            {
              name: "Q4 Marketing Campaign",
              description: "Launch new product marketing campaign for holiday season",
              metadata: { type: "loop" },
              tags: ["Work", "Marketing"],
              children: [
                {
                  name: "Research target audience demographics",
                  description: "Analyze customer data and market research",
                  metadata: { 
                    type: "loop",
                    completed: true
                  },
                  tags: ["Work", "Research"]
                },
                {
                  name: "Create campaign messaging framework",
                  description: "Develop key messages and value propositions",
                  metadata: { type: "loop" },
                  tags: ["Work", "Creative"]
                },
                {
                  name: "Design creative assets",
                  description: "Work with design team on visuals",
                  metadata: { type: "loop" },
                  tags: ["Work", "Design"]
                },
                {
                  name: "Plan media buy strategy",
                  description: "Allocate budget across digital channels",
                  metadata: { type: "loop" },
                  tags: ["Work", "Media"]
                },
              ],
            },
            {
              name: "Home Office Setup",
              description: "Create a productive workspace in the spare bedroom",
              metadata: { type: "loop" },
              tags: ["Home", "Productivity"],
              children: [
                {
                  name: "Measure room dimensions",
                  description: "Get accurate measurements for furniture planning",
                  metadata: { 
                    type: "loop",
                    completed: true
                  },
                  tags: ["Home", "Planning"]
                },
                {
                  name: "Research ergonomic desk options",
                  description: "Standing desk vs traditional options",
                  metadata: { type: "loop" },
                  tags: ["Home", "Computer", "Health"]
                },
                {
                  name: "Set up proper lighting",
                  description: "Task lighting and ambient lighting",
                  metadata: { type: "loop" },
                  tags: ["Home", "Lighting"]
                },
                {
                  name: "Organize cable management",
                  description: "Hide and route all computer cables",
                  metadata: { type: "loop" },
                  tags: ["Home", "Organization"]
                },
              ],
            },
            {
              name: "Learn React Native",
              description: "Build mobile development skills for career growth",
              metadata: { type: "loop" },
              tags: ["Learning", "Career", "Technology"],
              children: [
                {
                  name: "Complete online course",
                  description: "Udemy React Native course (32 hours)",
                  metadata: { type: "loop" },
                  tags: ["Learning", "Computer"]
                },
                {
                  name: "Build practice app",
                  description: "Simple todo app to practice concepts",
                  metadata: { type: "loop" },
                  tags: ["Learning", "Programming"]
                },
                {
                  name: "Read React Native documentation",
                  description: "Official docs and best practices",
                  metadata: { type: "loop" },
                  tags: ["Learning", "Reading"]
                },
                {
                  name: "Join React Native community",
                  description: "Discord/Slack groups for networking",
                  metadata: { type: "loop" },
                  tags: ["Learning", "Networking"]
                },
              ],
            },
            {
              name: "Plan Summer Vacation",
              description: "Family trip to Europe - 2 weeks in July",
              metadata: { type: "loop" },
              tags: ["Travel", "Family", "Life"],
              children: [
                {
                  name: "Research destinations",
                  description: "Italy vs Spain vs France options",
                  metadata: { 
                    type: "loop",
                    completed: true
                  },
                  tags: ["Travel", "Research"]
                },
                {
                  name: "Book flights",
                  description: "Compare prices across airlines",
                  metadata: { type: "loop" },
                  tags: ["Travel", "Computer"]
                },
                {
                  name: "Reserve accommodations",
                  description: "Hotels or vacation rentals in each city",
                  metadata: { type: "loop" },
                  tags: ["Travel", "Computer"]
                },
                {
                  name: "Plan daily itineraries",
                  description: "Balance sightseeing with relaxation",
                  metadata: { type: "loop" },
                  tags: ["Travel", "Planning"]
                },
                {
                  name: "Arrange pet care",
                  description: "Find trusted sitter for Max the dog",
                  metadata: { type: "loop" },
                  tags: ["Travel", "Pets"]
                },
              ],
            },
          ],
        },
        {
          name: "Areas of focus",
          description: "Key spheres of responsibility that define what you must maintain or improve over time.",
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
              description: "Personal life, relationships, and well-being",
              metadata: { type: "tag" },
            },
            {
              name: "Work",
              description: "Professional responsibilities and career",
              metadata: { type: "tag" },
            },
            {
              name: "Health",
              description: "Physical and mental wellness",
              metadata: { type: "tag" },
            },
            {
              name: "Family",
              description: "Spouse, children, and extended family",
              metadata: { type: "tag" },
            },
            {
              name: "Finance",
              description: "Money management and financial planning",
              metadata: { type: "tag" },
            },
            {
              name: "Learning",
              description: "Education and skill development",
              metadata: { type: "tag" },
            },
            {
              name: "Creative",
              description: "Artistic and creative pursuits",
              metadata: { type: "tag" },
            },
            {
              name: "Social",
              description: "Friends and social activities",
              metadata: { type: "tag" },
            },
          ],
        },
        {
          name: "Contexts",
          description: "Tags that group actions by the tools, locations, or situations needed to do them.",
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
              description: "At the office or work location",
              metadata: { type: "tag" },
            },
            {
              name: "Home",
              description: "At home or around the house",
              metadata: { type: "tag" },
            },
            {
              name: "Computer",
              description: "Tasks requiring a computer",
              metadata: { type: "tag" },
            },
            {
              name: "Phone",
              description: "Phone calls to make",
              metadata: { type: "tag" },
            },
            {
              name: "Errands",
              description: "Out and about running errands",
              metadata: { type: "tag" },
            },
            {
              name: "Meetings",
              description: "In meetings or calls",
              metadata: { type: "tag" },
            },
            {
              name: "Reading",
              description: "Focused reading time",
              metadata: { type: "tag" },
            },
            {
              name: "Waiting",
              description: "Tasks for when you have unexpected downtime",
              metadata: { type: "tag" },
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
          children: [
            {
              name: "Emergency contacts",
              description: "Important phone numbers and contacts",
              metadata: { type: "loop" },
              children: [
                {
                  name: "Doctor: Dr. Johnson - 555-2345",
                  metadata: { type: "loop" },
                },
                {
                  name: "Dentist: Dr. Smith - 555-1234",
                  metadata: { type: "loop" },
                },
                {
                  name: "Plumber: ABC Plumbing - 555-7890",
                  metadata: { type: "loop" },
                },
                {
                  name: "Electrician: Bright Electric - 555-5555",
                  metadata: { type: "loop" },
                },
              ],
            },
            {
              name: "Favorite recipes",
              description: "Family favorites and new recipes to try",
              metadata: { type: "loop" },
              children: [
                {
                  name: "Grandma's chocolate chip cookies",
                  description: "The secret is brown butter and sea salt",
                  metadata: { type: "loop" },
                },
                {
                  name: "Slow cooker chicken curry",
                  description: "Easy weeknight dinner with coconut milk",
                  metadata: { type: "loop" },
                },
                {
                  name: "Homemade pizza dough",
                  description: "24-hour cold fermentation for best flavor",
                  metadata: { type: "loop" },
                },
              ],
            },
            {
              name: "Travel planning resources",
              description: "Useful websites and tips for trip planning",
              metadata: { type: "loop" },
              children: [
                {
                  name: "Google Flights for flight comparison",
                  metadata: { type: "loop" },
                },
                {
                  name: "Booking.com for accommodations",
                  metadata: { type: "loop" },
                },
                {
                  name: "Rome2Rio for transportation options",
                  metadata: { type: "loop" },
                },
                {
                  name: "TripAdvisor for restaurant recommendations",
                  metadata: { type: "loop" },
                },
              ],
            },
            {
              name: "Gift ideas",
              description: "Ideas for birthdays, holidays, and special occasions",
              metadata: { type: "loop" },
              children: [
                {
                  name: "Sarah (wife): Art supplies, yoga classes",
                  metadata: { type: "loop" },
                },
                {
                  name: "Emma (daughter): Books, science kits",
                  metadata: { type: "loop" },
                },
                {
                  name: "Mom: Garden tools, cooking classes",
                  metadata: { type: "loop" },
                },
                {
                  name: "Dad: Tech gadgets, woodworking supplies",
                  metadata: { type: "loop" },
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  // Create nodes recursively
  const nodeIdMap = new Map<string, number>();
  await createNodesRecursively(seedNodes, null, userId, nodeIdMap);

  // Create relationships between nodes and their tags
  await createTagRelationships(seedNodes, nodeIdMap, userId);

  // Create default settings based on the created nodes
  await createDefaultSettings(userId, nodeIdMap);

  console.log("Seed data creation completed!");
  return nodeIdMap;
}

async function createDefaultSettings(
  userId: string,
  nodeIdMap: Map<string, number>,
): Promise<void> {
  const defaultSettings: GTDSettings = {
    inbox: nodeIdMap.get("Inbox") ?? null,
    nextActions: nodeIdMap.get("Next actions") ?? null,
    waiting: nodeIdMap.get("Waiting") ?? null,
    projects: nodeIdMap.get("Projects") ?? null,
    somedayMaybe: nodeIdMap.get("Someday/Maybe") ?? null,
    contexts: nodeIdMap.get("Contexts") ?? null,
    areasOfFocus: nodeIdMap.get("Areas of focus") ?? null,
    reference: nodeIdMap.get("Reference") ?? null,
    scheduled: nodeIdMap.get("Scheduled") ?? null,
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
  nodes: SeedNode[],
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

async function createTagRelationships(
  nodes: SeedNode[],
  nodeIdMap: Map<string, number>,
  userId: string,
): Promise<void> {
  for (const node of nodes) {
    if (node.tags && node.tags.length > 0) {
      const nodeId = nodeIdMap.get(node.name);
      if (nodeId) {
        for (const tagName of node.tags) {
          const tagId = nodeIdMap.get(tagName);
          if (tagId) {
            const result = await createRelationship({
              nodeId1: nodeId,
              nodeId2: tagId,
              relationType: "tagged_with",
              userId,
            });

            if ("error" in result) {
              console.warn(`Failed to create relationship between ${node.name} and ${tagName}:`, result.error);
            }
          }
        }
      }
    }

    // Recursively process children
    if (node.children) {
      await createTagRelationships(node.children, nodeIdMap, userId);
    }
  }
}

// Function to clear all data for a user (useful for testing)
export async function clearUserData(userId: string): Promise<void> {
  console.log("Clearing user data for:", userId);
  
  // Delete relationships first (due to foreign key constraints)
  await supabase.from("relationship").delete().eq("user_id", userId);
  
  // Delete nodes
  await supabase.from("node").delete().eq("user_id", userId);
  
  // Delete settings
  await supabase.from("settings").delete().eq("user_id", userId);
  
  console.log("User data cleared!");
}
