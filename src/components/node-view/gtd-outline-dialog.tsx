import { Button } from "../ui/button";
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
import { Separator } from "../ui/separator";

interface GTDOutlineDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: (currentNodeId: number) => void;
}

export function GTDOutlineDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
}: GTDOutlineDialogProps) {
  const updateNodeMutation = useUpdateNode();
  const { data: settings } = useSettings(userId);

  const handleProcessNext = () => {
    if (onProcessNext) {
      onProcessNext(node.id);
    } else {
      onClose();
    }
  };

  const handleAction = (action: string, targetListId?: number | null) => {
    switch (action) {
      case "complete":
        updateNodeMutation.mutate({
          nodeId: node.id,
          userId,
          metadata: { completed: true },
        });
        break;
      case "delete":
        updateNodeMutation.mutate({
          nodeId: node.id,
          userId,
          metadata: { completed: true },
        });
        break;
      default:
        if (targetListId) {
          updateNodeMutation.mutate({
            nodeId: node.id,
            userId,
            parentNode: targetListId,
          });
        }
        break;
    }
    handleProcessNext();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>GTD Processing: {node.name}</DialogTitle>
          <DialogDescription>
            Choose the appropriate action based on the Getting Things Done methodology.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <h3 className="font-semibold text-green-700">Can you do it in 2 minutes?</h3>
            </div>
            <div className="ml-8">
              <Button
                onClick={() => handleAction("complete")}
                className="w-full justify-start"
                variant="outline"
              >
                ✅ Yes - Do it now and mark complete
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actionable Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <h3 className="font-semibold text-blue-700">If it takes longer, what type of action is it?</h3>
            </div>
            <div className="ml-8 space-y-2">
              <Button
                onClick={() => handleAction("move", settings?.nextActions)}
                disabled={!settings?.nextActions}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">⚡ Single action (myself)</div>
                  <div className="text-xs text-muted-foreground">Move to Next Actions</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleAction("move", settings?.waiting)}
                disabled={!settings?.waiting}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">⏳ Single action (delegate)</div>
                  <div className="text-xs text-muted-foreground">Move to Waiting For</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleAction("move", settings?.projects)}
                disabled={!settings?.projects}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">📂 Multi-step project</div>
                  <div className="text-xs text-muted-foreground">Move to Projects</div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Non-Actionable Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <h3 className="font-semibold text-purple-700">Or is it not actionable right now?</h3>
            </div>
            <div className="ml-8 space-y-2">
              <Button
                onClick={() => handleAction("move", settings?.somedayMaybe)}
                disabled={!settings?.somedayMaybe}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">🔮 Might do someday</div>
                  <div className="text-xs text-muted-foreground">Move to Someday/Maybe</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleAction("move", settings?.reference)}
                disabled={!settings?.reference}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">📚 Keep for reference</div>
                  <div className="text-xs text-muted-foreground">Move to Reference</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleAction("delete")}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">🗑️ Not needed</div>
                  <div className="text-xs text-muted-foreground">Delete this item</div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Cancel */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-muted-foreground"
            >
              Cancel Processing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}