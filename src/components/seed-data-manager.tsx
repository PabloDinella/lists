import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSeedData } from "@/hooks/use-seed-data";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, CheckCircle, Database, Trash2 } from "lucide-react";

export function SeedDataManager() {
  const { user } = useAuth();
  const { createSeed, clearData, isCreating, isClearing } = useSeedData();
  const [lastAction, setLastAction] = useState<"create" | "clear" | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateSeed = async () => {
    if (!user?.id) return;

    try {
      await createSeed.mutateAsync({ userId: user.id });
      setLastAction("create");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to create seed data:", error);
    }
  };

  const handleClearData = async () => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear ALL your data? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await clearData.mutateAsync({ userId: user.id });
      setLastAction("clear");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to clear user data:", error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 border rounded-lg">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Seed Data Manager</h2>
          <p className="text-muted-foreground">Please sign in to manage seed data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Seed Data Manager</h2>
        </div>
        <p className="text-muted-foreground">
          Populate your workspace with sample GTD data or clear existing data for testing
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-800">
            {lastAction === "create" 
              ? "Seed data created successfully! Your workspace now contains sample tasks, projects, and references."
              : "All user data cleared successfully."
            }
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-4">
        {/* Create Seed Data */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Create Sample Data</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Populates your workspace with realistic GTD structure including:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Tasks", "Projects", "Contexts", "Areas of Focus", "Reference Materials"].map((item) => (
                  <span key={item} className="px-2 py-1 bg-slate-200 text-slate-800 text-xs rounded border border-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleCreateSeed}
              disabled={isCreating || isClearing}
              className="ml-4 flex-shrink-0"
            >
              {isCreating ? "Creating..." : "Create Seed Data"}
            </Button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="p-4 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-red-700 mb-1">Clear All Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Removes all your nodes, relationships, and settings. Use for testing only.
              </p>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">This action cannot be undone</span>
              </div>
            </div>
            <Button 
              variant="destructive"
              onClick={handleClearData}
              disabled={isCreating || isClearing}
              className="ml-4 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? "Clearing..." : "Clear Data"}
            </Button>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <strong className="text-yellow-800">Development Tool:</strong>
          <span className="text-yellow-700"> This component is intended for development and testing purposes. Remove it from production builds.</span>
        </div>
      </div>
    </div>
  );
}
