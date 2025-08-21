import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useNewUserSetup } from "./use-new-user-setup";

export function useAutoSetup(userId: string | null) {
  const newUserSetupMutation = useNewUserSetup();
  const setupInitiatedRef = useRef(new Set<string>());

  useEffect(() => {
    const checkAndSetupUser = async () => {
      if (!userId || setupInitiatedRef.current.has(userId)) {
        return;
      }

      try {
        // Check if user has any nodes with metadata.type == 'root'
        const { data: rootNodes } = await supabase
          .from("node")
          .select("id")
          .eq("user_id", userId)
          .eq("metadata->>type", "root")
          .limit(1);

        // If no root nodes exist, set up the user
        if (!rootNodes || rootNodes.length === 0) {
          setupInitiatedRef.current.add(userId);
          await newUserSetupMutation.mutateAsync({ userId });
        }
      } catch (error) {
        console.error("Failed to check or set up user:", error);
        // Remove from initiated set on error so we can retry
        setupInitiatedRef.current.delete(userId);
      }
    };

    checkAndSetupUser();
  }, [userId, newUserSetupMutation]);
}
