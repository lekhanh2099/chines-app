begin;

-- All fixtures are transaction-local; no real account or session is modified.
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_owner_id uuid := gen_random_uuid();
  session_id uuid;
  first_session_id uuid;
  event jsonb;
  result jsonb;
  method text;
begin
  insert into auth.users (id, aud, role) values
    (owner_id, 'authenticated', 'authenticated'),
    (other_owner_id, 'authenticated', 'authenticated');

  for i in 1..3 loop
    session_id := gen_random_uuid();
    if i = 1 then first_session_id := session_id; end if;
    insert into auth.sessions (id, user_id, created_at, updated_at)
    values (session_id, owner_id, now(), now());
    event := jsonb_build_object(
      'user_id', owner_id, 'authentication_method', 'password',
      'claims', jsonb_build_object('session_id', session_id, 'sub', owner_id, 'role', 'authenticated')
    );
    result := public.hanzihome_limit_auth_sessions(event);
    if result -> 'claims' is distinct from event -> 'claims' then
      raise exception 'Session % must be admitted with unchanged claims', i;
    end if;
  end loop;

  session_id := gen_random_uuid();
  insert into auth.sessions (id, user_id, created_at, updated_at)
  values (session_id, owner_id, now(), now());
  event := jsonb_set(event, '{claims,session_id}', to_jsonb(session_id));
  foreach method in array array['password', 'oauth', 'otp', 'magiclink', 'recovery'] loop
    event := jsonb_set(event, '{authentication_method}', to_jsonb(method));
    result := public.hanzihome_limit_auth_sessions(event);
    if result #>> '{error,message}' is distinct from 'HANZIHOME_SESSION_LIMIT_REACHED'
      or result #>> '{error,http_code}' is distinct from '403' then
      raise exception 'Fourth session must be rejected for %', method;
    end if;
  end loop;

  -- Grandfather existing sessions even if an account starts above the cap.
  foreach method in array array['token_refresh', 'totp', 'email_change'] loop
    event := jsonb_set(event, '{authentication_method}', to_jsonb(method));
    result := public.hanzihome_limit_auth_sessions(event);
    if result -> 'claims' is distinct from event -> 'claims' then
      raise exception 'Existing session must survive %', method;
    end if;
  end loop;
  if (select count(*) from auth.sessions where user_id = owner_id) <> 4 then
    raise exception 'Hook must not delete existing sessions';
  end if;

  result := public.hanzihome_limit_auth_sessions(
    jsonb_set(event, '{user_id}', to_jsonb(other_owner_id))
  );
  if result #>> '{error,message}' is distinct from 'HANZIHOME_AUTH_SESSION_INVALID' then
    raise exception 'Session ownership must be checked even for refresh';
  end if;

  -- Supabase local logout removes this session, freeing one slot only.
  delete from auth.sessions where id = first_session_id;
  event := jsonb_set(event, '{authentication_method}', '"password"');
  result := public.hanzihome_limit_auth_sessions(event);
  if result -> 'claims' is distinct from event -> 'claims' then
    raise exception 'Signing out one session must free a slot';
  end if;

  insert into auth.sessions (id, user_id, created_at, updated_at, not_after)
  values (gen_random_uuid(), owner_id, now(), now(), now() - interval '1 minute');
  result := public.hanzihome_limit_auth_sessions(event);
  if result -> 'claims' is distinct from event -> 'claims' then
    raise exception 'Expired sessions must not occupy slots';
  end if;

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
    or not has_table_privilege('supabase_auth_admin', 'auth.sessions', 'select') then
    raise exception 'Auth must be able to execute the hook and read its own sessions';
  end if;
  if has_function_privilege('anon', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute')
    or has_function_privilege('authenticated', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute')
    or has_function_privilege('service_role', 'public.hanzihome_limit_auth_sessions(jsonb)', 'execute') then
    raise exception 'Only Auth may invoke the session limit hook';
  end if;
end;
$$;

rollback;
