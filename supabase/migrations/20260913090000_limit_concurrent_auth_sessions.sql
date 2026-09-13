begin;

-- Auth owns session identity and lifetime. Do not duplicate sessions in public tables.
create function public.hanzihome_limit_auth_sessions(event jsonb)
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

  -- Refresh and MFA/email changes reuse an admitted session. Existing sessions,
  -- including accounts already above the limit at rollout, must not be evicted.
  if event ->> 'authentication_method' in ('token_refresh', 'totp', 'email_change') then
    return jsonb_build_object('claims', event -> 'claims');
  end if;

  -- The hook shares Auth's token-issuance transaction. Serialize admissions for
  -- this user so two simultaneous logins cannot both take the third slot.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hanzihome-auth-sessions:' || owner_id::text, 0)
  );

  select count(*) into other_sessions from (
    select 1 from auth.sessions
    where user_id = owner_id
      and id <> current_session_id
      and (not_after is null or not_after > now())
    limit 3
  ) active_sessions;

  if other_sessions >= 3 then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'HANZIHOME_SESSION_LIMIT_REACHED'
    ));
  end if;

  return jsonb_build_object('claims', event -> 'claims');
end;
$$;

revoke all on function public.hanzihome_limit_auth_sessions(jsonb)
from public, anon, authenticated, service_role;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hanzihome_limit_auth_sessions(jsonb) to supabase_auth_admin;

comment on function public.hanzihome_limit_auth_sessions(jsonb) is
'Auth-only token hook: admit at most three concurrent sessions per user; preserve existing refreshes. Session timebox/inactivity remain disabled; revisit counting if those Auth settings change.';

commit;
