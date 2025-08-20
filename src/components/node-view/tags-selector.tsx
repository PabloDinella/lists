import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Label } from "../ui/label";
import { CategoryMultiSelect } from "./category-multi-select";
import { TreeNode } from "./use-list-data";

interface TagsSelectorProps {
  tagNodes: TreeNode[];
  selectedRelatedNodes: number[];
  onSelectionChange: (selectedNodes: number[]) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
  onCreateNewItem: (categoryId: number, itemName: string) => Promise<number>;
}

export function TagsSelector({
  tagNodes,
  selectedRelatedNodes,
  onSelectionChange,
  disabled = false,
  defaultExpanded = false,
  onCreateNewItem,
}: TagsSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Update expansion state when defaultExpanded changes
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  if (!tagNodes || tagNodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-base font-medium transition-colors hover:text-primary"
          disabled={disabled}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Label className="cursor-pointer">Tags</Label>
        </button>
      </div>

      {isExpanded && (
        <div>
          <CategoryMultiSelect
            firstLevelNodes={tagNodes}
            selectedRelatedNodes={selectedRelatedNodes}
            onSelectionChange={onSelectionChange}
            disabled={disabled}
            onCreateNewItem={onCreateNewItem}
          />
        </div>
      )}
    </div>
  );
}
