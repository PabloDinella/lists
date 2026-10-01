import { ReactNode, useEffect, useState } from "react";
import { SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ModeToggle } from "./mode-toggle";
import { SearchInput } from "./search-input";
import { Button } from "./ui/button";
import { FeedbackAlertBar } from "./ui/feedback-alert-bar";
import { Plus } from "lucide-react";
import { TreeNode } from "./node-view/use-list-data";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { EditNodeSheet } from "./node-view/edit-node-sheet";
import { ShortcutHint } from "./ui/shortcut-hint";

interface AppLayoutProps {
  children: ReactNode;
  title: ReactNode;
  searchNodes?: TreeNode[];
}

export function AppLayout({ children, title, searchNodes = [] }: AppLayoutProps) {
  const { user } = useAuth();
  const { data: settings } = useSettings(user?.id ?? null);
  const [isCreatingInboxItem, setIsCreatingInboxItem] = useState(false);
  const inboxId = settings?.inbox ?? null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "n" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.isContentEditable ||
        target.closest("input, textarea, select, [contenteditable='true']") ||
        document.querySelector("[role='dialog']")
      ) {
        return;
      }

      if (!inboxId) return;
      event.preventDefault();
      setIsCreatingInboxItem(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inboxId]);

  const openCreateSheet = () => setIsCreatingInboxItem(true);

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="shrink-0 border-b">
          {/* Mobile: Two-row layout, Desktop: Single row */}
          <div className="md:hidden">
            {/* First row: Sidebar trigger + breadcrumbs */}
            <div className="flex h-12 items-center gap-2 px-4">
              <SidebarTrigger />
              <ShortcutHint shortcut="Mod+B" />
              <div className="text-lg font-semibold truncate flex-1">{title}</div>
            </div>
            {/* Second row: Search + New Item button */}
            <div className="flex h-12 items-center gap-2 px-4 border-t">
              <div className="flex-1">
                <SearchInput 
                  nodes={searchNodes} 
                  placeholder="Search..."
                />
              </div>
              {inboxId && (
                <Button
                  onClick={openCreateSheet}
                  size="sm"
                  className="px-2"
                  aria-label="New Inbox Item (N)"
                >
                  <Plus className="h-4 w-4" />
                  <ShortcutHint shortcut="N" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop: Single row layout */}
          <div className="hidden md:flex h-16 items-center gap-2 px-4">
            <SidebarTrigger />
            <ShortcutHint shortcut="Mod+B" />
            <div className="flex items-center gap-4 flex-1">
              <div className="text-xl font-semibold">{title}</div>
              {inboxId && (
                <Button onClick={openCreateSheet}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Inbox Item
                  <ShortcutHint shortcut="N" className="ml-1" />
                </Button>
              )}
            </div>
            {/* Search Input */}
            <div className="flex-1 max-w-sm">
              <SearchInput nodes={searchNodes} />
            </div>
            <ModeToggle />
          </div>

          {/* Mode toggle for mobile - positioned absolutely */}
          <div className="md:hidden absolute top-2 right-4">
            <ModeToggle />
          </div>
        </header>

        <FeedbackAlertBar dismissible />

        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
      {inboxId && (
        <EditNodeSheet
          node={null}
          isOpen={isCreatingInboxItem}
          onClose={() => setIsCreatingInboxItem(false)}
          mode="create"
          defaultParentId={inboxId}
          defaultMetadata={{ type: "loop" }}
        />
      )}
    </>
  );
}
