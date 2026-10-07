insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);

select public.offline_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','node','upsert',
 '{"id":-1,"user_id":"11111111-1111-4111-8111-111111111111","name":"Owned list","parent_node":null,"content":null,"metadata":{"type":"root"},"created_at":"2026-10-06T00:00:00Z"}'
);
select public.offline_apply(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','node','upsert',
 '{"id":-2,"user_id":"11111111-1111-4111-8111-111111111111","name":"Child","parent_node":-1,"content":null,"metadata":{},"created_at":"2026-10-06T00:00:00Z"}'
);
select public.offline_apply(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','node','upsert',
 '{"id":-3,"user_id":"11111111-1111-4111-8111-111111111111","name":"Other list","parent_node":null,"content":null,"metadata":{"type":"root"},"created_at":"2026-10-06T00:00:00Z"}'
);
select public.offline_apply(
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd','relationship','upsert',
 '{"id":-4,"user_id":"11111111-1111-4111-8111-111111111111","node_id_1":-2,"node_id_2":-3,"relation_type":"member_of","created_at":"2026-10-06T00:00:00Z"}'
);

do $$
begin
  if (select count(*) from public.offline_change where user_id=auth.uid()) <> 4 then
    raise exception 'Initial change feed count is wrong';
  end if;
end $$;

-- The feed is scoped to the authenticated account.
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  if (select count(*) from public.offline_change) <> 0 then
    raise exception 'Change feed exposed another account';
  end if;
end $$;
do $$
declare rejected boolean := false;
begin
  begin
    perform public.offline_apply(
      '99999999-9999-4999-8999-999999999999','node','upsert',
      '{"id":-99,"user_id":"11111111-1111-4111-8111-111111111111","name":"Wrong account"}'
    );
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'Cross-account write was accepted'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);

-- A repeated operation is acknowledged without writing a second change.
select public.offline_apply(
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd','relationship','upsert',
 '{"id":-4,"user_id":"11111111-1111-4111-8111-111111111111","node_id_1":-2,"node_id_2":-3,"relation_type":"member_of"}'
);
do $$
begin
  if (select count(*) from public.offline_change where user_id=auth.uid()) <> 4 then
    raise exception 'Idempotent retry wrote a second change';
  end if;
end $$;

select public.offline_apply(
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','relationship','delete','{"id":-4,"user_id":"11111111-1111-4111-8111-111111111111"}'
);
do $$
begin
  if not exists(select 1 from public.node where id=-2)
     or not exists(select 1 from public.node where id=-3) then
    raise exception 'Membership removal deleted a node';
  end if;
end $$;

select public.offline_apply(
 'ffffffff-ffff-4fff-8fff-ffffffffffff','node','delete','{"id":-1,"user_id":"11111111-1111-4111-8111-111111111111"}'
);
do $$
begin
  if exists(select 1 from public.node where id in (-1,-2))
     or not exists(select 1 from public.node where id=-3)
     or (select count(*) from public.offline_change where action='delete' and user_id=auth.uid()) < 3 then
    raise exception 'Ownership cascade/change feed is wrong';
  end if;
end $$;
