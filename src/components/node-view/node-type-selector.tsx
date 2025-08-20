import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, List, Tag, Hash, RotateCcw } from "lucide-react";
import { Label } from "../ui/label";

interface NodeTypeSelectorProps {
  nodeType: "list" | "tagging" | "tag" | "loop";
  onNodeTypeChange: (type: "list" | "tagging" | "tag" | "loop") => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

export function NodeTypeSelector({
  nodeType,
  onNodeTypeChange,
  disabled = false,
  defaultExpanded = false,
}: NodeTypeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Update expansion state when defaultExpanded changes
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
          disabled={disabled}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Label className="cursor-pointer">Advanced</Label>
        </button>
      </div>
      
      {isExpanded && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            What's the purpose of this item
          </p>
          <div className="grid gap-3">
            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                nodeType === "list"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onNodeTypeChange("list")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-md p-2 ${
                    nodeType === "list"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <List className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium">List</h4>
                  <p className="text-xs text-muted-foreground">
                    Lists are intended to be used for organizing your items,
                    tasks, projects, etc.
                  </p>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    nodeType === "list"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {nodeType === "list" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                nodeType === "tagging"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onNodeTypeChange("tagging")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-md p-2 ${
                    nodeType === "tagging"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium">Tagging</h4>
                  <p className="text-xs text-muted-foreground">
                    Tagging is for items that can be attached to List's
                    items, like Context and Area of Focus.
                  </p>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    nodeType === "tagging"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {nodeType === "tagging" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                nodeType === "tag"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onNodeTypeChange("tag")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-md p-2 ${
                    nodeType === "tag"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Hash className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium">Tag</h4>
                  <p className="text-xs text-muted-foreground">
                    Individual tags that can be applied to items for categorization and filtering.
                  </p>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    nodeType === "tag"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {nodeType === "tag" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                nodeType === "loop"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onNodeTypeChange("loop")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-md p-2 ${
                    nodeType === "loop"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium">Loop</h4>
                  <p className="text-xs text-muted-foreground">
                    Things that have captured your attention but need clarification or action, and is kept in your lists until resolved.
                  </p>
                </div>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    nodeType === "loop"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {nodeType === "loop" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
