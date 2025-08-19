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
      mapping 
    }: { 
      userId: string; 
      data: NirvanaRow[]; 
      mapping: ImportMapping;
    }) => {
      const results = [];
      
      // Create a map to track created projects by name
      const projectIdMap = new Map<string, number>();
      
      // First pass: Create projects
      for (const row of data) {
        if (row.TYPE === "Project" && row.PARENT === "Standalone") {
          const parentId = row.STATE === "Active" ? mapping.projects : 
                          row.STATE === "Someday" ? mapping.somedayMaybe : 
                          mapping.projects; // Default to projects
          
          if (parentId) {
            const { data: projectData, error } = await supabase
              .from("node")
              .insert({
                name: row.NAME,
                content: row.NOTES || null,
                parent_node: parentId,
                user_id: userId,
                metadata: {
                  type: "loop",
                  completed: !!row.COMPLETED,
                }
              })
              .select()
              .single();
            
            if (error) throw error;
            projectIdMap.set(row.NAME, projectData.id);
            results.push(projectData);
          }
        }
      }
      
      // Second pass: Create tasks
      for (const row of data) {
        if (row.TYPE === "Task") {
          let parentId: number | null = null;
          
          // Determine parent based on PARENT field
          if (row.PARENT === "Standalone") {
            // Map based on STATE
            switch (row.STATE) {
              case "Next":
                parentId = mapping.nextActions;
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
          
          if (parentId) {
            const tags = row.TAGS ? row.TAGS.split(",").map(tag => tag.trim()) : [];
            
            const { data: taskData, error } = await supabase
              .from("node")
              .insert({
                name: row.NAME,
                content: row.NOTES || null,
                parent_node: parentId,
                user_id: userId,
                metadata: {
                  type: "loop",
                  completed: !!row.COMPLETED,
                  tags: tags.length > 0 ? tags : undefined,
                  energy: row.ENERGY || undefined,
                  time: row.TIME || undefined,
                  dueDate: row.DUEDATE || undefined,
                }
              })
              .select()
              .single();
            
            if (error) throw error;
            results.push(taskData);
          }
        }
      }
      
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
