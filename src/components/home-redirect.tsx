import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { LandingPage } from '@/site/landing-page';

export function HomeRedirect() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings(user?.id ?? null);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show the landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // If authenticated but settings are still loading, show loading state
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If authenticated and settings are loaded, redirect to inbox or app
  if (settings?.inbox) {
    // Redirect to the configured inbox list
    return <Navigate to={`/lists/${settings.inbox}`} replace />;
  } else {
    // If no inbox is configured, redirect to the general app view
    return <Navigate to="/app" replace />;
  }
}