import { cn } from "@/lib/utils";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

interface ShortcutHintProps {
  shortcut: string;
  className?: string;
}

export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  const keys = shortcut.split("+");
  const symbols: Record<string, string> = {
    Mod: isMac ? "⌘" : "^",
    Shift: "⇧",
    Enter: "⏎",
    ArrowLeft: "←",
    ArrowRight: "→",
  };
  const labels: Record<string, string> = {
    Mod: isMac ? "Command" : "Control",
    ArrowLeft: "Left arrow",
    ArrowRight: "Right arrow",
  };

  return (
    <kbd
      aria-label={keys.map((key) => labels[key] ?? key).join(" plus ")}
      className={cn(
        "hidden shrink-0 items-center rounded border border-current/30 px-1.5 py-0.5 font-sans text-[13px] font-medium leading-none opacity-70 sm:inline-flex",
        className,
      )}
    >
      {keys.map((key, index) => (
        <span
          key={`${key}-${index}`}
          className={key === "Mod" && !isMac ? "relative top-[2px]" : undefined}
        >
          {symbols[key] ?? key}
        </span>
      ))}
    </kbd>
  );
}
