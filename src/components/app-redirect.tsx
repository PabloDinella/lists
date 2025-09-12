import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NodeView } from '@/components/node-view/node-view';

export function AppRedirect() {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings(user?.id ?? null);

  // If settings are still loading, show loading state
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user has an inbox configured, redirect to it
  if (settings?.inbox) {
    return <Navigate to={`/lists/${settings.inbox}`} replace />;
  }

  // If no inbox is configured, show the app interface
  return (
    <SidebarProvider>
      <NodeView />
    </SidebarProvider>
  );
}