begin;

-- All fixtures are transaction-local; no real account or session is modified.
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_owner_id uuid := gen_random_uuid();
  session_id uuid;
  first_session_id uuid;
  sixth_session_id uuid;
  event jsonb;
  result jsonb;
  method text;
  total_sessions integer;
begin
  insert into auth.users (id, aud, role) values
    (owner_id, 'authenticated', 'authenticated'),
    (other_owner_id, 'authenticated', 'authenticated');

  -- 1. Create first 5 sessions (all should succeed within the 5-session cap)
  for i in 1..5 loop
    session_id := gen_random_uuid();
    if i = 1 then first_session_id := session_id; end if;
    insert into auth.sessions (id, user_id, created_at, updated_at)
    values (session_id, owner_id, now() + (i || ' seconds')::interval, now() + (i || ' seconds')::interval);
    event := jsonb_build_object(
      'user_id', owner_id, 'authentication_method', 'password',
      'claims', jsonb_build_object('session_id', session_id, 'sub', owner_id, 'role', 'authenticated')
    );
    result := public.hanzihome_limit_auth_sessions(event);
    if result -> 'claims' is distinct from event -> 'claims' then
      raise exception 'Session % must be admitted with unchanged claims', i;
    end if;
  end loop;

  select count(*) into total_sessions from auth.sessions where user_id = owner_id;
  if total_sessions <> 5 then
    raise exception 'Expected exactly 5 active sessions, got %', total_sessions;
  end if;

  -- 2. Create 6th session: Should succeed and automatically evict the oldest session (first_session_id)
  sixth_session_id := gen_random_uuid();
  insert into auth.sessions (id, user_id, created_at, updated_at)
  values (sixth_session_id, owner_id, now() + interval '10 seconds', now() + interval '10 seconds');
  event := jsonb_set(event, '{claims,session_id}', to_jsonb(sixth_session_id));

  foreach method in array array['password', 'oauth', 'otp', 'magiclink', 'recovery'] loop
    event := jsonb_set(event, '{authentication_method}', to_jsonb(method));
    result := public.hanzihome_limit_auth_sessions(event);
    if result -> 'claims' is distinct from event -> 'claims' then
      raise exception 'Sixth session must be admitted with claims for method %', method;
    end if;
  end loop;

  -- Verify first_session_id was evicted and total count is still 5
  if exists (select 1 from auth.sessions where id = first_session_id) then
    raise exception 'Oldest session (%) should have been evicted', first_session_id;
  end if;

  select count(*) into total_sessions from auth.sessions where user_id = owner_id;
  if total_sessions <> 5 then
    raise exception 'Total active sessions must remain capped at 5, got %', total_sessions;
  end if;

  -- 3. Token refresh must preserve existing sessions without evicting
  foreach method in array array['token_refresh', 'totp', 'email_change'] loop
    event := jsonb_set(event, '{authentication_method}', to_jsonb(method));
    result := public.hanzihome_limit_auth_sessions(event);
    if result -> 'claims' is distinct from event -> 'claims' then
      raise exception 'Existing session must survive %', method;
    end if;
  end loop;

  select count(*) into total_sessions from auth.sessions where user_id = owner_id;
  if total_sessions <> 5 then
    raise exception 'Hook must not delete sessions on refresh, got %', total_sessions;
  end if;

  -- 4. Session ownership check
  result := public.hanzihome_limit_auth_sessions(
    jsonb_set(event, '{user_id}', to_jsonb(other_owner_id))
  );
  if result #>> '{error,message}' is distinct from 'HANZIHOME_AUTH_SESSION_INVALID' then
    raise exception 'Session ownership must be checked even for refresh';
  end if;

  -- 5. Expired sessions cleanup
  insert into auth.sessions (id, user_id, created_at, updated_at, not_after)
  values (gen_random_uuid(), owner_id, now(), now(), now() - interval '1 minute');
  event := jsonb_set(event, '{authentication_method}', '"password"');
  result := public.hanzihome_limit_auth_sessions(event);
  if result -> 'claims' is distinct from event -> 'claims' then
    raise exception 'Expired sessions must not block admissions';
  end if;

  -- 6. Another user must have independent session slots
  session_id := gen_random_uuid();
  insert into auth.sessions (id, user_id, created_at, updated_at)
  values (session_id, other_owner_id, now(), now());
  event := jsonb_set(jsonb_set(event, '{user_id}', to_jsonb(other_owner_id)),
    '{claims,session_id}', to_jsonb(session_id));
  result := public.hanzihome_limit_auth_sessions(event);
  if result -> 'claims' is distinct from event -> 'claims' then
    raise exception 'Another user must have independent slots';
  end if;
end;
$$;

do $$
begin
  if not has_function_privilege('supabase_auth_admin', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute')
    or not has_table_privilege('supabase_auth_admin', 'auth.sessions', 'select')
    or not has_table_privilege('supabase_auth_admin', 'auth.sessions', 'delete') then
    raise exception 'Auth must be able to execute the hook and manage its own sessions';
  end if;
  if has_function_privilege('anon', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute')
    or has_function_privilege('authenticated', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute')
    or has_function_privilege('service_role', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute') then
    raise exception 'Only Auth may invoke the session limit hook';
  end if;
end;
$$;

rollback;
