begin;
set local lock_timeout = '5s';

create function public.hanzihome_upsert_pdf_annotation_cas(
 p_asset_id text,
 p_page_number integer,
 p_payload jsonb,
 p_expected_revision integer,
 p_expected_absent boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 owner_id uuid := auth.uid();
 current_row public.hanzihome_pdf_annotations;
 next_row public.hanzihome_pdf_annotations;
 row_exists boolean;
begin
 if owner_id is null then
  raise exception 'Authentication required' using errcode = '28000';
 end if;
 if p_asset_id is null or length(btrim(p_asset_id)) = 0
  or p_page_number is null or p_page_number <= 0
  or p_expected_revision is null or p_expected_revision < 0
  or p_expected_absent is null
  or (p_expected_absent and p_expected_revision <> 0)
  or p_payload is null or jsonb_typeof(p_payload) <> 'object'
  or jsonb_typeof(p_payload->'strokes') is distinct from 'array' then
  raise exception 'Invalid PDF annotation patch' using errcode = '22023';
 end if;

 perform pg_advisory_xact_lock(hashtextextended(
  p_asset_id || ':' || p_page_number::text || ':' || owner_id::text, 0
 ));
 select * into current_row from public.hanzihome_pdf_annotations
 where user_id = owner_id and asset_id = p_asset_id and page_number = p_page_number
 for update;
 row_exists := found;

 if (p_expected_absent and row_exists)
  or (not p_expected_absent and (not row_exists or current_row.revision <> p_expected_revision)) then
  return jsonb_build_object('saved', false, 'annotation',
   case when row_exists then to_jsonb(current_row) else null end);
 end if;

 if p_expected_absent then
  insert into public.hanzihome_pdf_annotations (user_id, asset_id, page_number, payload, revision)
  values (owner_id, p_asset_id, p_page_number, p_payload, 0) returning * into next_row;
 else
  update public.hanzihome_pdf_annotations
  set payload = p_payload, revision = current_row.revision + 1
  where id = current_row.id and user_id = owner_id returning * into next_row;
 end if;
 return jsonb_build_object('saved', true, 'annotation', to_jsonb(next_row));
end;
$$;
revoke all on function public.hanzihome_upsert_pdf_annotation_cas(text,integer,jsonb,integer,boolean) from public, anon;
grant execute on function public.hanzihome_upsert_pdf_annotation_cas(text,integer,jsonb,integer,boolean) to authenticated;

comment on function public.hanzihome_upsert_pdf_annotation_cas(text,integer,jsonb,integer,boolean) is
'Owner-fenced PDF CAS with explicit observed absence; returns the full locked success/conflict snapshot without changing existing revision-zero rows.';
commit;
