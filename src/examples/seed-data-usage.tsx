// Example usage of SeedDataManager in your settings or development page

import { SeedDataManager } from "@/components/seed-data-manager";

export function DevelopmentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Development Tools</h1>
      
      {/* Add the seed data manager */}
      <SeedDataManager />
      
      {/* Other development tools can go here */}
    </div>
  );
}

// Or add it to your existing settings page:
export function SettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {/* Your existing settings components */}
      
      {/* Development section - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Development Tools</h2>
          <SeedDataManager />
        </div>
      )}
    </div>
  );
}
