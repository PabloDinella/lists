import { MultiSelectAutocomplete, Option } from "../ui/multi-select-autocomplete";
import type { Json } from "@/database.types";

type TreeNode = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  metadata: Json | null;
  children: TreeNode[];
};

interface CategoryMultiSelectProps {
  firstLevelNodes: TreeNode[];
  selectedRelatedNodes: number[];
  onSelectionChange: (selected: number[]) => void;
  disabled?: boolean;
  onCreateNewItem?: (categoryId: number, itemName: string) => Promise<number>; // Returns the new item's ID
}

export function CategoryMultiSelect({
  firstLevelNodes,
  selectedRelatedNodes,
  onSelectionChange,
  disabled = false,
  onCreateNewItem,
}: CategoryMultiSelectProps) {
  const handleCategoryChange = async (firstLevelNodeId: number, newValues: (string | number)[]) => {
    // Convert to numbers, but handle string values that might be new items
    const processedValues: number[] = [];
    
    for (const value of newValues) {
      if (typeof value === 'number') {
        processedValues.push(value);
      } else if (typeof value === 'string') {
        // This is a new item that needs to be created
        if (onCreateNewItem) {
          try {
            const newItemId = await onCreateNewItem(firstLevelNodeId, value);
            processedValues.push(newItemId);
          } catch (error) {
            console.error('Failed to create new item:', error);
            // Skip this item if creation failed
          }
        }
      }
    }
    
    // Get options for this category to determine what should be removed
    const categoryOptions = (firstLevelNodes.find(n => n.id === firstLevelNodeId)?.children || []);
    
    // Remove old selections from this category and add new ones
    const otherCategorySelections = selectedRelatedNodes.filter(
      (nodeId) => !categoryOptions.some((option) => option.id === nodeId)
    );
    
    onSelectionChange([...otherCategorySelections, ...processedValues]);
  };

  return (
    <div className="space-y-4">
      {firstLevelNodes.map((firstLevelNode) => {
        // Convert children to options format
        const options: Option[] = (firstLevelNode.children || []).map((child) => ({
          id: child.id,
          label: child.name,
          value: child.id,
        }));

        // Get currently selected values for this category
        const categorySelectedValues = selectedRelatedNodes.filter((nodeId) =>
          options.some((option) => option.value === nodeId)
        );

        return (
          <div key={firstLevelNode.id} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {firstLevelNode.name}
            </label>
            <MultiSelectAutocomplete
              options={options}
              value={categorySelectedValues}
              onChange={(newValues) => handleCategoryChange(firstLevelNode.id, newValues)}
              placeholder={`Search ${firstLevelNode.name.toLowerCase()}...`}
              disabled={disabled}
              noOptionsText="No items found"
              freeSolo={!!onCreateNewItem} // Enable freeSolo only if we can create new items
            />
          </div>
        );
      })}
      
      <p className="text-xs text-muted-foreground">
        Select items from each category that are related to this task.
        {onCreateNewItem && " Type and press Enter to create new items."}
      </p>
    </div>
  );
}
