import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Button } from "../../ui/button";

interface ActionNodeData {
  label: string;
  description?: string;
  action: string;
  disabled?: boolean;
  onAction?: () => void;
}

interface ActionNodeProps {
  data: ActionNodeData;
}

export const ActionNode = memo(({ data }: ActionNodeProps) => {
  const handleClick = () => {
    if (!data.disabled && data.onAction) {
      data.onAction();
    }
  };

  return (
    <div className="action-node">
      <Handle type="target" position={Position.Top} />
      
      <Button
        onClick={handleClick}
        disabled={data.disabled}
        className="min-w-[140px] h-auto py-3 px-4 flex flex-col items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
        variant={data.disabled ? "outline" : "default"}
      >
        <div className="font-medium text-sm">
          {data.label}
        </div>
        
        {data.description && (
          <div className="text-xs opacity-80 text-center leading-tight">
            {data.description}
          </div>
        )}
      </Button>
    </div>
  );
});

ActionNode.displayName = "ActionNode";