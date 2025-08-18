import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { useListData, TreeNode } from "./node-view/use-list-data";
import { useImportNirvana, parseCsvData, NirvanaRow, ImportMapping } from "@/hooks/use-import";
import { supabase } from "@/lib/supabase";

const GTD_CATEGORIES = [
  { key: "inbox" as keyof ImportMapping, label: "Inbox", description: "New items from Nirvana's 'Inbox' or unprocessed tasks" },
  { key: "nextActions" as keyof ImportMapping, label: "Next Actions", description: "Tasks with state 'Next'" },
  { key: "projects" as keyof ImportMapping, label: "Projects", description: "Nirvana projects and project tasks" },
  { key: "somedayMaybe" as keyof ImportMapping, label: "Someday/Maybe", description: "Tasks with state 'Someday'" },
  { key: "contexts" as keyof ImportMapping, label: "Contexts", description: "Tasks organized by tags/contexts" },
  { key: "areasOfFocus" as keyof ImportMapping, label: "Areas of Focus", description: "Focus areas from Nirvana" },
  { key: "reference" as keyof ImportMapping, label: "Reference", description: "Completed tasks (Logbook)" },
];

export function ImportView() {
  const [userId, setUserId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<NirvanaRow[] | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({
    inbox: null,
    nextActions: null,
    projects: null,
    somedayMaybe: null,
    contexts: null,
    areasOfFocus: null,
    reference: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const { hierarchicalTree, isLoading: nodesLoading } = useListData({
    userId,
  });
  
  const importMutation = useImportNirvana();

  // Get all available nodes (flatten the tree) and filter for list or tagging types only
  const allNodes = React.useMemo(() => {
    const flatten = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node: TreeNode) => {
        return [...acc, node, ...flatten(node.children || [])];
      }, []);
    };
    const flattenedNodes = flatten(hierarchicalTree);
    return flattenedNodes.filter(node => 
      node.metadata?.type === "list" || node.metadata?.type === "tagging"
    );
  }, [hierarchicalTree]);

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

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const data = parseCsvData(text);
        setCsvData(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFile) {
      handleFileRead(csvFile);
    } else {
      alert("Please drop a CSV file.");
    }
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  const handleMappingChange = (category: keyof ImportMapping, nodeId: string) => {
    setMapping(prev => ({
      ...prev,
      [category]: nodeId === "" ? null : parseInt(nodeId, 10),
    }));
  };

  const handleImport = async () => {
    if (!userId || !csvData) return;
    
    // Check that at least some mappings are set
    const hasMapping = Object.values(mapping).some(value => value !== null);
    if (!hasMapping) {
      alert("Please map at least one category before importing.");
      return;
    }
    
    try {
      await importMutation.mutateAsync({
        userId,
        data: csvData,
        mapping,
      });
      
      alert("Import completed successfully!");
      setCsvData(null);
      setMapping({
        inbox: null,
        nextActions: null,
        projects: null,
        somedayMaybe: null,
        contexts: null,
        areasOfFocus: null,
        reference: null,
      });
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please try again.");
    }
  };

  const getPreviewStats = () => {
    if (!csvData) return null;
    
    const stats = {
      tasks: csvData.filter(row => row.TYPE === "Task").length,
      projects: csvData.filter(row => row.TYPE === "Project").length,
      nextActions: csvData.filter(row => row.TYPE === "Task" && row.STATE === "Next").length,
      someday: csvData.filter(row => row.TYPE === "Task" && row.STATE === "Someday").length,
      completed: csvData.filter(row => row.TYPE === "Task" && row.COMPLETED).length,
    };
    
    return stats;
  };

  if (!userId) {
    return (
      <AppLayout title="Import">
        <Container size="md">
          <p>Please sign in to import data.</p>
        </Container>
      </AppLayout>
    );
  }

  const stats = getPreviewStats();

  return (
    <AppLayout title="Import from Nirvana">
      <Container size="md">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Import from Nirvana</h1>
            <p className="text-muted-foreground">
              Import your tasks and projects from a Nirvana CSV export. 
              First upload your CSV file, then map the categories to your existing nodes.
            </p>
          </div>

          {/* File Upload Area */}
          {!csvData && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="space-y-4">
                <div className="text-muted-foreground">
                  <p className="text-lg">Drop your Nirvana CSV file here</p>
                  <p className="text-sm">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="csv-upload"
                />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            </div>
          )}

          {/* Preview and Mapping */}
          {csvData && (
            <div className="space-y-6">
              {/* Stats Preview */}
              {stats && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Import Preview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-lg">{stats.tasks}</div>
                      <div className="text-muted-foreground">Tasks</div>
                    </div>
                    <div>
                      <div className="font-medium text-lg">{stats.projects}</div>
                      <div className="text-muted-foreground">Projects</div>
                    </div>
                    <div>
                      <div className="font-medium text-lg">{stats.nextActions}</div>
                      <div className="text-muted-foreground">Next Actions</div>
                    </div>
                    <div>
                      <div className="font-medium text-lg">{stats.someday}</div>
                      <div className="text-muted-foreground">Someday</div>
                    </div>
                    <div>
                      <div className="font-medium text-lg">{stats.completed}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mapping Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4">Map Categories to Your Nodes</h3>
                {nodesLoading ? (
                  <p>Loading nodes...</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {GTD_CATEGORIES.map((category) => (
                      <div key={category.key} className="space-y-2">
                        <Label htmlFor={category.key} className="text-sm font-medium">
                          {category.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                        <Select
                          id={category.key}
                          value={mapping[category.key]?.toString() || ""}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                            handleMappingChange(category.key, e.target.value)
                          }
                        >
                          <option value="">Skip this category</option>
                          {allNodes.map((node) => (
                            <option key={node.id} value={node.id.toString()}>
                              {node.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || Object.values(mapping).every(v => v === null)}
                >
                  {importMutation.isPending ? "Importing..." : "Import Data"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvData(null);
                    setMapping({
                      inbox: null,
                      nextActions: null,
                      projects: null,
                      somedayMaybe: null,
                      contexts: null,
                      areasOfFocus: null,
                      reference: null,
                    });
                  }}
                  disabled={importMutation.isPending}
                >
                  Reset
                </Button>
              </div>

              {importMutation.isError && (
                <p className="text-sm text-red-600">
                  Import failed. Please check your mappings and try again.
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </AppLayout>
  );
}
