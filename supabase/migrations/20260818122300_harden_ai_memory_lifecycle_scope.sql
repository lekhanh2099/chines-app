begin;

revoke all on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
from public, anon, authenticated, service_role;

alter function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
rename to ai_apply_memory_changes_unscoped;

revoke all on function public.ai_apply_memory_changes_unscoped(uuid, uuid, uuid, jsonb)
from public, anon, authenticated, service_role;

create function public.ai_apply_memory_changes(
  p_user_id uuid,
  p_job_id uuid,
  p_user_message_id uuid,
  p_changes jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_character_id uuid;
  v_change jsonb;
  v_target_id uuid;
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) > 8 then
    raise exception 'AI memory changes must be a JSON array with at most 8 items' using errcode = '22023';
  end if;

  select c.character_id
  into v_character_id
  from public.ai_post_turn_jobs j
  join public.ai_conversations c
    on c.id = j.conversation_id
   and c.user_id = j.user_id
  where j.id = p_job_id
    and j.user_id = p_user_id
    and j.status = 'processing';

  if v_character_id is null then
    raise exception 'AI post-turn job is not owned or processing' using errcode = '42501';
  end if;

  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    if nullif(v_change ->> 'targetMemoryId', '') is null then
      continue;
    end if;

    v_target_id := (v_change ->> 'targetMemoryId')::uuid;
    if not exists (
      select 1
      from public.ai_memories m
      where m.id = v_target_id
        and m.user_id = p_user_id
        and m.status = 'active'
        and (m.character_id is null or m.character_id = v_character_id)
    ) then
      raise exception 'AI memory lifecycle target is outside the current character scope'
        using errcode = '42501';
    end if;
  end loop;

  return public.ai_apply_memory_changes_unscoped(
    p_user_id,
    p_job_id,
    p_user_message_id,
    p_changes
  );
end;
$$;

revoke all on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb)
to service_role;

comment on function public.ai_apply_memory_changes(uuid, uuid, uuid, jsonb) is
  'Server-only scoped wrapper that rejects cross-character lifecycle target ids before applying the transactional memory change set.';
comment on function public.ai_apply_memory_changes_unscoped(uuid, uuid, uuid, jsonb) is
  'Internal lifecycle implementation. Direct execution is revoked; callers must use the scoped ai_apply_memory_changes wrapper.';

commit;
