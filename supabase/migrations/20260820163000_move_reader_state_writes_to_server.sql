begin;

-- BFF routes authenticate the user before using service-role authority. These
-- wrappers preserve the existing optimistic-concurrency RPC behavior while
-- making browser execution unnecessary.
create or replace function public.hanzihome_upsert_personal_learning_state_as_server(p_user_id uuid, p_node_id text, p_state jsonb, p_expected_revision integer)
returns public.hanzihome_personal_learning_state language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_personal_learning_state(p_node_id, p_state, p_expected_revision);
end;
$$;

create or replace function public.hanzihome_upsert_daily_reading_state_as_server(p_user_id uuid, p_published_date date, p_state jsonb, p_expected_revision integer)
returns public.hanzihome_daily_reading_state language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_daily_reading_state(p_published_date, p_state, p_expected_revision);
end;
$$;

create or replace function public.hanzihome_update_reader_annotation_as_server(p_user_id uuid, p_annotation_id uuid, p_asset_id text, p_color text, p_end_offset integer, p_expected_revision integer, p_note_text text, p_page_number integer, p_payload jsonb, p_paragraph_id text, p_selected_text text, p_start_offset integer)
returns public.hanzihome_reader_annotations language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_update_reader_annotation(p_annotation_id, p_asset_id, p_color, p_end_offset, p_expected_revision, p_note_text, p_page_number, p_payload, p_paragraph_id, p_selected_text, p_start_offset);
end;
$$;

create or replace function public.hanzihome_delete_reader_annotation_as_server(p_user_id uuid, p_annotation_id uuid, p_expected_revision integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_annotation(p_annotation_id, p_expected_revision);
end;
$$;

create or replace function public.hanzihome_upsert_reader_pronunciation_override_as_server(p_user_id uuid, p_override_id uuid, p_document_id text, p_paragraph_id text, p_text text, p_readings text[], p_scope text, p_sentence_text text, p_start_offset integer, p_end_offset integer, p_expected_revision integer)
returns public.hanzihome_reader_pronunciation_overrides language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_upsert_reader_pronunciation_override(p_override_id, p_document_id, p_paragraph_id, p_text, p_readings, p_scope, p_sentence_text, p_start_offset, p_end_offset, p_expected_revision);
end;
$$;

create or replace function public.hanzihome_delete_reader_pronunciation_override_as_server(p_user_id uuid, p_override_id uuid, p_expected_revision integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_delete_reader_pronunciation_override(p_override_id, p_expected_revision);
end;
$$;

create or replace function public.hanzihome_rate_learning_loop_item_as_server(p_user_id uuid, p_item_id text, p_rating text, p_expected_revision integer)
returns public.hanzihome_learning_loop_items language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  return public.hanzihome_rate_learning_loop_item(p_item_id, p_rating, p_expected_revision);
end;
$$;

revoke all on table public.hanzihome_reader_progress, public.hanzihome_reader_annotations, public.hanzihome_reader_pronunciation_overrides, public.hanzihome_personal_learning_state, public.hanzihome_daily_reading_state, public.hanzihome_practice_attempts, public.hanzihome_learning_loop_items from anon, authenticated;

grant select, insert, update, delete on table
  public.user_learning_state,
  public.user_vocab_progress,
  public.hanzihome_reader_progress,
  public.hanzihome_reader_annotations,
  public.hanzihome_reader_pronunciation_overrides,
  public.hanzihome_personal_learning_state,
  public.hanzihome_daily_reading_state,
  public.hanzihome_practice_attempts,
  public.hanzihome_learning_loop_items
to service_role;

revoke execute on function public.hanzihome_upsert_reader_progress(text, boolean, boolean, boolean, text, jsonb, integer), public.hanzihome_upsert_personal_learning_state(text, jsonb, integer), public.hanzihome_upsert_daily_reading_state(date, jsonb, integer), public.hanzihome_update_reader_annotation(uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer), public.hanzihome_delete_reader_annotation(uuid, integer), public.hanzihome_upsert_reader_pronunciation_override(uuid, text, text, text, text[], text, text, integer, integer, integer), public.hanzihome_delete_reader_pronunciation_override(uuid, integer), public.hanzihome_rate_learning_loop_item(text, text, integer) from public, anon, authenticated;

revoke execute on function public.hanzihome_upsert_personal_learning_state_as_server(uuid, text, jsonb, integer), public.hanzihome_upsert_daily_reading_state_as_server(uuid, date, jsonb, integer), public.hanzihome_update_reader_annotation_as_server(uuid, uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer), public.hanzihome_delete_reader_annotation_as_server(uuid, uuid, integer), public.hanzihome_upsert_reader_pronunciation_override_as_server(uuid, uuid, text, text, text, text[], text, text, integer, integer, integer), public.hanzihome_delete_reader_pronunciation_override_as_server(uuid, uuid, integer), public.hanzihome_rate_learning_loop_item_as_server(uuid, text, text, integer) from public, anon, authenticated;

grant execute on function public.hanzihome_upsert_personal_learning_state_as_server(uuid, text, jsonb, integer), public.hanzihome_upsert_daily_reading_state_as_server(uuid, date, jsonb, integer), public.hanzihome_update_reader_annotation_as_server(uuid, uuid, text, text, integer, integer, text, integer, jsonb, text, text, integer), public.hanzihome_delete_reader_annotation_as_server(uuid, uuid, integer), public.hanzihome_upsert_reader_pronunciation_override_as_server(uuid, uuid, text, text, text, text[], text, text, integer, integer, integer), public.hanzihome_delete_reader_pronunciation_override_as_server(uuid, uuid, integer), public.hanzihome_rate_learning_loop_item_as_server(uuid, text, text, integer) to service_role;

commit;
