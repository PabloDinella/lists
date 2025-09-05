import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider } from "./components/ui/sidebar";
import { NodeView } from "./components/node-view/node-view";
import { SignIn } from "./components/sign-in";
import { ProtectedRoute } from "./components/protected-route";
import { SettingsView } from "./components/settings-view";
import { ImportView } from "./components/import-view";
import { LandingPage } from "./site/landing-page";
import { PricingPage } from "./site/pricing-page";
import { PrivacyPolicy } from "./site/privacy-policy";
import { TermsOfService } from "./site/terms-of-service";
import { AuthProvider } from "./contexts/auth-context";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route
              path="/app"
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
    </AuthProvider>
  );
}

export default App;
