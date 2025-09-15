# Seed Data for GTD Lists App

This directory contains comprehensive seed data for the GTD (Getting Things Done) productivity application. The seed data provides a realistic example of how to structure and organize tasks, projects, and references using the GTD methodology.

## What's Included

The seed data creates a complete GTD workspace with:

### 📥 **Inbox** (7 items)
- Unprocessed items that need to be organized
- Example: "Research team building activities", "Fix leaky kitchen faucet"

### ⚡ **Next Actions** (5 items)
- Concrete, actionable tasks you can do now
- Includes energy and time estimates
- Example: "Call dentist to schedule cleaning" (low energy, 5min)

### ⏳ **Waiting For** (3 items)
- Tasks delegated to others or pending responses
- Example: "Contract approval from legal team"

### 🔮 **Someday/Maybe** (5 items)
- Future ideas and goals
- Example: "Learn Spanish", "Visit Japan"

### 📅 **Scheduled** (4 items)
- Date-specific commitments
- Example: "Team standup meeting" (recurring)

### 📂 **Projects** (4 projects)
- Multi-step goals with subtasks
- Example: "Q4 Marketing Campaign" with 4 action items

### 🏷️ **Areas of Focus** (8 areas)
- Life domains: Work, Health, Family, Finance, Learning, etc.

### 🔧 **Contexts** (8 contexts)
- Situational tags: Office, Home, Computer, Phone, etc.

### 📚 **Reference** (4 categories)
- Emergency contacts, recipes, travel resources, gift ideas

## Usage

### Using the React Component (Recommended for Development)

1. Import the `SeedDataManager` component:
```tsx
import { SeedDataManager } from "@/components/seed-data-manager";

// Add to your development page
<SeedDataManager />
```

2. Click "Create Seed Data" to populate your workspace
3. Click "Clear Data" to remove all data (use carefully!)

### Using the CLI Script

```bash
# Create seed data for a user
npm run seed-data [user-id]

# Clear all data for a user
npm run seed-data --clear [user-id]
```

Example:
```bash
npm run seed-data 123e4567-e89b-12d3-a456-426614174000
```

### Using the Hook in Custom Components

```tsx
import { useSeedData } from "@/hooks/use-seed-data";

function MyComponent() {
  const { createSeed, clearData, isCreating } = useSeedData();
  
  const handleCreateSeed = () => {
    createSeed.mutateAsync({ userId: "user-id" });
  };
}
```

### Using the Functions Directly

```typescript
import { createSeedData, clearUserData } from "@/lib/seed-data";

// Create seed data
const nodeIdMap = await createSeedData(userId);

// Clear user data
await clearUserData(userId);
```

## Data Structure

The seed data demonstrates the full hierarchy and relationships supported by the app:

- **Nodes**: Hierarchical structure with proper parent-child relationships
- **Metadata**: Each node has appropriate metadata (type, energy, time, etc.)
- **Relationships**: Tasks are properly tagged with contexts and areas of focus
- **Settings**: GTD-specific settings pointing to key lists

## Realistic Examples

The seed data includes realistic, relatable examples:

- **Work tasks**: "Review Q3 financial reports", "Submit expense report"
- **Personal tasks**: "Buy groceries", "Plan Sarah's birthday party"
- **Projects**: "Home Office Setup", "Learn React Native"
- **Reference materials**: Emergency contacts, favorite recipes

## Development Notes

- The `SeedDataManager` component should be removed from production builds
- All generated data is tied to a specific user ID
- The seed data respects the existing GTD methodology and app structure
- Relationships between tasks and tags are properly established

## Customization

To customize the seed data:

1. Edit `/src/lib/seed-data.ts`
2. Modify the `seedNodes` array structure
3. Add or remove nodes, tags, or relationships as needed
4. Ensure metadata types match the app's schema

The seed data structure follows the same pattern as the default structure but with much more comprehensive examples and realistic content.
