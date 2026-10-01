-- Personal Telegram bots are managed only by server-side Edge Functions.
create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;

create table public.telegram_integration (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bot_id bigint not null unique,
  bot_username text not null,
  token_secret_id uuid not null,
  webhook_secret_hash text not null,
  pair_code_hash text not null,
  pair_expires_at timestamptz not null,
  telegram_user_id bigint,
  chat_id bigint,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  constraint telegram_pair_both_or_neither check (
    (telegram_user_id is null and chat_id is null)
    or (telegram_user_id is not null and chat_id is not null)
  )
);

create table public.telegram_update_receipt (
  integration_id uuid not null references public.telegram_integration(id) on delete cascade,
  update_id bigint not null,
  node_id bigint references public.node(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (integration_id, update_id)
);

alter table public.telegram_integration enable row level security;
alter table public.telegram_update_receipt enable row level security;
revoke all on public.telegram_integration from public, anon, authenticated;
revoke all on public.telegram_update_receipt from public, anon, authenticated;
grant select, insert, update, delete on public.telegram_integration to service_role;
grant select, insert, update, delete on public.telegram_update_receipt to service_role;

-- Also remove the encrypted token when an auth.users cascade deletes a bot.
create or replace function public.telegram_cleanup_vault_secret()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where id = old.token_secret_id;
  return old;
end;
$$;
create trigger telegram_cleanup_vault_secret_after_delete
after delete on public.telegram_integration
for each row execute function public.telegram_cleanup_vault_secret();
revoke all on function public.telegram_cleanup_vault_secret() from public, anon, authenticated;

-- The caller supplies an Auth-verified user ID. The function owns the Vault write
-- so a token cannot accidentally be returned through a public table or API.
create or replace function public.telegram_create_connection(
  p_user_id uuid,
  p_bot_id bigint,
  p_bot_username text,
  p_token text,
  p_webhook_secret_hash text,
  p_pair_code_hash text,
  p_pair_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_secret_id uuid;
begin
  if p_user_id is null or p_bot_id is null or nullif(p_bot_username, '') is null
     or nullif(p_token, '') is null or nullif(p_webhook_secret_hash, '') is null
     or nullif(p_pair_code_hash, '') is null or p_pair_expires_at <= now() then
    raise exception 'Invalid Telegram connection';
  end if;

  -- Check unique constraints before creating a Vault secret when possible.
  if exists (select 1 from public.telegram_integration where user_id = p_user_id or bot_id = p_bot_id) then
    raise exception 'Telegram bot or user already connected';
  end if;

  v_secret_id := vault.create_secret(p_token);
  insert into public.telegram_integration (
    user_id, bot_id, bot_username, token_secret_id, webhook_secret_hash,
    pair_code_hash, pair_expires_at
  ) values (
    p_user_id, p_bot_id, p_bot_username, v_secret_id, p_webhook_secret_hash,
    p_pair_code_hash, p_pair_expires_at
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.telegram_connection_token(p_integration_id uuid)
returns text language sql security definer set search_path = '' as $$
  select s.decrypted_secret
  from public.telegram_integration i
  join vault.decrypted_secrets s on s.id = i.token_secret_id
  where i.id = p_integration_id;
$$;

create or replace function public.telegram_delete_connection(
  p_integration_id uuid, p_user_id uuid
) returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.telegram_integration
  where id = p_integration_id and user_id = p_user_id;
end;
$$;

create or replace function public.telegram_pair(
  p_integration_id uuid,
  p_pair_code_hash text,
  p_telegram_user_id bigint,
  p_chat_id bigint
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_rows integer;
begin
  update public.telegram_integration
  set telegram_user_id = p_telegram_user_id,
      chat_id = p_chat_id,
      pair_code_hash = '',
      pair_expires_at = now()
  where id = p_integration_id
    and status = 'active'
    and telegram_user_id is null
    and pair_code_hash = p_pair_code_hash
    and pair_expires_at > now()
    and p_telegram_user_id is not null
    and p_chat_id is not null;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.telegram_refresh_pair(
  p_integration_id uuid,
  p_user_id uuid,
  p_pair_code_hash text,
  p_pair_expires_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_rows integer;
begin
  if nullif(p_pair_code_hash, '') is null or p_pair_expires_at <= now() then
    return false;
  end if;
  update public.telegram_integration
  set pair_code_hash = p_pair_code_hash, pair_expires_at = p_pair_expires_at
  where id = p_integration_id and user_id = p_user_id
    and status = 'active' and telegram_user_id is null;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

-- Receipt and node creation happen in one transaction. Any failure rolls back
-- the receipt, allowing Telegram's next delivery attempt to succeed.
create or replace function public.telegram_capture(
  p_integration_id uuid,
  p_update_id bigint,
  p_telegram_user_id bigint,
  p_chat_id bigint,
  p_title text,
  p_content text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid;
  v_inbox_id bigint;
  v_default_metadata jsonb;
  v_node_id bigint;
  v_inserted integer;
begin
  select user_id into v_user_id
  from public.telegram_integration
  where id = p_integration_id and status = 'active'
    and telegram_user_id = p_telegram_user_id and chat_id = p_chat_id;
  if v_user_id is null then
    raise exception 'Telegram chat is not paired';
  end if;
  if nullif(btrim(p_title), '') is null or length(p_title) > 1000 then
    raise exception 'Invalid item title';
  end if;

  insert into public.telegram_update_receipt (integration_id, update_id)
  values (p_integration_id, p_update_id)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    select node_id into v_node_id
    from public.telegram_update_receipt
    where integration_id = p_integration_id and update_id = p_update_id;
    return jsonb_build_object('created', false, 'node_id', v_node_id);
  end if;

  select n.id, n.metadata -> 'defaultChildrenMetadata'
  into v_inbox_id, v_default_metadata
  from public.settings s
  join public.node n on n.id = case
    when (s.settings ->> 'inbox') ~ '^[0-9]+$'
    then (s.settings ->> 'inbox')::bigint
    else null
  end
  where s.user_id = v_user_id and n.user_id = v_user_id
  limit 1;
  if v_inbox_id is null then
    raise exception 'Inbox is not configured';
  end if;

  v_default_metadata := coalesce(v_default_metadata, '{"type":"loop"}'::jsonb);
  insert into public.node (name, content, parent_node, user_id, metadata)
  values (
    btrim(p_title), nullif(btrim(p_content), ''), v_inbox_id, v_user_id,
    v_default_metadata || jsonb_build_object('defaultChildrenMetadata', v_default_metadata)
  ) returning id into v_node_id;

  update public.telegram_update_receipt set node_id = v_node_id
  where integration_id = p_integration_id and update_id = p_update_id;
  return jsonb_build_object('created', true, 'node_id', v_node_id);
end;
$$;

revoke all on function public.telegram_create_connection(uuid,bigint,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.telegram_connection_token(uuid) from public, anon, authenticated;
revoke all on function public.telegram_delete_connection(uuid,uuid) from public, anon, authenticated;
revoke all on function public.telegram_pair(uuid,text,bigint,bigint) from public, anon, authenticated;
revoke all on function public.telegram_refresh_pair(uuid,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.telegram_capture(uuid,bigint,bigint,bigint,text,text) from public, anon, authenticated;
grant execute on function public.telegram_create_connection(uuid,bigint,text,text,text,text,timestamptz) to service_role;
grant execute on function public.telegram_connection_token(uuid) to service_role;
grant execute on function public.telegram_delete_connection(uuid,uuid) to service_role;
grant execute on function public.telegram_pair(uuid,text,bigint,bigint) to service_role;
grant execute on function public.telegram_refresh_pair(uuid,uuid,text,timestamptz) to service_role;
grant execute on function public.telegram_capture(uuid,bigint,bigint,bigint,text,text) to service_role;
