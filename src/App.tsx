import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider } from "./components/ui/sidebar";
import { NodeView } from "./components/node-view/node-view";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<NodeView />} />
            <Route path="/lists/manage" element={<NodeView />} />
            <Route path="/lists/:listId" element={<NodeView />} />
          </Routes>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
