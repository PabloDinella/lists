import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";
import { Tables } from "@/database.types";
import { Metadata } from "@/method/access/nodeAccess/models";

export interface NirvanaRow {
  TYPE: string;
  PARENT: string;
  STATE: string;
  COMPLETED: string;
  FOCUS: string;
  NAME: string;
  TAGS: string;
  TIME: string;
  ENERGY: string;
  WAITINGFOR: string;
  STARTDATE: string;
  DUEDATE: string;
  NOTES: string;
}

export interface ImportMapping {
  inbox: number | null;
  nextActions: number | null;
  waiting: number | null;
  projects: number | null;
  somedayMaybe: number | null;
  contexts: number | null;
  areasOfFocus: number | null;
  reference: number | null;
  scheduled: number | null;
}

export interface TagMapping {
  [tagName: string]: 'contexts' | 'areasOfFocus';
}

export function useImportNirvana() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      data, 
      mapping,
      tagMappings,
      ignoreCompleted = false
    }: { 
      userId: string; 
      data: NirvanaRow[]; 
      mapping: ImportMapping;
      tagMappings: TagMapping;
      ignoreCompleted?: boolean;
    }) => {
      const store = await getOfflineStore(userId);
      const results = [];
      const startTime = Date.now();
      
      // Filter out completed items if ignoreCompleted is true
      const filteredData = ignoreCompleted 
        ? data.filter(row => !row.COMPLETED || row.COMPLETED.trim() === '')
        : data;
      
      console.log(`Starting import of ${filteredData.length} items (${data.length - filteredData.length} filtered out)`);
      
      // Check if there are items with status Logbook and if we're not ignoring completed items
      const hasLogbookItems = !ignoreCompleted && data.some(row => row.STATE === "Logbook");
      let logbookNodeId: number | null = null;
      
      // Create Logbook node if needed
      if (hasLogbookItems) {
        console.log("Creating Logbook list node...");
        
        // Find the root node (parent_node is null)
        const rootNode = (await store.nodes()).find(node => node.user_id === userId && node.parent_node === null);
        if (!rootNode) throw new Error("Could not find the root node for this user.");
        const rootNodeId = rootNode.id;
        
        // Create the Logbook node as a child of root
        const logbookNodeData: Tables<"node"> = {
            id: store.newId(),
            created_at: new Date().toISOString(),
            name: "Logbook",
            content: null,
            parent_node: rootNodeId,
            user_id: userId,
            metadata: {
              type: "list" as const,
            }
          };
        await store.upsertNode(logbookNodeData);
        
        logbookNodeId = logbookNodeData.id;
        results.push(logbookNodeData);
        console.log(`Created Logbook node with ID: ${logbookNodeId}`);
      }
      
      // Create a map to track created projects by name
      const projectIdMap = new Map<string, number>();
      
      // Collect all unique tags from the data
      const allTags = new Set<string>();
      filteredData.forEach(row => {
        if (row.TAGS) {
          const tags = row.TAGS.split(",").map(tag => tag.trim()).filter(tag => tag);
          tags.forEach(tag => allTags.add(tag));
        }
      });
      
      // Create tags as nodes under their specified parents
      const tagIdMap = new Map<string, number>();
      if (allTags.size > 0) {
        console.log(`Processing ${allTags.size} tags...`);
        
        // First, check for existing tags in both Contexts and Areas of Focus
        const parents = [mapping.contexts, mapping.areasOfFocus].filter((id): id is number => id !== null);
        const existingTags = (await store.nodes()).filter(tag =>
          tag.user_id === userId && tag.parent_node !== null && parents.includes(tag.parent_node) &&
          (tag.metadata as { type?: string } | null)?.type === "tag"
        );
        
        // Map existing tags by name
        existingTags.forEach(tag => {
          tagIdMap.set(tag.name, tag.id);
        });
        
        // Group tags by their parent type, excluding those that already exist
        const contextTags: string[] = [];
        const areaOfFocusTags: string[] = [];
        
        Array.from(allTags).forEach(tagName => {
          // Skip if tag already exists
          if (tagIdMap.has(tagName)) {
            console.log(`Tag "${tagName}" already exists, using existing one`);
            return;
          }
          
          if (tagMappings[tagName] === 'contexts') {
            contextTags.push(tagName);
          } else {
            areaOfFocusTags.push(tagName);
          }
        });
        
        // Create context tags
        if (contextTags.length > 0 && mapping.contexts) {
          console.log(`Creating ${contextTags.length} new context tags...`);
          const contextTagsToInsert: Tables<"node">[] = contextTags.map(tagName => ({
            id: store.newId(),
            created_at: new Date().toISOString(),
            name: tagName,
            content: null,
            parent_node: mapping.contexts!,
            user_id: userId,
            metadata: {
              type: "tag" as const,
            }
          }));
          
          await Promise.all(contextTagsToInsert.map(tag => store.upsertNode(tag)));
          {
            const contextTagsData = contextTagsToInsert;
            contextTagsData.forEach(tag => {
              tagIdMap.set(tag.name, tag.id);
            });
            results.push(...contextTagsData);
          }
        }
        
        // Create area of focus tags
        if (areaOfFocusTags.length > 0 && mapping.areasOfFocus) {
          console.log(`Creating ${areaOfFocusTags.length} new area of focus tags...`);
          const areaTagsToInsert: Tables<"node">[] = areaOfFocusTags.map(tagName => ({
            id: store.newId(),
            created_at: new Date().toISOString(),
            name: tagName,
            content: null,
            parent_node: mapping.areasOfFocus!,
            user_id: userId,
            metadata: {
              type: "tag" as const,
            }
          }));
          
          await Promise.all(areaTagsToInsert.map(tag => store.upsertNode(tag)));
          {
            const areaTagsData = areaTagsToInsert;
            areaTagsData.forEach(tag => {
              tagIdMap.set(tag.name, tag.id);
            });
            results.push(...areaTagsData);
          }
        }
      }
      

      
      // First pass: Create projects in batch
      const projectRows = filteredData.filter(row => row.TYPE === "Project" && row.PARENT === "Standalone");
      
      if (projectRows.length > 0) {
        console.log(`Creating ${projectRows.length} projects in batch...`);
        const projectsWithTags = projectRows
          .map(row => {
            const parentId = row.STATE === "Active" ? mapping.projects : 
                            row.STATE === "Someday" ? mapping.somedayMaybe : 
                            mapping.projects; // Default to projects
            
            if (!parentId) return null;
            
            const tags = row.TAGS ? row.TAGS.split(",").map(tag => tag.trim()).filter(tag => tag) : [];
            
            return {
              node: {
                id: store.newId(),
                created_at: new Date().toISOString(),
                name: row.NAME,
                content: row.NOTES || null,
                parent_node: parentId,
                user_id: userId,
                metadata: {
                  type: "loop" as const,
                  completed: !!(row.COMPLETED && row.COMPLETED.trim()),
                  focus: row.FOCUS?.toLowerCase() === "yes" ? true : undefined,
                }
              },
              tags: tags,
              originalName: row.NAME // Keep track for mapping
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (projectsWithTags.length > 0) {
          const projectsToInsert = projectsWithTags.map(item => item.node);
          
          await Promise.all(projectsToInsert.map(project => store.upsertNode(project)));
          {
            const projectsData = projectsToInsert;
            // Map project names to their IDs
            projectsData.forEach((project, index) => {
              const originalName = projectsWithTags[index].originalName;
              projectIdMap.set(originalName, project.id);
            });
            results.push(...projectsData);
            
            // Create relationships between projects and tags
            const relationshipsToInsert = [];
            for (let i = 0; i < projectsData.length; i++) {
              const project = projectsData[i];
              const projectWithTags = projectsWithTags[i];
              
              for (const tagName of projectWithTags.tags) {
                const tagId = tagIdMap.get(tagName);
                if (tagId) {
                  relationshipsToInsert.push({
                    id: store.newId(),
                    created_at: new Date().toISOString(),
                    node_id_1: project.id,
                    node_id_2: tagId,
                    relation_type: "tagged_with",
                    user_id: userId
                  });
                }
              }
            }
            
            if (relationshipsToInsert.length > 0) {
              console.log(`Creating ${relationshipsToInsert.length} project tag relationships...`);
              await Promise.all(relationshipsToInsert.map(relationship => store.upsertRelationship(relationship)));
            }
          }
        }
      }
      
      // Second pass: Create tasks in batch
      const taskRows = filteredData.filter(row => row.TYPE === "Task");
      
      if (taskRows.length > 0) {
        console.log(`Creating ${taskRows.length} tasks in batch...`);
        const tasksWithTags = taskRows
          .map(row => {
            let parentId: number | null = null;
            
            // Determine parent based on PARENT field
            if (row.PARENT === "Standalone") {
              // Map based on STATE
              switch (row.STATE) {
                case "Next":
                  parentId = mapping.nextActions;
                  break;
                case "Waiting":
                  parentId = mapping.waiting;
                  break;
                case "Someday":
                  parentId = mapping.somedayMaybe;
                  break;
                case "Scheduled":
                case "Scheduled/Repeating":
                  parentId = mapping.scheduled;
                  break;
                case "Logbook":
                  parentId = logbookNodeId || mapping.nextActions;
                  break;
                default:
                  parentId = mapping.inbox; // Default to inbox
              }
            } else {
              // Task belongs to a project
              parentId = projectIdMap.get(row.PARENT) || mapping.projects;
            }
            
            if (!parentId) return null;
            
            const tags = row.TAGS ? row.TAGS.split(",").map(tag => tag.trim()).filter(tag => tag) : [];
            
            // Prepare metadata for scheduled items
            const metadata: Metadata = {
              type: "loop" as const,
              completed: !!(row.COMPLETED && row.COMPLETED.trim()),
              energy: row.ENERGY || undefined,
              time: row.TIME || undefined,
              dueDate: row.DUEDATE || undefined,
              waitingFor: row.WAITINGFOR || undefined,
              focus: row.FOCUS?.toLowerCase() === "yes" ? true : undefined,
            };
            
            // Add scheduling information for scheduled items
            if (row.STATE === "Scheduled" || row.STATE === "Scheduled/Repeating") {
              if (row.STARTDATE) {
                metadata.scheduledDate = row.STARTDATE;
              }
              if (row.STATE === "Scheduled/Repeating") {
                metadata.isRepeating = true;
                // Note: Nirvana doesn't export detailed repeat pattern info,
                // so we just mark it as repeating
              }
            }
            
            return {
              node: {
                id: store.newId(),
                created_at: new Date().toISOString(),
                name: row.NAME,
                content: row.NOTES || null,
                parent_node: parentId,
                user_id: userId,
                metadata: metadata
              },
              tags: tags
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (tasksWithTags.length > 0) {
          const tasksToInsert = tasksWithTags.map(item => item.node);
          
          await Promise.all(tasksToInsert.map(task => store.upsertNode(task)));
          {
            const tasksData = tasksToInsert;
            results.push(...tasksData);
            
            // Create relationships between tasks and tags
            const relationshipsToInsert = [];
            for (let i = 0; i < tasksData.length; i++) {
              const task = tasksData[i];
              const taskWithTags = tasksWithTags[i];
              
              for (const tagName of taskWithTags.tags) {
                const tagId = tagIdMap.get(tagName);
                if (tagId) {
                  relationshipsToInsert.push({
                    id: store.newId(),
                    created_at: new Date().toISOString(),
                    node_id_1: task.id,
                    node_id_2: tagId,
                    relation_type: "tagged_with",
                    user_id: userId
                  });
                }
              }
            }
            
            if (relationshipsToInsert.length > 0) {
              console.log(`Creating ${relationshipsToInsert.length} tag relationships...`);
              await Promise.all(relationshipsToInsert.map(relationship => store.upsertRelationship(relationship)));
            }
          }
        }
      }
      
      const endTime = Date.now();
      console.log(`Import completed in ${endTime - startTime}ms. Created ${results.length} items.`);
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });
}

export function parseCsvData(csvText: string): NirvanaRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const data: NirvanaRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing - this could be improved for more complex CSV handling
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/^"|"$/g, '') || '';
      });
      data.push(row as unknown as NirvanaRow);
    }
  }
  
  return data;
}

export function extractUniqueTagsFromData(data: NirvanaRow[]): string[] {
  const allTags = new Set<string>();
  data.forEach(row => {
    if (row.TAGS) {
      const tags = row.TAGS.split(",").map(tag => tag.trim()).filter(tag => tag);
      tags.forEach(tag => allTags.add(tag));
    }
  });
  return Array.from(allTags).sort();
}

export function createDefaultTagMappings(tags: string[]): TagMapping {
  const tagMappings: TagMapping = {};
  tags.forEach(tag => {
    // Default all tags to contexts - user can change this
    tagMappings[tag] = 'contexts';
  });
  return tagMappings;
}
