import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
}

export function useImportNirvana() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      data, 
      mapping,
      ignoreCompleted = false
    }: { 
      userId: string; 
      data: NirvanaRow[]; 
      mapping: ImportMapping;
      ignoreCompleted?: boolean;
    }) => {
      const results = [];
      const startTime = Date.now();
      
      // Filter out completed items if ignoreCompleted is true
      const filteredData = ignoreCompleted 
        ? data.filter(row => !row.COMPLETED || row.COMPLETED.toLowerCase() !== 'true')
        : data;
      
      console.log(`Starting import of ${filteredData.length} items (${data.length - filteredData.length} filtered out)`);
      
      // Create a map to track created projects by name
      const projectIdMap = new Map<string, number>();
      

      
      // First pass: Create projects in batch
      const projectRows = filteredData.filter(row => row.TYPE === "Project" && row.PARENT === "Standalone");
      
      if (projectRows.length > 0) {
        console.log(`Creating ${projectRows.length} projects in batch...`);
        const projectsToInsert = projectRows
          .map(row => {
            const parentId = row.STATE === "Active" ? mapping.projects : 
                            row.STATE === "Someday" ? mapping.somedayMaybe : 
                            mapping.projects; // Default to projects
            
            if (!parentId) return null;
            
            return {
              name: row.NAME,
              content: row.NOTES || null,
              parent_node: parentId,
              user_id: userId,
              metadata: {
                type: "loop" as const,
                completed: !!row.COMPLETED,
              }
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (projectsToInsert.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from("node")
            .insert(projectsToInsert)
            .select();
          
          if (projectsError) throw projectsError;
          
          if (projectsData) {
            // Map project names to their IDs
            projectsData.forEach(project => {
              const originalRow = projectRows.find(row => 
                row.NAME === project.name && 
                (row.NOTES || null) === project.content
              );
              if (originalRow) {
                projectIdMap.set(originalRow.NAME, project.id);
              }
            });
            results.push(...projectsData);
          }
        }
      }
      
      // Second pass: Create tasks in batch
      const taskRows = filteredData.filter(row => row.TYPE === "Task");
      
      if (taskRows.length > 0) {
        console.log(`Creating ${taskRows.length} tasks in batch...`);
        const tasksToInsert = taskRows
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
                case "Logbook":
                  parentId = mapping.nextActions;
                  break;
                default:
                  parentId = mapping.inbox; // Default to inbox
              }
            } else {
              // Task belongs to a project
              parentId = projectIdMap.get(row.PARENT) || mapping.projects;
            }
            
            if (!parentId) return null;
            
            const tags = row.TAGS ? row.TAGS.split(",").map(tag => tag.trim()) : [];
            
            return {
              name: row.NAME,
              content: row.NOTES || null,
              parent_node: parentId,
              user_id: userId,
              metadata: {
                type: "loop" as const,
                completed: !!row.COMPLETED,
                tags: tags.length > 0 ? tags : undefined,
                energy: row.ENERGY || undefined,
                time: row.TIME || undefined,
                dueDate: row.DUEDATE || undefined,
                waitingFor: row.WAITINGFOR || undefined,
              }
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (tasksToInsert.length > 0) {
          const { data: tasksData, error: tasksError } = await supabase
            .from("node")
            .insert(tasksToInsert)
            .select();
          
          if (tasksError) throw tasksError;
          
          if (tasksData) {
            results.push(...tasksData);
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
