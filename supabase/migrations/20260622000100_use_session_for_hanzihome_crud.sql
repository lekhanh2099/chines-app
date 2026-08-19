begin;

create or replace function public.can_edit_hanzihome_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.hanzihome_content_roles role_assignment
      where role_assignment.user_id = (select auth.uid())
        and role_assignment.role in ('editor', 'admin')
    );
$$;

revoke all on function public.can_edit_hanzihome_content() from public, anon, authenticated;
grant execute on function public.can_edit_hanzihome_content() to authenticated;

comment on function public.can_edit_hanzihome_content() is
  'Returns true when the current authenticated session has an editor or admin HanziHome content role.';

drop policy if exists "Authenticated users can read HanziHome content audit log"
on public.hanzihome_content_audit_log;

drop policy if exists "HanziHome editors can read content audit log"
on public.hanzihome_content_audit_log;

create policy "HanziHome editors can read content audit log"
on public.hanzihome_content_audit_log
for select
to authenticated
using ((select public.can_edit_hanzihome_content()));

do $$
declare
  target_table_name text;
begin
  foreach target_table_name in array array[
    'hanzihome_courses',
    'hanzihome_course_books',
    'hanzihome_lessons',
    'hanzihome_lesson_sections',
    'hanzihome_lesson_texts',
    'hanzihome_vocab_items',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_detail_sections',
    'hanzihome_grammar_points',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_detail_sections'
  ]
  loop
    execute format(
      'drop policy if exists "HanziHome editors can read deleted content" on public.%I',
      target_table_name
    );
    execute format(
      'create policy "HanziHome editors can read deleted content" on public.%I for select to authenticated using ((select public.can_edit_hanzihome_content()))',
      target_table_name
    );
    execute format(
      'revoke insert, update, delete on table public.%I from anon, authenticated',
      target_table_name
    );
  end loop;
end $$;

create or replace function public.hanzihome_mutate_content_as_user(
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
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;

  if not (select public.can_edit_hanzihome_content()) then
    raise exception using errcode = '42501', message = 'HanziHome editor role is required';
  end if;

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

revoke all on function public.hanzihome_mutate_content_as_user(
  text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
from public, anon, authenticated;

grant execute on function public.hanzihome_mutate_content_as_user(
  text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
to authenticated;

comment on function public.hanzihome_mutate_content_as_user(
  text, text, text, timestamptz, jsonb, text, text, text, text, text, text
) is
  'Session-authenticated HanziHome CRUD boundary. Resolves auth.uid(), requires an editor/admin role, and delegates to the atomic mutation and audit transaction.';

commit;
