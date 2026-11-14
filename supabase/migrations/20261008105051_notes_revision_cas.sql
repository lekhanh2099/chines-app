begin;
set local lock_timeout = '5s';

-- Additive, constant default: existing notes start at revision 0.
alter table public.notes add column revision integer not null default 0 check (revision >= 0);

create function public.advance_note_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.advance_note_revision() from public, anon, authenticated;
create trigger advance_note_revision_before_update
before update on public.notes for each row execute function public.advance_note_revision();

create function public.update_note_with_revision(
  p_note_id uuid,
  p_expected_owner uuid,
  p_expected_revision integer,
  p_changes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  current_note public.notes;
  changed_note public.notes;
  saved_note public.notes;
begin
  if owner_id is null or owner_id is distinct from p_expected_owner then
    raise exception 'NOTE_OWNER_MISMATCH' using errcode = '42501';
  end if;
  if p_expected_revision is null or p_expected_revision < 0
    or jsonb_typeof(p_changes) is distinct from 'object' or p_changes = '{}'::jsonb then
    raise exception 'INVALID_NOTE_PATCH' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_changes) as field(name)
    where name <> all(array[
      'content', 'reading_content', 'title', 'category', 'split_view_enabled',
      'folder_id', 'reading_status', 'source_url', 'source_host', 'source_label',
      'source_author', 'source_published_at', 'source_captured_at'
    ])
  ) then
    raise exception 'INVALID_NOTE_PATCH_FIELD' using errcode = '22023';
  end if;

  select * into current_note from public.notes
  where id = p_note_id and user_id = owner_id for update;
  if not found then raise exception 'NOTE_NOT_FOUND' using errcode = '42501'; end if;
  if current_note.revision <> p_expected_revision then
    raise exception 'NOTE_REVISION_CONFLICT' using errcode = '40001';
  end if;
  select * into changed_note from jsonb_populate_record(current_note, p_changes);
  if changed_note.content is null or jsonb_typeof(changed_note.content) <> 'object'
    or (changed_note.reading_content is not null and jsonb_typeof(changed_note.reading_content) <> 'object')
    or changed_note.title is null or changed_note.category is null or changed_note.split_view_enabled is null then
    raise exception 'INVALID_NOTE_PATCH_VALUE' using errcode = '22023';
  end if;

  -- The composite notes_user_folder_fk verifies folder membership for this owner.
  update public.notes set
    content = changed_note.content,
    reading_content = changed_note.reading_content,
    title = changed_note.title,
    category = changed_note.category,
    split_view_enabled = changed_note.split_view_enabled,
    folder_id = changed_note.folder_id,
    reading_status = changed_note.reading_status,
    source_url = changed_note.source_url,
    source_host = changed_note.source_host,
    source_label = changed_note.source_label,
    source_author = changed_note.source_author,
    source_published_at = changed_note.source_published_at,
    source_captured_at = changed_note.source_captured_at
  where id = p_note_id and user_id = owner_id returning * into saved_note;
  return to_jsonb(saved_note);
end;
$$;
revoke all on function public.update_note_with_revision(uuid, uuid, integer, jsonb) from public, anon;
grant execute on function public.update_note_with_revision(uuid, uuid, integer, jsonb) to authenticated;
-- Expand phase retains legacy UPDATE until the app/writers have migrated.
comment on function public.update_note_with_revision(uuid, uuid, integer, jsonb) is
'Owner-fenced note CAS. Rejects stale revisions and returns the authoritative updated row.';

commit;
