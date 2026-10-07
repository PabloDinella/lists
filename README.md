# Lists

A flexible system of nodes, lists, and relationships with a first-class Getting Things Done (GTD) interface. The underlying data model does not encode GTD categories as special node types: users configure which lists serve as Inbox, Next Actions, Projects, and other GTD destinations. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Data model

- Every node has one owning parent (`parent_node`). Ownership defines its place in the hierarchy and its project context.
- Nodes can also have typed relationships. `tagged_with` associates an item with a tag; `member_of` shows the same item in another list without changing its owning parent.
- A list shows its owned children and items with a `member_of` relationship to that list. Removing an additional membership removes the relationship, not the item. Deleting an owner can still affect its children, even when they also appear in another list.
- GTD is implemented through configured lists and workflows on top of these generic capabilities. A project action can remain under its project while also appearing in Next Actions through list membership.

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

- Node.js 20+
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
   - Apply the migrations in `supabase/migrations/`. The core `node`, `relationship`, and `settings` tables are included for fresh databases.
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

### Local staging for offline sync

Docker and the Supabase CLI are required. This uses a separate database on your
machine, including local authentication and the RxDB sync API. It does not use
the hosted project's data.

```bash
npx supabase start --exclude storage-api,imgproxy,studio,logflare,vector,edge-runtime,postgres-meta,supavisor
npm run staging:configure
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and create a local account.
Magic links for local accounts appear in the test inbox at
[http://127.0.0.1:54324](http://127.0.0.1:54324); they are not sent to your
regular email inbox. The sign-in screen links there after you request a link.
The generated `.env.local` is ignored by Git and takes precedence over `.env` in
Vite. Restart the dev server after changing between local and hosted databases.
To test offline behavior, create an item, switch the browser's network to
offline, make another change, then reconnect and verify it appears after sync.
Run `npx supabase stop` when finished. For a clean local database, run
`npx supabase db reset` (without `--linked`); this deletes only local data.

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
   applying the migration.
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

## MCP access

The authenticated MCP Edge Function at `/functions/v1/mcp` lets a user connect
an MCP client to their Lists account. The initial tools list inbox items, get an
item, search items, and create an inbox item. The function verifies each OAuth
request and uses an authenticated database client. Each query also filters by
the verified user ID. It never accepts a user ID from a tool caller. Supabase
OAuth access tokens currently have the same data access as a regular user
session, including direct Supabase API access; MCP tool restrictions do not
restrict the token itself. Only connect clients you trust. Supabase's standard
OAuth scopes control identity claims, not Lists database permissions.

To run locally, use Node.js 20+, the Supabase CLI from this repository, and the
local Supabase stack. `supabase/config.toml` enables the local OAuth server,
dynamic client registration, and a consent page at `/oauth/consent`. Start the
app at `http://localhost:5173`, serve the function with
`npx supabase functions serve mcp`, and connect the MCP Inspector to
`http://127.0.0.1:54321/functions/v1/mcp` using Streamable HTTP. Sign in and
approve the request in the app's consent page. The migrations recreate the
current `node` and `settings` schema locally.

Before production deployment:

1. Inspect the `node` and `settings` schema and RLS policies on the target
   database. The linked project had owner-scoped RLS on both tables when
   inspected on 2026-09-30. Confirm this on any other project before enabling
   OAuth. The function's explicit user filters are a second guard, not a
   replacement for database policies.
2. In the Supabase Dashboard, enable the OAuth 2.1 server and dynamic client
   registration, set the authorization path to `/oauth/consent`, and set the
   Auth Site URL to the deployed app origin. Add the deployed
   `/oauth/consent` URL with its `authorization_id` query to Authentication →
   URL Configuration → Redirect URLs so email sign-in can return to consent.
   Use an asymmetric JWT signing key (ES256 or RS256), which the function's
   auth middleware requires.
3. Deploy the frontend with `/oauth/consent`, then run
   `npx supabase functions deploy mcp --no-verify-jwt`. The function handles
   authentication itself and needs unauthenticated OAuth discovery requests.
   The endpoint is `https://PROJECT.supabase.co/functions/v1/mcp`.

The `site_url` in `supabase/config.toml` is for local development. Change it
to the production origin before using `supabase config push` against a hosted
project, or configure the hosted OAuth settings in the Dashboard as above.
Users can review and revoke connected clients under **Settings → Connected apps**.
See the [Supabase MCP deployment guide](https://supabase.com/docs/guides/ai-tools/byo-mcp)
for client setup and deployment details.

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

## License

MIT License
