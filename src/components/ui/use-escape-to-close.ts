import { useEffect } from "react";

// Radix dialogs/sheets listen for Escape on the document in the capture phase,
// so a React stopPropagation arrives too late. Listening on the window in the
// capture phase lets an open popup consume Escape before the surrounding
// dialog closes.
export function useEscapeToClose(
  isOpen: boolean,
  getContainer: () => HTMLElement | null,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const container = getContainer();
      if (!container || !(event.target instanceof Node) || !container.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen, getContainer, onClose]);
}
