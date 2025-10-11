import { useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useSettings } from "@/hooks/use-settings";
import { TreeNode } from "./use-list-data";
import { QuestionNode, ActionNode } from "./flowchart-nodes";

const nodeTypes = {
  question: QuestionNode,
  action: ActionNode,
};

interface GTDFlowchartDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: (currentNodeId: number) => void;
}

export function GTDFlowchartDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
}: GTDFlowchartDialogProps) {
  const updateNodeMutation = useUpdateNode();
  const { data: settings } = useSettings(userId);

  const initialNodes: Node[] = [
    {
      id: "start",
      type: "question",
      position: { x: 300, y: 50 },
      data: {
        label: "Is this actionable?",
        description: "Does this require any action from you or others?",
      },
    },
    // Actionable path (left side)
    {
      id: "two-minute",
      type: "question",
      position: { x: 150, y: 180 },
      data: {
        label: "Less than 2 minutes?",
        description: "Can this be completed quickly?",
      },
    },
    {
      id: "do-now",
      type: "action",
      position: { x: 50, y: 320 },
      data: {
        label: "✅ Do it now",
        description: "Complete and mark as done",
        action: "complete",
      },
    },
    {
      id: "single-or-project",
      type: "question",
      position: { x: 250, y: 320 },
      data: {
        label: "Single action or project?",
        description: "One step or multiple steps?",
      },
    },
    {
      id: "projects",
      type: "action",
      position: { x: 350, y: 460 },
      data: {
        label: "📂 Projects",
        description: "Multi-step outcome",
        action: "projects",
        disabled: !settings?.projects,
      },
    },
    {
      id: "delegate-question",
      type: "question",
      position: { x: 150, y: 460 },
      data: {
        label: "Do yourself or delegate?",
        description: "Who should handle this?",
      },
    },
    {
      id: "next-actions",
      type: "action",
      position: { x: 50, y: 600 },
      data: {
        label: "⚡ Next Actions",
        description: "Single action I can do myself",
        action: "nextActions",
        disabled: !settings?.nextActions,
      },
    },
    {
      id: "waiting",
      type: "action",
      position: { x: 250, y: 600 },
      data: {
        label: "⏳ Waiting For",
        description: "Delegated or waiting for response",
        action: "waiting",
        disabled: !settings?.waiting,
      },
    },
    // Non-actionable path (right side)
    {
      id: "non-actionable",
      type: "question",
      position: { x: 500, y: 180 },
      data: {
        label: "What to do with it?",
        description: "How should this be handled?",
      },
    },
    {
      id: "reference",
      type: "action",
      position: { x: 400, y: 320 },
      data: {
        label: "📚 Reference",
        description: "Information for later",
        action: "reference",
        disabled: !settings?.reference,
      },
    },
    {
      id: "someday",
      type: "action",
      position: { x: 520, y: 320 },
      data: {
        label: "🔮 Someday/Maybe",
        description: "Might do in the future",
        action: "somedayMaybe",
        disabled: !settings?.somedayMaybe,
      },
    },
    {
      id: "delete",
      type: "action",
      position: { x: 640, y: 320 },
      data: {
        label: "🗑️ Delete",
        description: "Not needed anymore",
        action: "delete",
      },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: "start-two-minute",
      source: "start",
      target: "two-minute",
      label: "Yes",
      style: { stroke: "#10b981" },
    },
    {
      id: "start-non-actionable",
      source: "start",
      target: "non-actionable",
      label: "No",
      style: { stroke: "#ef4444" },
    },
    {
      id: "two-minute-do-now",
      source: "two-minute",
      target: "do-now",
      label: "Yes",
      style: { stroke: "#10b981" },
    },
    {
      id: "two-minute-single-or-project",
      source: "two-minute",
      target: "single-or-project",
      label: "No",
      style: { stroke: "#ef4444" },
    },
    {
      id: "single-or-project-delegate",
      source: "single-or-project",
      target: "delegate-question",
      label: "Single",
      style: { stroke: "#10b981" },
    },
    {
      id: "single-or-project-projects",
      source: "single-or-project",
      target: "projects",
      label: "Project",
      style: { stroke: "#f59e0b" },
    },
    {
      id: "delegate-next-actions",
      source: "delegate-question",
      target: "next-actions",
      label: "Myself",
      style: { stroke: "#10b981" },
    },
    {
      id: "delegate-waiting",
      source: "delegate-question",
      target: "waiting",
      label: "Delegate",
      style: { stroke: "#f59e0b" },
    },
    {
      id: "non-actionable-reference",
      source: "non-actionable",
      target: "reference",
      label: "Reference",
      style: { stroke: "#6366f1" },
    },
    {
      id: "non-actionable-someday",
      source: "non-actionable",
      target: "someday",
      label: "Someday",
      style: { stroke: "#8b5cf6" },
    },
    {
      id: "non-actionable-delete",
      source: "non-actionable",
      target: "delete",
      label: "Delete",
      style: { stroke: "#ef4444" },
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAction = useCallback(
    (action: string) => {
      const handleProcessNext = () => {
        if (onProcessNext) {
          onProcessNext(node.id);
        } else {
          onClose();
        }
      };

      switch (action) {
        case "complete":
          updateNodeMutation.mutate({
            nodeId: node.id,
            userId,
            metadata: { completed: true },
          });
          handleProcessNext();
          break;
        case "nextActions":
          if (settings?.nextActions) {
            updateNodeMutation.mutate({
              nodeId: node.id,
              userId,
              parentNode: settings.nextActions,
            });
            handleProcessNext();
          }
          break;
        case "waiting":
          if (settings?.waiting) {
            updateNodeMutation.mutate({
              nodeId: node.id,
              userId,
              parentNode: settings.waiting,
            });
            handleProcessNext();
          }
          break;
        case "projects":
          if (settings?.projects) {
            updateNodeMutation.mutate({
              nodeId: node.id,
              userId,
              parentNode: settings.projects,
            });
            handleProcessNext();
          }
          break;
        case "somedayMaybe":
          if (settings?.somedayMaybe) {
            updateNodeMutation.mutate({
              nodeId: node.id,
              userId,
              parentNode: settings.somedayMaybe,
            });
            handleProcessNext();
          }
          break;
        case "reference":
          if (settings?.reference) {
            updateNodeMutation.mutate({
              nodeId: node.id,
              userId,
              parentNode: settings.reference,
            });
            handleProcessNext();
          }
          break;
        case "delete":
          updateNodeMutation.mutate({
            nodeId: node.id,
            userId,
            metadata: { completed: true },
          });
          handleProcessNext();
          break;
      }
    },
    [node.id, userId, settings, updateNodeMutation, onProcessNext, onClose]
  );

  // Update nodes with the action handler
  const nodesWithHandler = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onAction: n.type === "action" ? () => handleAction(n.data.action) : undefined,
    },
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">GTD Processing: {node.name}</DialogTitle>
          <DialogDescription className="text-base">
            Follow the flowchart to process this item using the Getting Things Done methodology. 
            Click on any action button to move the item to that list.
          </DialogDescription>
        </DialogHeader>
        
        <div style={{ width: "100%", height: "600px" }} className="border rounded-lg bg-gray-50">
          <ReactFlow
            nodes={nodesWithHandler}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.5}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'question': return '#dbeafe';
                  case 'action': return '#d1fae5';
                  default: return '#e5e7eb';
                }
              }}
            />
          </ReactFlow>
        </div>
        
        <div className="text-sm text-muted-foreground text-center mt-2">
          💡 Tip: Use the controls to zoom and pan the diagram. Click any green action button to complete the processing.
        </div>
      </DialogContent>
    </Dialog>
  );
}