import React from "react";
import { TreeNode } from "./use-list-data";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFiltersProps {
  tagNodes: TreeNode[];
  selectedFilters: number[];
  onFiltersChange: (filters: number[]) => void;
}

// Simple badge component since it doesn't exist in the UI library
function Badge({
  children,
  variant = "default",
  className,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors",
        variant === "default"
          ? "bg-primary text-primary-foreground"
          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

export function TagFilters({
  tagNodes,
  selectedFilters,
  onFiltersChange,
}: TagFiltersProps) {
  if (!tagNodes || tagNodes.length === 0) {
    return null;
  }

  const handleTagToggle = (tagId: number) => {
    if (selectedFilters.includes(tagId)) {
      onFiltersChange(selectedFilters.filter((id) => id !== tagId));
    } else {
      onFiltersChange([...selectedFilters, tagId]);
    }
  };

  return (
    <div className="space-y-3 py-4">
      {tagNodes.map((categoryNode) => {
        const categoryTagIds = categoryNode.children.map((child) => child.id);

        return (
          <div
            key={categoryNode.id}
            className="flex flex-wrap items-center gap-2"
          >
            {/* Category name label */}
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {categoryNode.name}:
            </span>

            {/* Category "All" button */}
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors",
                categoryTagIds.every(
                  (tagId) => !selectedFilters.includes(tagId),
                )
                  ? "border-muted-foreground/20 bg-muted text-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => {
                // Remove all tags from this category from the selected filters
                const filtersWithoutThisCategory = selectedFilters.filter(
                  (filterId) => !categoryTagIds.includes(filterId),
                );
                onFiltersChange(filtersWithoutThisCategory);
              }}
            >
              All
            </Badge>

            {/* Individual tag chips */}
            {categoryNode.children.map((tagNode) => {
              const isSelected = selectedFilters.includes(tagNode.id);
              return (
                <Badge
                  key={tagNode.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "border-muted-foreground/20 bg-muted text-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => handleTagToggle(tagNode.id)}
                >
                  {tagNode.name}
                  {isSelected && <X className="ml-1 h-3 w-3" />}
                </Badge>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
