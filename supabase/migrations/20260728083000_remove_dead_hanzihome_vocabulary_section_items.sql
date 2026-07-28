begin;

update public.hanzihome_lesson_sections
set payload = jsonb_set(payload, '{items}', '[]'::jsonb, false),
    updated_at = now()
where section_type = 'vocabulary'
  and deleted_at is null
  and jsonb_typeof(payload->'items') = 'array'
  and jsonb_array_length(payload->'items') > 0;

commit;
