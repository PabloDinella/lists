import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider } from "./components/ui/sidebar";
import { NodeView } from "./components/node-view/node-view";
import { SignIn } from "./components/sign-in";
import { ProtectedRoute } from "./components/protected-route";
import { SettingsView } from "./components/settings-view";
import { ImportView } from "./components/import-view";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <NodeView />
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lists/manage"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <NodeView />
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lists/:listId"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <NodeView />
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <SettingsView />
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <ImportView />
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
