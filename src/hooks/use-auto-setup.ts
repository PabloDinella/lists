import { useEffect, useRef } from "react";
import { getOfflineStore } from "@/lib/offline";
import { useNewUserSetup } from "./use-new-user-setup";

export function useAutoSetup(userId: string | null) {
  const newUserSetupMutation = useNewUserSetup();
  const mutateSetup = newUserSetupMutation.mutateAsync;
  const setupInitiatedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userId || setupInitiatedRef.current.has(userId)) return;
    let disposed = false;
    let inProgress = false;
    let unsubscribe = () => {};

    const checkAndSetupUser = async () => {
      if (disposed || inProgress || !userId || setupInitiatedRef.current.has(userId)) return;
      inProgress = true;
      try {
        const store = await getOfflineStore(userId);
        // Never mistake an empty, not-yet-synced cache for a new account.
        if (!store.status().initialSyncComplete) return;
        const rootExists = (await store.nodes()).some(node =>
          node.user_id === userId && (node.metadata as { type?: string } | null)?.type === "root"
        );
        if (!rootExists) await mutateSetup({ userId });
        setupInitiatedRef.current.add(userId);
      } catch (error) {
        console.error("Failed to check or set up user:", error);
      } finally {
        inProgress = false;
      }
    };

    void (async () => {
      try {
        const store = await getOfflineStore(userId);
        unsubscribe = store.subscribe(() => void checkAndSetupUser());
        await store.ready;
        await checkAndSetupUser();
      } catch (error) {
        console.error("Failed to initialize offline store for setup:", error);
      }
    })();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [userId, mutateSetup]);
}
