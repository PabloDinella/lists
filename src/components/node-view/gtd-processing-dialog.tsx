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

interface GTDProcessingDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: (currentNodeId: number) => void;
}

export function GTDProcessingDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
}: GTDProcessingDialogProps) {
  const updateNodeMutation = useUpdateNode();
  const { data: settings } = useSettings(userId);

  const handleMarkComplete = () => {
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      metadata: {
        completed: true,
      },
    });
    handleProcessNext();
  };

  const handleMoveToNextActions = () => {
    if (!settings?.nextActions) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.nextActions,
    });
    handleProcessNext();
  };

  const handleMoveToWaiting = () => {
    if (!settings?.waiting) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.waiting,
    });
    handleProcessNext();
  };

  const handleMoveToSomedayMaybe = () => {
    if (!settings?.somedayMaybe) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.somedayMaybe,
    });
    handleProcessNext();
  };

  const handleMoveToProjects = () => {
    if (!settings?.projects) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.projects,
    });
    handleProcessNext();
  };

  const handleMoveToReference = () => {
    if (!settings?.reference) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.reference,
    });
    handleProcessNext();
  };

  const handleDelete = () => {
    // Mark as completed for now - could implement actual deletion if needed
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      metadata: {
        completed: true,
      },
    });
    handleProcessNext();
  };

  const handleProcessNext = () => {
    if (onProcessNext) {
      onProcessNext(node.id);
    } else {
      onClose();
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>GTD Processing: {node.name}</DialogTitle>
          <DialogDescription>
            Choose the appropriate action for this item based on the Getting Things Done methodology.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Actions Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleMarkComplete}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Do it now (2 min rule)</div>
                  <div className="text-xs text-muted-foreground">Complete this task immediately and mark as done</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Actionable Items Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Actionable Items
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleMoveToNextActions}
                disabled={!settings?.nextActions}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Next Actions</div>
                  <div className="text-xs text-muted-foreground">Single action I can do myself</div>
                </div>
              </Button>
              
              <Button
                onClick={handleMoveToWaiting}
                disabled={!settings?.waiting}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Waiting For</div>
                  <div className="text-xs text-muted-foreground">Delegated to someone else or waiting for response</div>
                </div>
              </Button>
              
              <Button
                onClick={handleMoveToProjects}
                disabled={!settings?.projects}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Projects</div>
                  <div className="text-xs text-muted-foreground">Multi-step outcome requiring several actions</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Non-Actionable Items Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Non-Actionable Items
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleMoveToSomedayMaybe}
                disabled={!settings?.somedayMaybe}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Someday/Maybe</div>
                  <div className="text-xs text-muted-foreground">Might want to do this in the future</div>
                </div>
              </Button>
              
              <Button
                onClick={handleMoveToReference}
                disabled={!settings?.reference}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Reference</div>
                  <div className="text-xs text-muted-foreground">Information I might need later</div>
                </div>
              </Button>
              
              <Button
                onClick={handleDelete}
                className="justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Delete</div>
                  <div className="text-xs text-muted-foreground">Not needed anymore</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Cancel Section */}
          <div className="pt-2 border-t">
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Cancel Processing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
