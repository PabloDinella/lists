# Offline-first sync plan

## Goal

Let a signed-in user read and change their lists immediately in a browser that has
loaded the app before. Persist those changes locally and deliver them to Supabase
when connectivity returns. Keep node ownership (`parent_node`) distinct from
additional list membership (`member_of`) and tags (`tagged_with`).

## Implementation

1. **Server change feed and write endpoint.** The additive migration
   `20261006190000_offline_sync.sql` records inserts, updates, and deletes of
   nodes, relationships, and settings, including writes from Telegram and MCP
   clients. Each user reads only their own ordered changes. An authenticated,
   idempotent RPC applies queued browser writes using the existing numeric IDs.
2. **Local database.** RxDB with Dexie storage holds user-scoped copies of those
   three tables and a durable outbox. Offline-created rows get negative, locally
   generated numeric IDs, preserving the current foreign keys and UI model.
   Writes reach RxDB before the action resolves. On reconnect the app sends
   outbox operations in order, then pulls server changes by cursor. Realtime
   events and periodic polling prompt additional pulls.
3. **App integration.** All node, relationship, settings, import, seed, setup,
   and reset paths use the local store. Queries assemble the display graph
   locally; relationships retain their type and direction. Deleting an owner
   removes its structural descendants and incident edges locally. Removing a
   membership removes only that edge. The app shell is cached for offline reload,
   and a header indicator shows pending writes or sync errors. A minimal remembered
   identity opens that user's local data after an access token expires offline;
   the server refuses sync until that same account has a valid session.

## Conflict policy

The initial policy is last accepted write wins for an individual row. An offline
edit sent after a different device's edit can replace that row's full state.
The outbox never silently discards an unsent write; a rejected operation remains
queued and the header shows a sync issue. Field-level merging or a conflict
review UI is a separate enhancement if concurrent editing becomes common.

## Rollout

1. Apply the migration to Supabase. It must precede the frontend deployment.
2. Deploy the frontend and verify an existing account receives its backfilled
   nodes, relationships, and settings.
3. On two devices, edit while one is offline, reconnect, and verify both converge.
   Include creates with tags, membership removal, owner deletion, settings,
   import, and a server-created Telegram item.
4. Watch pending counts and sync errors after release. Keep the legacy tables
   and their original ID model; the migration is additive.

The SQL test uses `tests/offline-sync-fixture.sql`, then the migration, then
`tests/offline-sync-assertions.sql` on a fresh PostgreSQL database. It checks
idempotent retries, account isolation, membership removal, and ownership
cascades. The frontend build, lint, and unit tests should pass before release.

An initial sign-in still needs a network connection. Browser storage can be
cleared by the user or browser, so Supabase remains the durable shared copy.
The change feed retains history for long-offline clients and needs a later
retention/snapshot policy if its size becomes material.
