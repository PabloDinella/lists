import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Json } from "@/database.types";

export interface GTDSettings {
  inbox: number | null;
  nextActions: number | null;
  projects: number | null;
  somedayMaybe: number | null;
  contexts: number | null;
  areasOfFocus: number | null;
  reference: number | null;
}

export function useSettings(userId: string | null) {
  return useQuery({
    queryKey: ["settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("settings")
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default settings if no settings exist
      if (!data) {
        return {
          inbox: null,
          nextActions: null,
          projects: null,
          somedayMaybe: null,
          contexts: null,
          areasOfFocus: null,
          reference: null,
        } as GTDSettings;
      }
      
      return data.settings as unknown as GTDSettings;
    },
    enabled: !!userId,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: GTDSettings }) => {
      const { data, error } = await supabase
        .from("settings")
        .upsert({
          user_id: userId,
          settings: settings as unknown as Json,
        }, {
          onConflict: "user_id"
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.userId] });
    },
  });
}
