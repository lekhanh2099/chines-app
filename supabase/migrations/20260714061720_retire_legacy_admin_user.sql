do $$
declare
  source_user uuid;
  target_user uuid;
begin
  select id into source_user
  from auth.users
  where lower(email) = 'admin@gmail.com';

  select id into target_user
  from auth.users
  where lower(email) = 'lekhanh2099@gmail.com';

  if source_user is null then
    raise exception 'Legacy admin user was not found';
  end if;

  if target_user is null then
    raise exception 'Target Google user was not found';
  end if;

  if exists (
    select 1
    from public.hanzihome_content_audit_log
    where actor_id = source_user
  ) then
    update public.hanzihome_content_audit_log
    set actor_id = target_user
    where actor_id = source_user;
  end if;

  delete from auth.users
  where id = source_user;

  if exists (select 1 from auth.users where id = source_user) then
    raise exception 'Legacy admin user still exists after retirement';
  end if;
end
$$;
