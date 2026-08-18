begin;

create or replace function public.ai_enqueue_post_turn_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role <> 'assistant' then
    return new;
  end if;

  insert into public.ai_post_turn_jobs (
    user_id,
    conversation_id,
    assistant_message_id,
    kind,
    status
  )
  values (
    new.user_id,
    new.conversation_id,
    new.id,
    'memory-summary',
    'pending'
  )
  on conflict (assistant_message_id) do nothing;

  return new;
end;
$$;

revoke all on function public.ai_enqueue_post_turn_job() from public, anon, authenticated;
grant execute on function public.ai_enqueue_post_turn_job() to service_role;

drop trigger if exists ai_messages_enqueue_post_turn_job on public.ai_messages;
create trigger ai_messages_enqueue_post_turn_job
after insert on public.ai_messages
for each row
when (new.role = 'assistant')
execute function public.ai_enqueue_post_turn_job();

comment on function public.ai_enqueue_post_turn_job() is
  'Creates one durable post-turn processing job in the same transaction as each persisted assistant message.';

commit;
