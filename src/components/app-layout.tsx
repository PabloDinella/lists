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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
        </header>

        <FeedbackAlertBar />

        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}