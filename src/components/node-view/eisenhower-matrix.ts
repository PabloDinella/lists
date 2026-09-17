export type EisenhowerQuadrant =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important";

export interface EisenhowerQuadrantConfig {
  id: EisenhowerQuadrant;
  title: string;
  description: string;
  className: string;
  textClassName: string;
  descClassName: string;
}

export const EISENHOWER_QUADRANTS: EisenhowerQuadrantConfig[] = [
  {
    id: "urgent-important",
    title: "Focus Now",
    description: "Urgent & Important",
    className:
      "bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800",
    textClassName: "text-red-900 dark:text-red-100",
    descClassName: "text-red-700 dark:text-red-300",
  },
  {
    id: "not-urgent-important",
    title: "Plan",
    description: "Not Urgent & Important",
    className:
      "bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800",
    textClassName: "text-blue-900 dark:text-blue-100",
    descClassName: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "urgent-not-important",
    title: "Quick Win",
    description: "Urgent & Not Important",
    className:
      "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:border-yellow-800",
    textClassName: "text-yellow-900 dark:text-yellow-100",
    descClassName: "text-yellow-700 dark:text-yellow-300",
  },
  {
    id: "not-urgent-not-important",
    title: "Later",
    description: "Not Urgent & Not Important",
    className:
      "bg-gray-100 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600",
    textClassName: "text-gray-900 dark:text-gray-100",
    descClassName: "text-gray-700 dark:text-gray-300",
  },
];

export const getEisenhowerQuadrantConfig = (
  quadrant?: string,
): EisenhowerQuadrantConfig | undefined =>
  EISENHOWER_QUADRANTS.find((q) => q.id === quadrant);

export const TIME_LABELS: Record<string, string> = {
  short: "Short (< 30 min)",
  medium: "Medium (30 min - 2 hrs)",
  long: "Long (> 2 hrs)",
};

export const ENERGY_LABELS: Record<string, string> = {
  low: "Low energy",
  medium: "Medium energy",
  high: "High energy",
};

interface PriorityMetadata {
  eisenhowerQuadrant?: string;
  time?: string;
  energy?: string;
}

// Combined priority on a 1-4 scale: quadrant rank, bumped for short time and
// low energy (quick wins first), docked for long time and high energy.
// Returns null when the item is unclassified.
export const getEisenhowerPriorityScore = (
  metadata?: PriorityMetadata | null,
): number | null => {
  if (!metadata?.eisenhowerQuadrant) return null;

  let base = 0;
  switch (metadata.eisenhowerQuadrant) {
    case "urgent-important":
      base = 3;
      break;
    case "not-urgent-important":
      base = 2;
      break;
    case "urgent-not-important":
      base = 1;
      break;
    default:
      base = 0;
  }

  if (metadata.time === "short") base += 1;
  else if (metadata.time === "long") base -= 1;

  if (metadata.energy === "low") base += 1;
  else if (metadata.energy === "high") base -= 1;

  return Math.min(4, Math.max(1, base + 1));
};

export const PRIORITY_FILL_COLORS: Record<number, string> = {
  1: "bg-gray-400",
  2: "bg-amber-500",
  3: "bg-orange-500",
  4: "bg-red-500",
};