begin;

-- Replace hard session cap rejection with automatic eviction of the oldest sessions
-- when exceeding 5 concurrent sessions per user.
create or replace function public.hanzihome_limit_auth_sessions(event jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := (event ->> 'user_id')::uuid;
  current_session_id uuid := (event #>> '{claims,session_id}')::uuid;
  other_sessions integer;
begin
  if owner_id is null or current_session_id is null or not exists (
    select 1 from auth.sessions
    where id = current_session_id and user_id = owner_id
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'HANZIHOME_AUTH_SESSION_INVALID'
    ));
  end if;

  -- Refresh and MFA/email changes reuse an admitted session. Existing sessions
  -- must not be evicted on token refresh.
  if event ->> 'authentication_method' in ('token_refresh', 'totp', 'email_change') then
    return jsonb_build_object('claims', event -> 'claims');
  end if;

  -- The hook shares Auth's token-issuance transaction. Serialize admissions for
  -- this user so simultaneous logins serialize cleanly.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hanzihome-auth-sessions:' || owner_id::text, 0)
  );

  -- Clean up explicitly expired sessions first
  delete from auth.sessions
  where user_id = owner_id
    and id <> current_session_id
    and not_after <= now();

  -- Count remaining active sessions excluding the current one
  select count(*) into other_sessions from auth.sessions
  where user_id = owner_id
    and id <> current_session_id
    and (not_after is null or not_after > now());

  -- Keep at most 5 concurrent sessions total (current session + 4 other sessions).
  -- If there are 5 or more other sessions, evict the oldest ones.
  if other_sessions >= 5 then
    delete from auth.sessions
    where id in (
      select id from auth.sessions
      where user_id = owner_id
        and id <> current_session_id
        and (not_after is null or not_after > now())
      order by coalesce(updated_at, created_at) asc, created_at asc
      limit (other_sessions - 4)
    );
  end if;

  return jsonb_build_object('claims', event -> 'claims');
end;
$$;

revoke all on function public.hanzihome_limit_auth_sessions(jsonb)
from public, anon, authenticated, service_role;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hanzihome_limit_auth_sessions(jsonb) to supabase_auth_admin;

comment on function public.hanzihome_limit_auth_sessions(jsonb) is
'Auth token hook: admit up to 5 concurrent sessions per user. Automatically evicts the oldest session when the cap is exceeded; preserves existing refreshes.';

commit;
