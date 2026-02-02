import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useSettings } from "@/hooks/use-settings";
import { TreeNode } from "./use-list-data";
import { Info, Check } from "lucide-react";

interface EisenhowerMatrixDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: () => void;
}

type EisenhowerQuadrant =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important";

export function EisenhowerMatrixDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
}: EisenhowerMatrixDialogProps) {
  const [selectedQuadrant, setSelectedQuadrant] =
    useState<EisenhowerQuadrant | null>(
      (node.metadata?.eisenhowerQuadrant as EisenhowerQuadrant) || null,
    );
  const [energy, setEnergy] = useState<string>(
    node.metadata?.energy || "medium",
  );
  const [time, setTime] = useState<string>(node.metadata?.time || "medium");
  const [movedToSomedayMaybe, setMovedToSomedayMaybe] = useState(false);

  const updateNodeMutation = useUpdateNode();
  const { data: settings } = useSettings(userId);

  // Reset the moved state when the node changes
  useEffect(() => {
    setMovedToSomedayMaybe(false);
  }, [node.id]);

  const handleClassify = () => {
    if (!selectedQuadrant) return;

    updateNodeMutation.mutate({
      nodeId: node.id,
      userId,
      metadata: {
        eisenhowerQuadrant: selectedQuadrant,
        energy,
        time,
      },
    });

    handleProcessNext();
  };

  const handleMoveToSomedayMaybe = async () => {
    if (!settings?.somedayMaybe) return;

    try {
      await updateNodeMutation.mutateAsync({
        nodeId: node.id,
        userId,
        parentNode: settings.somedayMaybe,
        metadata: {
          eisenhowerQuadrant: selectedQuadrant || undefined,
          energy,
          time,
        },
      });

      // Mark as moved successfully
      setMovedToSomedayMaybe(true);
    } catch (error) {
      console.error("Failed to move to Someday/Maybe:", error);
    }

    // Don't close the dialog - let the user decide when to close
  };

  const handleProcessNext = () => {
    if (onProcessNext) {
      onProcessNext();
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    handleProcessNext();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const quadrants = [
    {
      id: "urgent-important" as EisenhowerQuadrant,
      title: "Focus Now",
      description: "Urgent & Important",
      className:
        "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800",
      textClassName: "text-red-900 dark:text-red-100",
      descClassName: "text-red-700 dark:text-red-300",
    },
    {
      id: "not-urgent-important" as EisenhowerQuadrant,
      title: "Plan",
      description: "Not Urgent & Important",
      className:
        "bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800",
      textClassName: "text-blue-900 dark:text-blue-100",
      descClassName: "text-blue-700 dark:text-blue-300",
    },
    {
      id: "urgent-not-important" as EisenhowerQuadrant,
      title: "Quick Win",
      description: "Urgent & Not Important",
      className:
        "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:border-yellow-800",
      textClassName: "text-yellow-900 dark:text-yellow-100",
      descClassName: "text-yellow-700 dark:text-yellow-300",
    },
    {
      id: "not-urgent-not-important" as EisenhowerQuadrant,
      title: "Later",
      description: "Not Urgent & Not Important",
      className:
        "bg-gray-100 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600",
      textClassName: "text-gray-900 dark:text-gray-100",
      descClassName: "text-gray-700 dark:text-gray-300",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Eisenhower Matrix: {node.name}</DialogTitle>
          <DialogDescription>
            Classify this item by urgency and importance to prioritize your
            work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-4">
            {quadrants.map((quadrant) => (
              <button
                key={quadrant.id}
                onClick={() => setSelectedQuadrant(quadrant.id)}
                className={`rounded-lg border-2 p-6 transition-all ${quadrant.className} ${
                  selectedQuadrant === quadrant.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
              >
                <div className="space-y-2 text-left">
                  <h3
                    className={`text-lg font-semibold ${quadrant.textClassName}`}
                  >
                    {quadrant.title}
                  </h3>
                  <p
                    className={`text-sm font-medium ${quadrant.descClassName}`}
                  >
                    {quadrant.description}
                  </p>
                  {selectedQuadrant === quadrant.id && (
                    <p
                      className={`mt-2 text-xs font-semibold ${quadrant.textClassName}`}
                    >
                      ✓ Selected
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Someday/Maybe Suggestion (shown when "Later" is selected) */}
          {selectedQuadrant === "not-urgent-not-important" &&
            settings?.somedayMaybe && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Consider moving to Someday/Maybe
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        This item is not urgent or important right now. Would
                        you like to move it to your Someday/Maybe list?
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMoveToSomedayMaybe}
                      disabled={
                        updateNodeMutation.isPending || movedToSomedayMaybe
                      }
                      className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                    >
                      {updateNodeMutation.isPending ? (
                        "Moving..."
                      ) : movedToSomedayMaybe ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Moved to Someday/Maybe list
                        </>
                      ) : (
                        "Move to Someday/Maybe"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Energy Level */}
          <div className="space-y-2">
            <Label>Energy Required</Label>
            <RadioGroup value={energy} onValueChange={setEnergy}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="energy-low" />
                  <Label htmlFor="energy-low" className="cursor-pointer">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="energy-medium" />
                  <Label htmlFor="energy-medium" className="cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="energy-high" />
                  <Label htmlFor="energy-high" className="cursor-pointer">
                    High
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Time Required */}
          <div className="space-y-2">
            <Label>Time Required</Label>
            <RadioGroup value={time} onValueChange={setTime}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short" id="time-short" />
                  <Label htmlFor="time-short" className="cursor-pointer">
                    Short (&lt; 30 min)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="time-medium" />
                  <Label htmlFor="time-medium" className="cursor-pointer">
                    Medium (30 min - 2 hrs)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="long" id="time-long" />
                  <Label htmlFor="time-long" className="cursor-pointer">
                    Long (&gt; 2 hrs)
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <div>
              {onProcessNext && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDialogChange(false)}
              >
                {onProcessNext ? "Cancel Processing" : "Cancel"}
              </Button>
              <Button onClick={handleClassify} disabled={!selectedQuadrant}>
                {onProcessNext ? "Classify & Next" : "Classify Item"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
