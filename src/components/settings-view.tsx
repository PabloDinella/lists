import React, { useState, useEffect } from "react";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { useSettings, useUpdateSettings, GTDSettings } from "@/hooks/use-settings";
import { useListData, TreeNode } from "./node-view/use-list-data";
import { supabase } from "@/lib/supabase";

const GTD_CATEGORIES = [
  { key: "inbox" as keyof GTDSettings, label: "Inbox", description: "Capture all items that need to be processed" },
  { key: "nextActions" as keyof GTDSettings, label: "Next Actions", description: "Tasks that can be done immediately" },
  { key: "projects" as keyof GTDSettings, label: "Projects", description: "Multi-step outcomes requiring more than one action" },
  { key: "somedayMaybe" as keyof GTDSettings, label: "Someday/Maybe", description: "Items you might want to do in the future" },
  { key: "contexts" as keyof GTDSettings, label: "Contexts", description: "Where or with what resources tasks can be done" },
  { key: "areasOfFocus" as keyof GTDSettings, label: "Areas of Focus", description: "Ongoing responsibilities and interests" },
  { key: "reference" as keyof GTDSettings, label: "Reference", description: "Information you might need to refer to later" },
];

export function SettingsView() {
  const [userId, setUserId] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<GTDSettings>({
    inbox: null,
    nextActions: null,
    projects: null,
    somedayMaybe: null,
    contexts: null,
    areasOfFocus: null,
    reference: null,
  });

  const { data: settings, isLoading: settingsLoading } = useSettings(userId);
  const updateSettingsMutation = useUpdateSettings();
  
  const { hierarchicalTree, isLoading: nodesLoading } = useListData({
    userId,
  });

  // Get all available nodes (flatten the tree) and filter for list or tagging types only
  const allNodes = React.useMemo(() => {
    const flatten = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node: TreeNode) => {
        return [...acc, node, ...flatten(node.children || [])];
      }, []);
    };
    const flattenedNodes = flatten(hierarchicalTree);
    // Only show nodes with metadata.type of "list" or "tagging"
    return flattenedNodes.filter(node => 
      node.metadata?.type === "list" || node.metadata?.type === "tagging"
    );
  }, [hierarchicalTree]);

  // Initialize local settings when data is loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSettingChange = (category: keyof GTDSettings, nodeId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: nodeId === "" ? null : parseInt(nodeId, 10),
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    
    try {
      await updateSettingsMutation.mutateAsync({
        userId,
        settings: localSettings,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings(settings);
    }
  };

  if (!userId) {
    return (
      <AppLayout title="Settings">
        <Container size="md">
          <p>Please sign in to access settings.</p>
        </Container>
      </AppLayout>
    );
  }

  const hasChanges = settings && JSON.stringify(settings) !== JSON.stringify(localSettings);

  return (
    <AppLayout title="GTD Settings">
      <Container size="md">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">GTD Configuration</h1>
            <p className="text-muted-foreground">
              Configure which nodes in your lists correspond to each GTD category.
              This helps organize your workflow according to the Getting Things Done methodology.
            </p>
          </div>

          {(settingsLoading || nodesLoading) && (
            <p>Loading settings...</p>
          )}

          {!settingsLoading && !nodesLoading && (
            <div className="space-y-6">
              {GTD_CATEGORIES.map((category) => (
                <div key={category.key} className="space-y-2">
                  <Label htmlFor={category.key} className="text-base font-medium">
                    {category.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <Select
                    id={category.key}
                    value={localSettings[category.key]?.toString() || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSettingChange(category.key, e.target.value)}
                  >
                    <option value="">Select a node...</option>
                    {allNodes.map((node) => (
                      <option key={node.id} value={node.id.toString()}>
                        {node.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Reset
                  </Button>
                )}
              </div>

              {updateSettingsMutation.isSuccess && (
                <p className="text-sm text-green-600">Settings saved successfully!</p>
              )}

              {updateSettingsMutation.isError && (
                <p className="text-sm text-red-600">
                  Failed to save settings. Please try again.
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </AppLayout>
  );
}
