import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { TreeNode } from "./use-list-data";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  node: TreeNode | null;
  isDeleting?: boolean;
}

// Helper function to collect all descendants recursively
function getAllDescendants(node: TreeNode): TreeNode[] {
  const descendants: TreeNode[] = [];
  
  function collectDescendants(currentNode: TreeNode) {
    for (const child of currentNode.children) {
      descendants.push(child);
      collectDescendants(child);
    }
  }
  
  collectDescendants(node);
  return descendants;
}

// Helper function to collect all unique related nodes from a node and its descendants
function getAllRelatedNodes(node: TreeNode, descendants: TreeNode[]): { id: number; name: string }[] {
  const allNodes = [node, ...descendants];
  const relatedNodesMap = new Map<number, string>();
  
  for (const currentNode of allNodes) {
    for (const relatedNode of currentNode.related_nodes) {
      relatedNodesMap.set(relatedNode.id, relatedNode.name);
    }
  }
  
  return Array.from(relatedNodesMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
}

// Helper function to collect all impact data in one pass
function getDeleteImpact(node: TreeNode) {
  const descendants = getAllDescendants(node);
  const relatedNodes = getAllRelatedNodes(node, descendants);
  
  return {
    descendants,
    relatedNodes,
    hasChildren: descendants.length > 0,
    hasRelatedNodes: relatedNodes.length > 0,
    totalAffectedNodes: 1 + descendants.length,
  };
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  node,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isDeleting]);

  if (!node) return null;

  const { descendants, relatedNodes, hasChildren, hasRelatedNodes, totalAffectedNodes } = getDeleteImpact(node);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete "{node.name}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <h4 className="font-medium text-sm mb-2">What will be deleted:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                • The selected item: <span className="font-medium text-foreground">"{node.name}"</span>
                {node.metadata?.type && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded">
                    {node.metadata.type}
                  </span>
                )}
              </li>
              {hasChildren && (
                <li>• {descendants.length} child item{descendants.length === 1 ? '' : 's'}</li>
              )}
              {hasRelatedNodes && (
                <li>• Relationships with {relatedNodes.length} tagged item{relatedNodes.length === 1 ? '' : 's'}</li>
              )}
            </ul>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-sm font-medium text-destructive">
                Total items to be deleted: {totalAffectedNodes}
              </p>
            </div>
          </div>

          {/* Children Details */}
          {hasChildren && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Child items that will be deleted:</h4>
              <div className="max-h-32 overflow-y-auto rounded border p-2 bg-background">
                <ul className="space-y-1">
                  {descendants.map((descendant) => (
                    <li key={descendant.id} className="text-sm text-muted-foreground">
                      • {descendant.name}
                      {descendant.metadata?.type && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-2">
                          {descendant.metadata.type}
                        </span>
                      )}
                      {descendant.content && (
                        <span className="text-xs text-muted-foreground/70 block ml-3 mt-0.5">
                          {descendant.content.substring(0, 60)}
                          {descendant.content.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Related Nodes Details */}
          {hasRelatedNodes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Tagged items that will lose their relationships:</h4>
              <div className="max-h-24 overflow-y-auto rounded border p-2 bg-background">
                <ul className="space-y-1">
                  {relatedNodes.map((relatedNode) => (
                    <li key={relatedNode.id} className="text-sm text-muted-foreground">
                      • {relatedNode.name}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: The tagged items themselves won't be deleted, only their relationships.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : `Delete ${totalAffectedNodes} item${totalAffectedNodes === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
