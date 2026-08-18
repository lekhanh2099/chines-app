begin;

create or replace function public.ai_forget_memories(
  p_user_id uuid,
  p_conversation_id uuid,
  p_memory_ids jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_character_id uuid;
  v_deleted integer := 0;
begin
  if jsonb_typeof(p_memory_ids) <> 'array' or jsonb_array_length(p_memory_ids) > 20 then
    raise exception 'AI memory ids must be a JSON array with at most 20 items' using errcode = '22023';
  end if;

  select c.character_id
  into v_character_id
  from public.ai_conversations c
  where c.id = p_conversation_id
    and c.user_id = p_user_id
    and c.archived_at is null;

  if v_character_id is null then
    raise exception 'AI conversation not found' using errcode = '42501';
  end if;

  delete from public.ai_memories m
  where m.user_id = p_user_id
    and m.status = 'active'
    and (m.character_id is null or m.character_id = v_character_id)
    and m.id in (
      select value::uuid
      from jsonb_array_elements_text(p_memory_ids)
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.ai_forget_memories(uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.ai_forget_memories(uuid, uuid, jsonb)
to service_role;

comment on function public.ai_forget_memories(uuid, uuid, jsonb) is
  'Server-only explicit user forget operation limited to global/current-character active memories.';

commit;
