import { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  onNewItem?: () => void;
  newItemLabel?: string;
}

export function AppLayout({ children, title, onNewItem, newItemLabel }: AppLayoutProps) {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold flex-1">
            {title}
          </h1>
          {onNewItem && (
            <Button variant="outline" onClick={onNewItem}>
              <Plus className="h-4 w-4 mr-2" />
              {newItemLabel || "New Item"}
            </Button>
          )}
          <ModeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </>
  );
} 