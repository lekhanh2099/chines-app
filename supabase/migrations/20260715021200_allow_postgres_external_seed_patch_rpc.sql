create or replace function public.hanzihome_apply_external_seed_patches(p_patches jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_group jsonb;
  v_patch jsonb;
  v_collection text;
  v_id text;
  v_path text[];
  v_value jsonb;
  v_updated integer := 0;
begin
  if auth.role() <> 'service_role' and session_user <> 'postgres' then
    raise exception 'service_role or postgres is required';
  end if;

  if jsonb_typeof(p_patches) <> 'array' then
    raise exception 'p_patches must be a JSON array';
  end if;

  for v_group in select value from jsonb_array_elements(p_patches)
  loop
    v_collection := v_group ->> 'collection';
    v_id := v_group ->> 'id';

    if v_collection not in ('lessonSections', 'lessonTexts', 'vocabItems') or v_id is null then
      raise exception 'Unsupported patch target: %/%', v_collection, v_id;
    end if;

    for v_patch in select value from jsonb_array_elements(v_group -> 'patches')
    loop
      select array_agg(value order by ordinality)
      into v_path
      from jsonb_array_elements_text(v_patch -> 'path') with ordinality;
      v_value := v_patch -> 'value';

      if v_collection = 'lessonSections' then
        if v_path[1] <> 'payload' or coalesce(array_length(v_path, 1), 0) < 2 then
          raise exception 'Unsupported lesson section path: %', v_path;
        end if;
        update public.hanzihome_lesson_sections
        set payload = jsonb_set(payload, v_path[2:array_length(v_path, 1)], v_value, true), updated_at = now()
        where id = v_id::uuid and source = 'seed';
      elsif v_collection = 'lessonTexts' then
        if v_path = array['content'] then
          update public.hanzihome_lesson_texts set content = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
        elsif v_path = array['title'] then
          update public.hanzihome_lesson_texts set title = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
        else
          raise exception 'Unsupported lesson text path: %', v_path;
        end if;
      elsif v_collection = 'vocabItems' then
        case v_path[1]
          when 'han_viet' then update public.hanzihome_vocab_items set han_viet = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pinyin' then update public.hanzihome_vocab_items set pinyin = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'meaning' then update public.hanzihome_vocab_items set meaning = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'word' then update public.hanzihome_vocab_items set word = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pos_vi' then update public.hanzihome_vocab_items set pos_vi = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'pos_zh' then update public.hanzihome_vocab_items set pos_zh = v_value #>> '{}', updated_at = now() where id = v_id and source = 'seed';
          when 'tags' then update public.hanzihome_vocab_items set tags = array(select jsonb_array_elements_text(v_value)), updated_at = now() where id = v_id and source = 'seed';
          else raise exception 'Unsupported vocab item path: %', v_path;
        end case;
      end if;

      if not found then
        raise exception 'Seed row not found for patch target: %/%', v_collection, v_id;
      end if;
      v_updated := v_updated + 1;
    end loop;
  end loop;

  return jsonb_build_object('patchedFields', v_updated);
end;
$function$;

revoke all on function public.hanzihome_apply_external_seed_patches(jsonb) from public;
revoke all on function public.hanzihome_apply_external_seed_patches(jsonb) from anon;
revoke all on function public.hanzihome_apply_external_seed_patches(jsonb) from authenticated;
grant execute on function public.hanzihome_apply_external_seed_patches(jsonb) to service_role;
