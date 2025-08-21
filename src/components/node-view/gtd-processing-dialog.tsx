import { useState } from "react";
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
}

type GTDStep = 'two-minute' | 'single-action' | 'yourself-or-delegate';

export function GTDProcessingDialog({
  node,
  userId,
  isOpen,
  onClose,
}: GTDProcessingDialogProps) {
  const [currentStep, setCurrentStep] = useState<GTDStep>('two-minute');
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
    onClose();
  };

  const handleMoveToNextActions = () => {
    if (!settings?.nextActions) return;
    
    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      parentNode: settings.nextActions,
    });
    onClose();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setCurrentStep('two-minute');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GTD Processing: {node.name}</DialogTitle>
          <DialogDescription>
            Let's process this item using the Getting Things Done methodology.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentStep === 'two-minute' && (
            <div className="space-y-4">
              <p className="text-sm">Is this item doable in less than 2 minutes?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleMarkComplete}
                  className="flex-1"
                >
                  Yes - Do it now and mark complete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('single-action')}
                  className="flex-1"
                >
                  No - Continue processing
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 'single-action' && (
            <div className="space-y-4">
              <p className="text-sm">Is this item a single action?</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentStep('yourself-or-delegate')}
                  className="flex-1"
                >
                  Yes - Single action
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Handle multi-step projects
                    onClose();
                  }}
                  className="flex-1"
                >
                  No - It's a project
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 'yourself-or-delegate' && (
            <div className="space-y-4">
              <p className="text-sm">Is this something you should do yourself, or delegate?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleMoveToNextActions}
                  className="flex-1"
                  disabled={!settings?.nextActions}
                >
                  Myself - Move to Next Actions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Handle delegation
                    onClose();
                  }}
                  className="flex-1"
                >
                  Delegate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
