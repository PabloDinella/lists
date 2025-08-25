import { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ModeToggle } from "./mode-toggle";
import { SearchInput } from "./search-input";
import { Button } from "./ui/button";
import { FeedbackAlertBar } from "./ui/feedback-alert-bar";
import { Plus } from "lucide-react";
import { TreeNode } from "./node-view/use-list-data";

interface AppLayoutProps {
  children: ReactNode;
  title: ReactNode;
  onNewItem?: () => void;
  newItemLabel?: string;
  searchNodes?: TreeNode[];
}

export function AppLayout({ children, title, onNewItem, newItemLabel, searchNodes = [] }: AppLayoutProps) {
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
              {onNewItem && (
                <Button 
                  onClick={onNewItem}
                  size="sm"
                  className="px-2"
                  aria-label={newItemLabel || "New Item"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop: Single row layout */}
          <div className="hidden md:flex h-16 items-center gap-2 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-4 flex-1">
              <div className="text-xl font-semibold">{title}</div>
              {onNewItem && (
                <Button onClick={onNewItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  {newItemLabel || "New Item"}
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
    </>
  );
}