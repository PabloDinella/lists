# GTD Task Management App

A modern task management application based on David Allen's "Getting Things Done" (GTD) methodology, similar to NirvanaHQ. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **GTD Workflow Implementation**: Organize tasks following the GTD methodology
  - Capture everything in the Inbox
  - Process tasks into Next Actions, Waiting For, Scheduled, and Someday/Maybe lists
  - Organize by Projects and Areas of Focus
- **Modern UI**: Clean, distraction-free interface built with shadcn/ui components
- **Real-time Data Sync**: Powered by Supabase backend
- **Responsive Design**: Works on desktop and mobile devices

## GTD Method Implementation

The app follows the core principles of the GTD methodology:

1. **Capture**: Quickly add tasks to your inbox
2. **Clarify**: Process inbox items and decide what they are and what to do with them
3. **Organize**: Sort tasks into appropriate lists (Next Actions, Waiting For, etc.)
4. **Reflect**: Review your lists regularly
5. **Engage**: Take action on your tasks with confidence

## Tech Stack

- **Frontend**:
  - React + TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Lucide React icons
- **Backend**:
  - Supabase (Authentication, Database, Storage)
- **Build Tools**:
  - Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account (for backend)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pablodinella/lists.git
   cd lists
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in the SQL editor
   - Configure authentication providers as needed

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Supabase Schema

Create the following table in your Supabase project:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('inbox', 'next', 'waiting', 'scheduled', 'someday', 'completed', 'trashed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  project TEXT,
  area TEXT,
  tags TEXT[],
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project);
CREATE INDEX idx_tasks_area ON tasks(area);

-- Row level security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL
  USING (auth.uid() = user_id);
```

## License

MIT License
