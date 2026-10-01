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

## Personal Telegram bots

Each user can connect one bot created with [@BotFather](https://t.me/BotFather)
from **Settings → Telegram Inbox**. A private text message to the paired bot
creates an item under that user's currently configured Inbox. The first line
becomes the item title; remaining lines become its content. Group messages and
media are outside the initial scope.

The integration uses two Supabase Edge Functions and the database migration in
`supabase/migrations/`. Deploy in this order:

1. Apply `supabase/migrations/20260930190000_telegram_integrations.sql` to the
   Supabase project. It enables Vault, creates private integration and update
   receipt tables, and adds service-only database functions. Inspect the
   project's existing `node` and `settings` schema and RLS policies before
   applying the migration, since the original schema is not tracked here.
2. Set the Edge Function secret `TELEGRAM_WEBHOOK_BASE_URL` to the public URL of
   the `telegram-webhook` function (for example,
   `https://PROJECT.supabase.co/functions/v1/telegram-webhook`). The functions
   also need `APP_BASE_URL` set to the public app origin (for example,
   `https://lists.example.com`), plus Supabase's server-side URL and service-role
   key. Never put the
   service-role key or a bot token in a `VITE_` environment variable.
3. Deploy `telegram-webhook` and `telegram-connect`. The webhook has JWT
   verification disabled in `supabase/config.toml` because Telegram cannot send
   a Supabase user token; it verifies Telegram's per-bot secret header itself.
4. In Settings, connect a BotFather token, open the pairing link, and send
   `/start` to the bot. Pairing links expire; Settings can generate a new one.

For local webhook testing, expose the local Edge Function over HTTPS and set
`TELEGRAM_WEBHOOK_BASE_URL` to that public URL. Telegram retries unsuccessful
webhook deliveries; the database receipt makes item creation idempotent.

## Database Backups

The repository includes a GitHub Actions workflow at `.github/workflows/supabase-backup.yml`
that runs hourly and can also be run manually from the Actions tab.

Before using it, add these repository secrets in GitHub:

```
SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-HOST]:6543/postgres
BACKUP_ENCRYPTION_PASSPHRASE=a-long-random-passphrase
BACKUP_S3_BUCKET=your-private-backup-bucket
BACKUP_S3_ENDPOINT_URL=https://your-s3-compatible-endpoint
BACKUP_S3_ACCESS_KEY_ID=your-storage-access-key-id
BACKUP_S3_SECRET_ACCESS_KEY=your-storage-secret-access-key
BACKUP_S3_PREFIX=supabase
BACKUP_S3_REGION=auto
```

If your database password contains special characters, use Supabase's copied connection
string or percent-encode the password. GitHub Actions does not support IPv6 database
connections, so use the IPv4 Transaction pooler connection string from Supabase
Dashboard > Connect > Transaction pooler instead of the direct database connection
string.

When setting `SUPABASE_DB_URL` with the GitHub CLI, wrap the connection string in
single quotes so shell characters such as `$` are not expanded locally before the
secret is stored:

```bash
gh secret set SUPABASE_DB_URL \
  --body 'postgresql://postgres.[PROJECT-REF]:p%24ssword@[POOLER-HOST]:6543/postgres'
```

The workflow dumps roles, the full `public` schema, and encrypted Vault secret
rows, compresses the dump files, encrypts the archive with GPG, and uploads only
the encrypted `.tar.gz.gpg` file to private S3-compatible storage. Vault rows
need the source project's Vault root key to decrypt after a manual restore into
a different project; otherwise users must reconnect their Telegram bots. Do not commit raw database dumps to the
repository or upload them as GitHub Actions artifacts from this public repository.

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
