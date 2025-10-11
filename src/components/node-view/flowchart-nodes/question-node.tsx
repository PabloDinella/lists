import { memo } from "react";
import { Handle, Position } from "reactflow";

interface QuestionNodeData {
  label: string;
  description?: string;
}

interface QuestionNodeProps {
  data: QuestionNodeData;
}

export const QuestionNode = memo(({ data }: QuestionNodeProps) => {
  return (
    <div className="question-node bg-blue-50 border-2 border-blue-300 rounded-lg p-3 min-w-[160px] text-center shadow-md">
      <Handle type="target" position={Position.Top} />
      
      <div className="font-semibold text-blue-900 text-sm mb-1">
        {data.label}
      </div>
      
      {data.description && (
        <div className="text-xs text-blue-700 opacity-80">
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

QuestionNode.displayName = "QuestionNode";