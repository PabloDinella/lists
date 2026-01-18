import { useState } from "react";
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
import { TreeNode } from "./use-list-data";

interface EisenhowerMatrixDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void; // Callback to move to next item
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
  onNext,
}: EisenhowerMatrixDialogProps) {
  const [selectedQuadrant, setSelectedQuadrant] =
    useState<EisenhowerQuadrant | null>(
      (node.metadata?.eisenhowerQuadrant as EisenhowerQuadrant) || null
    );
  const [energy, setEnergy] = useState<string>(
    node.metadata?.energy || "medium"
  );
  const [time, setTime] = useState<string>(node.metadata?.time || "medium");

  const updateNodeMutation = useUpdateNode();

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

    // If onNext is provided, call it to move to the next item
    if (onNext) {
      onNext();
    } else {
      onClose();
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const quadrants = [
    {
      id: "urgent-important" as EisenhowerQuadrant,
      title: "Do First",
      description: "Urgent & Important",
      className: "bg-red-50 hover:bg-red-100 border-red-200",
    },
    {
      id: "not-urgent-important" as EisenhowerQuadrant,
      title: "Schedule",
      description: "Not Urgent & Important",
      className: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      id: "urgent-not-important" as EisenhowerQuadrant,
      title: "Delegate",
      description: "Urgent & Not Important",
      className: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
    },
    {
      id: "not-urgent-not-important" as EisenhowerQuadrant,
      title: "Eliminate",
      description: "Not Urgent & Not Important",
      className: "bg-gray-50 hover:bg-gray-100 border-gray-200",
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
                className={`p-6 rounded-lg border-2 transition-all ${quadrant.className} ${
                  selectedQuadrant === quadrant.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
              >
                <div className="text-left space-y-2">
                  <h3 className="font-semibold text-lg">{quadrant.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {quadrant.description}
                  </p>
                  {selectedQuadrant === quadrant.id && (
                    <p className="text-xs font-medium text-primary mt-2">
                      ✓ Selected
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleClassify} disabled={!selectedQuadrant}>
              Classify Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
