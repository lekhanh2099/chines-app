begin;

create table public.note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid,
  name text not null check (
    char_length(trim(name)) between 1 and 80
  ),
  color text not null default 'purple' check (
    color in ('purple', 'blue', 'green', 'orange', 'rose', 'slate')
  ),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint note_folders_user_id_id_unique unique (user_id, id),
  constraint note_folders_parent_not_self check (parent_id is null or parent_id <> id),
  constraint note_folders_user_parent_fk
    foreign key (user_id, parent_id)
    references public.note_folders(user_id, id)
    on delete set null (parent_id)
);

create or replace function public.validate_note_folder_depth()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_parent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select folder.parent_id
  into parent_parent_id
  from public.note_folders as folder
  where folder.id = new.parent_id
    and folder.user_id = new.user_id;

  if not found then
    raise exception 'Parent note folder does not exist or is not owned by the current user';
  end if;

  if parent_parent_id is not null then
    raise exception 'Note folders support at most two levels';
  end if;

  if exists (
    select 1
    from public.note_folders as child
    where child.parent_id = new.id
      and child.user_id = new.user_id
  ) then
    raise exception 'A note folder with children cannot be moved below another folder';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_note_folder_depth() from public;

create trigger validate_note_folder_depth_before_write
before insert or update of parent_id, user_id
on public.note_folders
for each row
execute function public.validate_note_folder_depth();

create or replace function public.touch_note_folder_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.touch_note_folder_updated_at() from public;

create trigger touch_note_folder_updated_at_before_update
before update on public.note_folders
for each row
execute function public.touch_note_folder_updated_at();

alter table public.notes
  add column folder_id uuid,
  add column reading_status text check (
    reading_status is null or reading_status in ('inbox', 'reading', 'completed')
  ),
  add column source_url text check (
    source_url is null or source_url ~* '^https?://'
  ),
  add column source_host text,
  add column source_label text,
  add column source_author text,
  add column source_published_at date,
  add column source_captured_at timestamptz;

alter table public.notes
  add constraint notes_user_folder_fk
  foreign key (user_id, folder_id)
  references public.note_folders(user_id, id)
  on delete set null (folder_id);

create index note_folders_user_parent_position_idx
on public.note_folders(user_id, parent_id, position, updated_at desc);

create index notes_user_folder_updated_idx
on public.notes(user_id, folder_id, updated_at desc);

create index notes_user_reading_status_updated_idx
on public.notes(user_id, reading_status, updated_at desc)
where reading_status is not null;

create index notes_user_source_host_updated_idx
on public.notes(user_id, source_host, updated_at desc)
where source_host is not null;

alter table public.note_folders enable row level security;

create policy "Users can read own note folders"
on public.note_folders
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own note folders"
on public.note_folders
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own note folders"
on public.note_folders
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own note folders"
on public.note_folders
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.note_folders to authenticated;

commit;
