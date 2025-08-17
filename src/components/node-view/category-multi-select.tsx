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
}

export function CategoryMultiSelect({
  firstLevelNodes,
  selectedRelatedNodes,
  onSelectionChange,
  disabled = false,
}: CategoryMultiSelectProps) {
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

        const handleCategoryChange = (newValues: (string | number)[]) => {
          // Convert to numbers
          const newNumberValues = newValues.map((v) => Number(v));
          
          // Remove old selections from this category and add new ones
          const otherCategorySelections = selectedRelatedNodes.filter(
            (nodeId) => !options.some((option) => option.value === nodeId)
          );
          
          onSelectionChange([...otherCategorySelections, ...newNumberValues]);
        };

        return (
          <div key={firstLevelNode.id} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {firstLevelNode.name}
            </label>
            <MultiSelectAutocomplete
              options={options}
              value={categorySelectedValues}
              onChange={handleCategoryChange}
              placeholder={`Search ${firstLevelNode.name.toLowerCase()}...`}
              disabled={disabled}
              noOptionsText="No items found"
              freeSolo={false} // Disable freeSolo since we want to select from existing items only
            />
          </div>
        );
      })}
      
      <p className="text-xs text-muted-foreground">
        Select items from each category that are related to this task.
      </p>
    </div>
  );
}
