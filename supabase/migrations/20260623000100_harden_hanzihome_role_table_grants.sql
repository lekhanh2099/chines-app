begin;

revoke all on table public.hanzihome_content_roles from anon, authenticated;
grant select on table public.hanzihome_content_roles to authenticated;

do $$
begin
  if to_regclass('public.hanzihome_content_editors') is not null then
    execute 'revoke all on table public.hanzihome_content_editors from anon, authenticated';
    execute 'grant select on table public.hanzihome_content_editors to authenticated';
  end if;
end
$$;

commit;
