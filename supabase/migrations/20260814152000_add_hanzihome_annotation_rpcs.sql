begin;

create or replace function public.hanzihome_update_reader_annotation(
  p_annotation_id uuid,
  p_asset_id text,
  p_color text,
  p_end_offset integer,
  p_expected_revision integer,
  p_note_text text,
  p_page_number integer,
  p_payload jsonb,
  p_paragraph_id text,
  p_selected_text text,
  p_start_offset integer
)
returns public.hanzihome_reader_annotations
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_reader_annotations;
  next_row public.hanzihome_reader_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative';
  end if;
  select * into current_row
  from public.hanzihome_reader_annotations
  where id = p_annotation_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader annotation not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader annotation changed since it was loaded';
  end if;

  update public.hanzihome_reader_annotations
  set paragraph_id = nullif(p_paragraph_id, ''),
      asset_id = nullif(p_asset_id, ''),
      page_number = case when p_page_number < 0 then null else p_page_number end,
      start_offset = case when p_start_offset < 0 then null else p_start_offset end,
      end_offset = case when p_end_offset < 0 then null else p_end_offset end,
      selected_text = p_selected_text,
      note_text = p_note_text,
      color = p_color,
      payload = p_payload,
      revision = current_row.revision + 1
  where id = p_annotation_id and user_id = auth.uid()
  returning * into next_row;
  return next_row;
end;
$$;

create or replace function public.hanzihome_delete_reader_annotation(
  p_annotation_id uuid,
  p_expected_revision integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.hanzihome_reader_annotations;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into current_row
  from public.hanzihome_reader_annotations
  where id = p_annotation_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Reader annotation not found';
  end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Reader annotation changed since it was loaded';
  end if;
  update public.hanzihome_reader_annotations
  set deleted_at = now(), revision = current_row.revision + 1
  where id = p_annotation_id and user_id = auth.uid();
  return true;
end;
$$;

revoke all on function public.hanzihome_update_reader_annotation(uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer)
from public, anon;
grant execute on function public.hanzihome_update_reader_annotation(uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer)
to authenticated;

revoke all on function public.hanzihome_delete_reader_annotation(uuid, integer)
from public, anon;
grant execute on function public.hanzihome_delete_reader_annotation(uuid, integer)
to authenticated;

commit;
