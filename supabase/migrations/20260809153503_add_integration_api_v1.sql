begin;

create table if not exists public.integration_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 120),
  key_prefix text not null check (key_prefix ~ '^hhz_live_[A-Za-z0-9_-]{8,}$'),
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  scopes text[] not null check (
    cardinality(scopes) > 0
    and scopes <@ array[
      'content:read',
      'content:write',
      'notes:read',
      'notes:write',
      'learning:read',
      'learning:write',
      'artifacts:read',
      'artifacts:write',
      'lookup:read',
      'ai:generate',
      'ai-settings:read',
      'ai-settings:write',
      'tts:generate'
    ]::text[]
  ),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integration_api_keys_active_hash_idx
  on public.integration_api_keys (key_hash)
  where revoked_at is null;

create index if not exists integration_api_keys_user_created_idx
  on public.integration_api_keys (user_id, created_at desc);

alter table public.integration_api_keys enable row level security;

revoke all on table public.integration_api_keys from public, anon, authenticated;
grant select, insert, update on table public.integration_api_keys to service_role;

create table if not exists public.integration_api_tts_windows (
  integration_api_key_id uuid primary key references public.integration_api_keys(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 10),
  updated_at timestamptz not null default now()
);

alter table public.integration_api_tts_windows enable row level security;

revoke all on table public.integration_api_tts_windows from public, anon, authenticated;
grant select, insert, update on table public.integration_api_tts_windows to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create or replace function private.integration_api_require_actor(
  p_integration_api_key_id uuid,
  p_required_scope text,
  p_require_hanzihome_editor boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_scopes text[];
begin
  select api_key.user_id, api_key.scopes
  into v_actor_id, v_scopes
  from public.integration_api_keys as api_key
  where api_key.id = p_integration_api_key_id
    and api_key.revoked_at is null
  for share;

  if not found then
    raise exception using errcode = '28000', message = 'Integration API key is inactive';
  end if;

  if not (p_required_scope = any(v_scopes)) then
    raise exception using errcode = '42501', message = 'Integration API key does not have the required scope';
  end if;

  if p_require_hanzihome_editor and not exists (
    select 1
    from public.hanzihome_content_roles as role_assignment
    where role_assignment.user_id = v_actor_id
      and role_assignment.role in ('editor', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

  return v_actor_id;
end;
$$;

create or replace function private.integration_api_set_actor(
  p_integration_api_key_id uuid,
  p_required_scope text,
  p_require_hanzihome_editor boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := private.integration_api_require_actor(
    p_integration_api_key_id,
    p_required_scope,
    p_require_hanzihome_editor
  );

  perform set_config('request.jwt.claim.sub', v_actor_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_actor_id::text, 'role', 'authenticated')::text,
    true
  );

  return v_actor_id;
end;
$$;

create or replace function public.integration_hanzihome_mutate_content(
  p_integration_api_key_id uuid,
  p_operation text,
  p_entity_type text,
  p_entity_id text default null,
  p_expected_updated_at timestamptz default null,
  p_changes jsonb default '{}'::jsonb,
  p_reason text default null,
  p_audit_operation text default null,
  p_audit_entity_type text default null,
  p_audit_entity_id text default null,
  p_audit_parent_entity_type text default null,
  p_audit_parent_entity_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := private.integration_api_require_actor(
    p_integration_api_key_id,
    'content:write',
    true
  );

  return private.hanzihome_mutate_content(
    v_actor_id,
    p_operation,
    p_entity_type,
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason,
    p_audit_operation,
    p_audit_entity_type,
    p_audit_entity_id,
    p_audit_parent_entity_type,
    p_audit_parent_entity_id
  );
end;
$$;

create or replace function public.integration_hanzihome_update_radical(
  p_integration_api_key_id uuid,
  p_entity_id text,
  p_expected_updated_at timestamptz,
  p_changes jsonb default '{}'::jsonb,
  p_reason text default 'Cập nhật bộ thủ HanziHome'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'content:write',
    true
  );

  return public.hanzihome_update_radical_as_user(
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason
  );
end;
$$;

create or replace function public.integration_hanzihome_update_listening_item(
  p_integration_api_key_id uuid,
  p_entity_id text,
  p_expected_updated_at timestamptz,
  p_changes jsonb,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'content:write',
    true
  );

  return public.hanzihome_update_listening_item_as_user(
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason
  );
end;
$$;

create or replace function public.integration_hanzihome_list_vocab_children(
  p_integration_api_key_id uuid,
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_deleted boolean default false,
  p_section_keys text[] default null,
  p_query text default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'content:read',
    true
  );

  return public.hanzihome_list_vocab_children(
    p_entity_type,
    p_scope_type,
    p_scope_id,
    p_deleted,
    p_section_keys,
    p_query,
    p_page,
    p_page_size
  );
end;
$$;

create or replace function public.integration_hanzihome_preview_vocab_child_bulk(
  p_integration_api_key_id uuid,
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_deleted boolean default false,
  p_section_keys text[] default null,
  p_ids text[] default null,
  p_query text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'content:read',
    true
  );

  return public.hanzihome_preview_vocab_child_bulk(
    p_entity_type,
    p_scope_type,
    p_scope_id,
    p_deleted,
    p_section_keys,
    p_ids,
    p_query
  );
end;
$$;

create or replace function public.integration_hanzihome_mutate_vocab_child_bulk(
  p_integration_api_key_id uuid,
  p_entity_type text,
  p_scope_type text,
  p_scope_id text,
  p_operation text,
  p_expected_count bigint,
  p_expected_fingerprint text,
  p_reason text,
  p_section_keys text[] default null,
  p_ids text[] default null,
  p_query text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_operation not in ('soft_delete', 'restore') then
    raise exception using errcode = '22023', message = 'Only soft_delete and restore are available to integration API keys';
  end if;

  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'content:write',
    true
  );

  return public.hanzihome_mutate_vocab_child_bulk(
    p_entity_type,
    p_scope_type,
    p_scope_id,
    p_operation,
    p_expected_count,
    p_expected_fingerprint,
    p_reason,
    p_section_keys,
    p_ids,
    p_query
  );
end;
$$;

create or replace function public.integration_create_lesson_text_annotation(
  p_integration_api_key_id uuid,
  p_lesson_id text,
  p_node_type text,
  p_node_id text,
  p_start_offset integer,
  p_end_offset integer,
  p_selected_text text,
  p_prefix_text text default '',
  p_suffix_text text default '',
  p_note_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'learning:write'
  );

  return public.create_lesson_text_annotation(
    p_lesson_id,
    p_node_type,
    p_node_id,
    p_start_offset,
    p_end_offset,
    p_selected_text,
    p_prefix_text,
    p_suffix_text,
    p_note_text
  );
end;
$$;

create or replace function public.integration_update_lesson_text_annotation_note(
  p_integration_api_key_id uuid,
  p_annotation_id uuid,
  p_note_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'learning:write'
  );

  return public.update_lesson_text_annotation_note(p_annotation_id, p_note_text);
end;
$$;

create or replace function public.integration_delete_lesson_text_annotation(
  p_integration_api_key_id uuid,
  p_annotation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.integration_api_set_actor(
    p_integration_api_key_id,
    'learning:write'
  );

  return public.delete_lesson_text_annotation(p_annotation_id);
end;
$$;

create or replace function public.integration_api_consume_tts_quota(
  p_integration_api_key_id uuid
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_retry_after_seconds integer;
begin
  perform private.integration_api_require_actor(
    p_integration_api_key_id,
    'tts:generate'
  );

  insert into public.integration_api_tts_windows as quota_window (
    integration_api_key_id,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_integration_api_key_id, now(), 1, now())
  on conflict (integration_api_key_id) do update
  set window_started_at = case
        when quota_window.window_started_at + interval '1 minute' <= now() then now()
        else quota_window.window_started_at
      end,
      request_count = case
        when quota_window.window_started_at + interval '1 minute' <= now() then 1
        else quota_window.request_count + 1
      end,
      updated_at = now()
  where quota_window.window_started_at + interval '1 minute' <= now()
     or quota_window.request_count < 10
  returning window_started_at into v_window_started_at;

  if found then
    return query select true, 0;
    return;
  end if;

  select quota_window.window_started_at
  into v_window_started_at
  from public.integration_api_tts_windows as quota_window
  where quota_window.integration_api_key_id = p_integration_api_key_id;

  v_retry_after_seconds := greatest(
    1,
    ceil(extract(epoch from (v_window_started_at + interval '1 minute' - now())))::integer
  );
  return query select false, v_retry_after_seconds;
end;
$$;

revoke all on function private.integration_api_require_actor(uuid, text, boolean)
from public, anon, authenticated;
grant execute on function private.integration_api_require_actor(uuid, text, boolean)
to service_role;

revoke all on function private.integration_api_set_actor(uuid, text, boolean)
from public, anon, authenticated;
grant execute on function private.integration_api_set_actor(uuid, text, boolean)
to service_role;

revoke all on function public.integration_hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
) to service_role;

revoke all on function public.integration_hanzihome_update_radical(
  uuid, text, timestamptz, jsonb, text
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_update_radical(
  uuid, text, timestamptz, jsonb, text
) to service_role;

revoke all on function public.integration_hanzihome_update_listening_item(
  uuid, text, timestamptz, jsonb, text
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_update_listening_item(
  uuid, text, timestamptz, jsonb, text
) to service_role;

revoke all on function public.integration_hanzihome_list_vocab_children(
  uuid, text, text, text, boolean, text[], text, integer, integer
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_list_vocab_children(
  uuid, text, text, text, boolean, text[], text, integer, integer
) to service_role;

revoke all on function public.integration_hanzihome_preview_vocab_child_bulk(
  uuid, text, text, text, boolean, text[], text[], text
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_preview_vocab_child_bulk(
  uuid, text, text, text, boolean, text[], text[], text
) to service_role;

revoke all on function public.integration_hanzihome_mutate_vocab_child_bulk(
  uuid, text, text, text, text, bigint, text, text, text[], text[], text
) from public, anon, authenticated;
grant execute on function public.integration_hanzihome_mutate_vocab_child_bulk(
  uuid, text, text, text, text, bigint, text, text, text[], text[], text
) to service_role;

revoke all on function public.integration_create_lesson_text_annotation(
  uuid, text, text, text, integer, integer, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.integration_create_lesson_text_annotation(
  uuid, text, text, text, integer, integer, text, text, text, text
) to service_role;

revoke all on function public.integration_update_lesson_text_annotation_note(uuid, uuid, text)
from public, anon, authenticated;
grant execute on function public.integration_update_lesson_text_annotation_note(uuid, uuid, text)
to service_role;

revoke all on function public.integration_delete_lesson_text_annotation(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.integration_delete_lesson_text_annotation(uuid, uuid)
to service_role;

revoke all on function public.integration_api_consume_tts_quota(uuid)
from public, anon, authenticated;
grant execute on function public.integration_api_consume_tts_quota(uuid)
to service_role;

comment on table public.integration_api_keys is
  'Server-managed, revocable integration keys. Raw secrets are never stored or returned after creation.';
comment on function public.integration_api_consume_tts_quota(uuid) is
  'Atomic fixed-window 10 request per minute quota for a single active integration API key.';

commit;
