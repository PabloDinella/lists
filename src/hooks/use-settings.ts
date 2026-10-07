import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";
import type { Json } from "@/database.types";

export interface GTDSettings {
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

const defaultSettings: GTDSettings = {
  inbox: null,
  nextActions: null,
  waiting: null,
  projects: null,
  somedayMaybe: null,
  contexts: null,
  areasOfFocus: null,
  reference: null,
  scheduled: null,
};

export function useSettings(userId: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    getOfflineStore(userId).then((store) => {
      if (!disposed) {
        unsubscribe = store.subscribe(() => {
          queryClient.invalidateQueries({ queryKey: ["settings", userId] });
        });
      }
    }).catch(console.error);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const store = await getOfflineStore(userId);
      const row = (await store.settings())[0];
      return row?.settings ? row.settings as unknown as GTDSettings : defaultSettings;
    },
    enabled: !!userId,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: GTDSettings }) => {
      const store = await getOfflineStore(userId);
      const existing = (await store.settings())[0];
      const row = {
        id: existing?.id ?? store.newId(),
        created_at: existing?.created_at ?? new Date().toISOString(),
        user_id: userId,
        settings: settings as unknown as Json,
      };
      await store.upsertSettings(row);
      return row;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.userId] });
    },
  });
}
