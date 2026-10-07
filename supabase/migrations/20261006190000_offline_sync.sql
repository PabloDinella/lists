-- Durable per-user change feed and idempotent write endpoint for offline clients.
create table public.offline_change (
  change_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity text not null check (entity in ('node', 'relationship', 'settings')),
  entity_id bigint generated always as ((payload ->> 'id')::bigint) stored,
  action text not null check (action in ('upsert', 'delete')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index offline_change_user_cursor_idx on public.offline_change(user_id, change_id);
alter table public.offline_change enable row level security;
create policy offline_change_select_own on public.offline_change
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.offline_change from public, anon;
grant select on public.offline_change to authenticated;
alter publication supabase_realtime add table public.offline_change;

create table public.offline_apply_receipt (
  user_id uuid not null references auth.users(id) on delete cascade,
  op_id uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, op_id)
);
alter table public.offline_apply_receipt enable row level security;
revoke all on public.offline_apply_receipt from public, anon, authenticated;

-- The transaction lock makes generated change IDs a commit-ordered cursor per user:
-- a later transaction cannot allocate its ID until the earlier transaction commits.
create or replace function public.capture_offline_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_row jsonb;
  v_user uuid;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;
  v_user := (v_row ->> 'user_id')::uuid;
  if v_user is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 714229));
  insert into public.offline_change(user_id, entity, action, payload)
  values (v_user, tg_table_name, case when tg_op = 'DELETE' then 'delete' else 'upsert' end, v_row);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger offline_change_node after insert or update or delete on public.node
  for each row execute function public.capture_offline_change();
create trigger offline_change_relationship after insert or update or delete on public.relationship
  for each row execute function public.capture_offline_change();
create trigger offline_change_settings after insert or update or delete on public.settings
  for each row execute function public.capture_offline_change();

-- Seed existing records so first-time clients can establish a complete local copy.
insert into public.offline_change(user_id, entity, action, payload)
select user_id, 'node', 'upsert', to_jsonb(n) from public.node n where user_id is not null;
insert into public.offline_change(user_id, entity, action, payload)
select user_id, 'relationship', 'upsert', to_jsonb(r) from public.relationship r;
insert into public.offline_change(user_id, entity, action, payload)
select user_id, 'settings', 'upsert', to_jsonb(s) from public.settings s;

create or replace function public.offline_apply(
  op_id uuid, entity text, action text, payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_id bigint;
  v_rows integer;
  v_result jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if op_id is null or entity is null or entity not in ('node', 'relationship', 'settings')
     or action not in ('upsert', 'delete') or payload is null then
    raise exception 'Invalid offline operation';
  end if;
  if payload ->> 'user_id' is distinct from v_user::text then
    raise exception 'Offline operation account does not match authentication';
  end if;

  select result into v_result from public.offline_apply_receipt
  where user_id = v_user and offline_apply_receipt.op_id = offline_apply.op_id;
  if found then return v_result; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || ':' || op_id::text, 714230));
  select result into v_result from public.offline_apply_receipt
  where user_id = v_user and offline_apply_receipt.op_id = offline_apply.op_id;
  if found then return v_result; end if;

  v_id := nullif(payload ->> 'id', '')::bigint;
  if v_id is null then raise exception 'Payload must include id'; end if;

  if action = 'delete' then
    if entity = 'node' then
      delete from public.node where id = v_id and user_id = v_user;
    elsif entity = 'relationship' then
      delete from public.relationship where id = v_id and user_id = v_user;
    else
      delete from public.settings where id = v_id and user_id = v_user;
    end if;
  elsif entity = 'node' then
    if v_id >= 0 and not exists (select 1 from public.node where id = v_id) then
      raise exception 'New node IDs must be negative';
    end if;
    if nullif(payload->>'parent_node','') is not null and not exists (
      select 1 from public.node
      where id = (payload->>'parent_node')::bigint and user_id = v_user
    ) then
      raise exception 'Owning parent does not belong to this user';
    end if;
    if exists (select 1 from public.node where id = v_id and user_id <> v_user) then
      raise exception 'Node is owned by another user';
    end if;
    insert into public.node(id, created_at, name, parent_node, user_id, content, metadata)
    values (v_id, coalesce((payload->>'created_at')::timestamptz, now()),
      payload->>'name', nullif(payload->>'parent_node','')::bigint, v_user,
      payload->>'content', payload->'metadata')
    on conflict (id) do update set name=excluded.name, parent_node=excluded.parent_node,
      content=excluded.content, metadata=excluded.metadata
    where public.node.user_id = v_user;
  elsif entity = 'relationship' then
    if v_id >= 0 and not exists (select 1 from public.relationship where id = v_id) then
      raise exception 'New relationship IDs must be negative';
    end if;
    if not exists (select 1 from public.node where id = (payload->>'node_id_1')::bigint and user_id = v_user)
       or not exists (select 1 from public.node where id = (payload->>'node_id_2')::bigint and user_id = v_user) then
      raise exception 'Relationship endpoints must belong to this user';
    end if;
    if exists (select 1 from public.relationship where id = v_id and user_id <> v_user) then
      raise exception 'Relationship is owned by another user';
    end if;
    insert into public.relationship(id, created_at, node_id_1, relation_type, user_id, node_id_2)
    values (v_id, coalesce((payload->>'created_at')::timestamptz, now()),
      nullif(payload->>'node_id_1','')::bigint, payload->>'relation_type', v_user,
      nullif(payload->>'node_id_2','')::bigint)
    on conflict (id) do update set node_id_1=excluded.node_id_1,
      relation_type=excluded.relation_type, node_id_2=excluded.node_id_2
    where public.relationship.user_id = v_user;
  else
    if v_id >= 0 and not exists (select 1 from public.settings where id = v_id) then
      raise exception 'New settings IDs must be negative';
    end if;
    if exists (select 1 from public.settings where id = v_id and user_id <> v_user) then
      raise exception 'Settings row is owned by another user';
    end if;
    insert into public.settings(id, created_at, settings, user_id)
    values (v_id, coalesce((payload->>'created_at')::timestamptz, now()), payload->'settings', v_user)
    on conflict (id) do update set settings=excluded.settings
    where public.settings.user_id = v_user;
  end if;
  get diagnostics v_rows = row_count;
  v_result := jsonb_build_object('applied', v_rows > 0, 'entity', entity, 'action', action, 'id', v_id);
  insert into public.offline_apply_receipt(user_id, op_id, result) values (v_user, op_id, v_result);
  return v_result;
end;
$$;
revoke all on function public.offline_apply(uuid, text, text, jsonb) from public, anon;
grant execute on function public.offline_apply(uuid, text, text, jsonb) to authenticated;
