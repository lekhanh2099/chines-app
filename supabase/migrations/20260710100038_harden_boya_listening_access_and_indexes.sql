-- Tighten privileges and remove duplicate permissive SELECT policies created by FOR ALL.

revoke all privileges on table public.hanzihome_listening_items from anon, authenticated;
revoke all privileges on table public.hanzihome_listening_audio from anon, authenticated;
revoke all privileges on table public.hanzihome_listening_item_progress from anon, authenticated;
revoke all privileges on table public.hanzihome_listening_attempts from anon, authenticated;

grant select on table public.hanzihome_listening_items, public.hanzihome_listening_audio to anon;
grant select, insert, update, delete on table public.hanzihome_listening_items, public.hanzihome_listening_audio to authenticated;
grant select, insert, update, delete on table public.hanzihome_listening_item_progress, public.hanzihome_listening_attempts to authenticated;

drop policy if exists "Boya listening public reads" on public.hanzihome_listening_items;
drop policy if exists "Boya listening editors read all" on public.hanzihome_listening_items;
drop policy if exists "Boya listening editors write" on public.hanzihome_listening_items;

create policy "Boya listening anonymous published reads"
on public.hanzihome_listening_items
for select to anon
using (deleted_at is null and publication_status = 'published');

create policy "Boya listening authenticated reads"
on public.hanzihome_listening_items
for select to authenticated
using (
  (deleted_at is null and publication_status = 'published')
  or (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening authenticated inserts"
on public.hanzihome_listening_items
for insert to authenticated
with check (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening authenticated updates"
on public.hanzihome_listening_items
for update to authenticated
using (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
)
with check (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening authenticated deletes"
on public.hanzihome_listening_items
for delete to authenticated
using (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

drop policy if exists "Boya listening audio public reads" on public.hanzihome_listening_audio;
drop policy if exists "Boya listening audio editors" on public.hanzihome_listening_audio;

create policy "Boya listening audio anonymous published reads"
on public.hanzihome_listening_audio
for select to anon
using (deleted_at is null and publication_status = 'published');

create policy "Boya listening audio authenticated reads"
on public.hanzihome_listening_audio
for select to authenticated
using (
  (deleted_at is null and publication_status = 'published')
  or (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening audio authenticated inserts"
on public.hanzihome_listening_audio
for insert to authenticated
with check (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening audio authenticated updates"
on public.hanzihome_listening_audio
for update to authenticated
using (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
)
with check (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create policy "Boya listening audio authenticated deletes"
on public.hanzihome_listening_audio
for delete to authenticated
using (
  (select public.can_edit_hanzihome_content())
  or (source = 'custom' and owner_id = (select auth.uid()))
);

create index if not exists hanzihome_listening_items_section_idx
  on public.hanzihome_listening_items (section_id)
  where section_id is not null;
create index if not exists hanzihome_listening_items_owner_idx
  on public.hanzihome_listening_items (owner_id)
  where owner_id is not null;
create index if not exists hanzihome_listening_items_deleted_by_idx
  on public.hanzihome_listening_items (deleted_by)
  where deleted_by is not null;

create index if not exists hanzihome_listening_audio_lesson_idx
  on public.hanzihome_listening_audio (lesson_id)
  where deleted_at is null;
create index if not exists hanzihome_listening_audio_section_idx
  on public.hanzihome_listening_audio (section_id)
  where section_id is not null;
create index if not exists hanzihome_listening_audio_owner_idx
  on public.hanzihome_listening_audio (owner_id)
  where owner_id is not null;

create index if not exists hanzihome_listening_progress_item_idx
  on public.hanzihome_listening_item_progress (item_id);
create index if not exists hanzihome_listening_attempts_item_idx
  on public.hanzihome_listening_attempts (item_id);
