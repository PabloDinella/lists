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

## Roadmap

- [x] Flexible lists (add, remove and modify any list)
- [x] Drag and drop reordering

## Braindump

Ideas and thoughts that could turn into new features:

- Customizable shortcuts
- Weekly and daily review flows
- Processing aid (maybe AI could help)
- [x] Add ability to add items in combobox (or free multiselect autocomplete component), by typing and pressing enter (useful for adding new context, area of focus, or contacts to an item)
- Ask confirmation to delete anything
- When deleting projects, delete its children too
- [ ] Importer for nirvana
- Add the checkbox to the heading as well (node-view)
- [x] Breadcrumbs
- [ ] Add a loading state UI
- [ ] Allow sections in side menu to be collapsible
- [ ] Add option to dismiss done items during import

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

## Database Backups

The repository includes a GitHub Actions workflow at `.github/workflows/supabase-backup.yml`
that runs hourly and can also be run manually from the Actions tab.

Before using it, add these repository secrets in GitHub:

```
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
BACKUP_ENCRYPTION_PASSPHRASE=a-long-random-passphrase
BACKUP_S3_BUCKET=your-private-backup-bucket
BACKUP_S3_ENDPOINT_URL=https://your-s3-compatible-endpoint
BACKUP_S3_ACCESS_KEY_ID=your-storage-access-key-id
BACKUP_S3_SECRET_ACCESS_KEY=your-storage-secret-access-key
BACKUP_S3_PREFIX=supabase
BACKUP_S3_REGION=auto
```

If your database password contains special characters, use Supabase's copied connection
string or percent-encode the password.

The workflow dumps roles, schema, and data, compresses the dump files, encrypts the
archive with GPG, and uploads only the encrypted `.tar.gz.gpg` file to private
S3-compatible storage. Do not commit raw database dumps to the repository or upload
them as GitHub Actions artifacts from this public repository.

For Cloudflare R2, use this endpoint format:

```
https://[ACCOUNT-ID].r2.cloudflarestorage.com
```

This backs up the app database tables, but Supabase-managed Auth and Storage data are
not included in the Supabase CLI dump. Back up Storage bucket files separately if the
app starts using them.

To decrypt a downloaded backup file:

```bash
gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" \
  --decrypt supabase-backup-YYYYMMDDTHHMMSSZ.tar.gz.gpg \
  > supabase-backup-YYYYMMDDTHHMMSSZ.tar.gz
tar -xzf supabase-backup-YYYYMMDDTHHMMSSZ.tar.gz
```

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
