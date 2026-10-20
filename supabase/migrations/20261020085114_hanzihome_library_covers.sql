begin;
set local lock_timeout = '5s';

create table public.hanzihome_library_covers (
 collection_id text primary key,
 cover_url text not null,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 constraint hanzihome_library_covers_collection_id_check check (
  collection_id in (
   'group:hanyu', 'group:boya', 'group:boyaSecondEdition', 'group:listening', 'group:other',
   'static:business-chinese-tm2', 'static:business-chinese-tm3',
   'static:nhip-cau', 'static:doc-hieu', 'static:khau-ngu'
  )
 ),
 constraint hanzihome_library_covers_url_check check (
  length(cover_url) <= 2048 and cover_url ~* '^https?://[^[:space:]/?#]+[^[:space:]]*$'
 )
);

comment on table public.hanzihome_library_covers is
'Shared editor-owned library collection cover overrides. An absent row uses the common cover; no learner settings or canonical course/book content is changed.';

alter table public.hanzihome_library_covers enable row level security;
revoke all on table public.hanzihome_library_covers from public, anon, authenticated, service_role;
grant select on table public.hanzihome_library_covers to authenticated, service_role;
create policy "Authenticated library cover reads"
 on public.hanzihome_library_covers for select to authenticated
 using ((select auth.uid()) is not null);

create function public.hanzihome_mutate_library_cover_as_user(
 p_collection_id text,
 p_cover_url text default null,
 p_expected_updated_at timestamptz default null,
 p_reset boolean default false,
 p_reason text default 'Update HanziHome library cover'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_actor_id uuid := (select auth.uid());
 v_before public.hanzihome_library_covers;
 v_after public.hanzihome_library_covers;
 v_exists boolean;
 v_operation text;
begin
 if v_actor_id is null then
  raise exception 'Authenticated actor is required' using errcode = '28000';
 end if;
 if not (select public.can_edit_hanzihome_content()) then
  raise exception 'HanziHome editor role is required' using errcode = '42501';
 end if;
 if p_collection_id is null or p_collection_id not in (
  'group:hanyu', 'group:boya', 'group:boyaSecondEdition', 'group:listening', 'group:other',
  'static:business-chinese-tm2', 'static:business-chinese-tm3',
  'static:nhip-cau', 'static:doc-hieu', 'static:khau-ngu'
 ) or p_reset is null or p_reason is null or length(btrim(p_reason)) = 0 then
  raise exception 'Invalid library cover mutation' using errcode = '22023';
 end if;
 if not p_reset and (
  p_cover_url is null or length(p_cover_url) > 2048
  or p_cover_url !~* '^https?://[^[:space:]/?#]+[^[:space:]]*$'
 ) then
  raise exception 'Cover URL must use HTTP or HTTPS' using errcode = '22023';
 end if;
 if p_reset and p_expected_updated_at is null then
  raise exception 'expectedUpdatedAt is required to reset a cover' using errcode = '22023';
 end if;

 -- Serialize observed-absence creation as well as updates/deletes for this collection.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
  'hanzihome-library-cover:' || p_collection_id, 0
 ));
 select * into v_before from public.hanzihome_library_covers
 where collection_id = p_collection_id for update;
 v_exists := found;

 if (v_exists and v_before.updated_at is distinct from p_expected_updated_at)
  or (not v_exists and p_expected_updated_at is not null) then
  raise exception 'Library cover changed since it was loaded' using errcode = '40001';
 end if;

 if p_reset then
  delete from public.hanzihome_library_covers where collection_id = p_collection_id;
  v_operation := 'delete';
 elsif v_exists then
  update public.hanzihome_library_covers
  set cover_url = p_cover_url,
   updated_at = greatest(clock_timestamp(), v_before.updated_at + interval '1 microsecond')
  where collection_id = p_collection_id returning * into v_after;
  v_operation := 'update';
 else
  insert into public.hanzihome_library_covers (collection_id, cover_url)
  values (p_collection_id, p_cover_url) returning * into v_after;
  v_operation := 'create';
 end if;

 insert into public.hanzihome_content_audit_log (
  actor_id, operation, entity_type, entity_id, before_data, after_data, reason
 ) values (
  v_actor_id, v_operation, 'library_cover', p_collection_id,
  case when v_exists then to_jsonb(v_before) else null end,
  case when p_reset then null else to_jsonb(v_after) end,
  btrim(p_reason)
 );

 if p_reset then
  return jsonb_build_object('collectionId', p_collection_id, 'reset', true);
 end if;
 return jsonb_build_object('item', jsonb_build_object(
  'collectionId', v_after.collection_id, 'coverUrl', v_after.cover_url,
  'createdAt', v_after.created_at, 'updatedAt', v_after.updated_at
 ));
end;
$$;

revoke all on function public.hanzihome_mutate_library_cover_as_user(text,text,timestamptz,boolean,text)
 from public, anon, service_role;
grant execute on function public.hanzihome_mutate_library_cover_as_user(text,text,timestamptz,boolean,text)
 to authenticated;
comment on function public.hanzihome_mutate_library_cover_as_user(text,text,timestamptz,boolean,text) is
'Session editor/admin-only shared cover CAS and atomic audit. Null expected timestamp means observed absence; reset deletes only the override.';

commit;
