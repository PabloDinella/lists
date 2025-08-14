import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider } from "./components/ui/sidebar";
import { TaskManager } from "./components/task-manager";
import { TagManagement } from "./components/tag-management";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<TaskManager />} />
            <Route path="/lists/manage" element={<TagManagement />} />
            <Route path="/lists/:listId" element={<TagManagement />} />
          </Routes>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
