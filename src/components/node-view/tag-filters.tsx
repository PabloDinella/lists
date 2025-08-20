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
  onClick 
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
        className
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
      onFiltersChange(selectedFilters.filter(id => id !== tagId));
    } else {
      onFiltersChange([...selectedFilters, tagId]);
    }
  };

  const handleCategoryAllSelected = (categoryNode: TreeNode) => {
    // Get all tag IDs from this category
    const categoryTagIds = categoryNode.children.map(child => child.id);
    
    // Remove all tags from this category from the selected filters
    const filtersWithoutThisCategory = selectedFilters.filter(
      filterId => !categoryTagIds.includes(filterId)
    );
    
    onFiltersChange(filtersWithoutThisCategory);
  };

  const isCategoryAllSelected = (categoryNode: TreeNode) => {
    // Check if no tags from this category are selected
    const categoryTagIds = categoryNode.children.map(child => child.id);
    return !categoryTagIds.some(tagId => selectedFilters.includes(tagId));
  };

  return (
    <div className="space-y-4 mb-6">
      {tagNodes.map((categoryNode) => (
        <div key={categoryNode.id} className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            {categoryNode.name}
          </h4>
          <div className="flex flex-wrap gap-2">
            {/* All button for this category */}
            <Badge
              variant={isCategoryAllSelected(categoryNode) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => handleCategoryAllSelected(categoryNode)}
            >
              All
            </Badge>
            
            {categoryNode.children.map((tagNode) => {
              const isSelected = selectedFilters.includes(tagNode.id);
              return (
                <Badge
                  key={tagNode.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => handleTagToggle(tagNode.id)}
                >
                  {tagNode.name}
                  {isSelected && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
