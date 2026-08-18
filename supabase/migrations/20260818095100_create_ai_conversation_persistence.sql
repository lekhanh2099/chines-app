begin;

-- Core persistence only. Retrieval extensions (vector / lexical search) are intentionally deferred.

create table public.ai_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  city text not null default '',
  age integer null,
  background text not null default '',
  personality text not null default '',
  speaking_style text not null default '',
  interests text[] not null default '{}',
  identity_notes text not null default '',
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_characters_display_name_check check (length(btrim(display_name)) > 0),
  constraint ai_characters_age_check check (age is null or (age >= 1 and age <= 120)),
  constraint ai_characters_id_user_unique unique (id, user_id)
);

create index ai_characters_user_archive_updated_idx
  on public.ai_characters (user_id, archived_at, updated_at desc);

create table public.ai_conversation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_character_id uuid null,
  default_mode text not null default 'natural',
  default_correction_style text not null default 'balanced',
  default_reply_mode text not null default 'adaptive',
  learner_level text not null default 'intermediate',
  memory_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversation_preferences_mode_check
    check (default_mode in ('natural', 'speaking-practice', 'grammar-coach', 'hskk-practice')),
  constraint ai_conversation_preferences_correction_check
    check (default_correction_style in ('light', 'balanced', 'strict')),
  constraint ai_conversation_preferences_reply_mode_check
    check (default_reply_mode in ('adaptive', 'chinese', 'bilingual')),
  constraint ai_conversation_preferences_learner_level_check
    check (learner_level in ('beginner', 'intermediate', 'advanced')),
  constraint ai_conversation_preferences_default_character_fk
    foreign key (default_character_id, user_id)
    references public.ai_characters(id, user_id)
    on delete set null (default_character_id)
);

create index ai_conversation_preferences_default_character_idx
  on public.ai_conversation_preferences (default_character_id, user_id)
  where default_character_id is not null;

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null,
  title text not null default '',
  mode text not null,
  correction_style text not null,
  reply_mode text not null,
  memory_policy text not null default 'inherit',
  summary text not null default '',
  summary_until_seq bigint not null default 0,
  summary_version integer not null default 1,
  last_message_seq bigint not null default 0,
  last_message_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_mode_check
    check (mode in ('natural', 'speaking-practice', 'grammar-coach', 'hskk-practice')),
  constraint ai_conversations_correction_check
    check (correction_style in ('light', 'balanced', 'strict')),
  constraint ai_conversations_reply_mode_check
    check (reply_mode in ('adaptive', 'chinese', 'bilingual')),
  constraint ai_conversations_memory_policy_check
    check (memory_policy in ('inherit', 'enabled', 'disabled')),
  constraint ai_conversations_summary_until_seq_check check (summary_until_seq >= 0),
  constraint ai_conversations_last_message_seq_check check (last_message_seq >= 0),
  constraint ai_conversations_summary_coverage_check check (summary_until_seq <= last_message_seq),
  constraint ai_conversations_summary_version_check check (summary_version > 0),
  constraint ai_conversations_id_user_unique unique (id, user_id),
  constraint ai_conversations_character_fk
    foreign key (character_id, user_id)
    references public.ai_characters(id, user_id)
    on delete restrict
);

create index ai_conversations_user_archive_updated_idx
  on public.ai_conversations (user_id, archived_at, updated_at desc);
create index ai_conversations_user_character_last_message_idx
  on public.ai_conversations (user_id, character_id, last_message_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null,
  seq bigint not null,
  role text not null,
  content text not null,
  client_message_id uuid null,
  reply_to_message_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_messages_seq_check check (seq > 0),
  constraint ai_messages_role_check check (role in ('user', 'assistant')),
  constraint ai_messages_content_check check (length(btrim(content)) > 0),
  constraint ai_messages_metadata_check check (jsonb_typeof(metadata) = 'object'),
  constraint ai_messages_role_fields_check check (
    (role = 'user' and client_message_id is not null and reply_to_message_id is null)
    or
    (role = 'assistant' and client_message_id is null and reply_to_message_id is not null)
  ),
  constraint ai_messages_conversation_seq_unique unique (conversation_id, seq),
  constraint ai_messages_id_user_unique unique (id, user_id),
  constraint ai_messages_id_conversation_user_unique unique (id, conversation_id, user_id),
  constraint ai_messages_conversation_fk
    foreign key (conversation_id, user_id)
    references public.ai_conversations(id, user_id)
    on delete cascade,
  constraint ai_messages_reply_to_fk
    foreign key (reply_to_message_id, conversation_id, user_id)
    references public.ai_messages(id, conversation_id, user_id)
    on delete cascade
);

create unique index ai_messages_client_message_unique_idx
  on public.ai_messages (conversation_id, client_message_id)
  where client_message_id is not null;
create unique index ai_messages_assistant_reply_unique_idx
  on public.ai_messages (reply_to_message_id)
  where role = 'assistant' and reply_to_message_id is not null;

create table public.ai_relationship_states (
  user_id uuid not null,
  character_id uuid not null,
  nickname text not null default '',
  familiarity_score numeric(5, 4) not null default 0,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id),
  constraint ai_relationship_states_familiarity_check
    check (familiarity_score >= 0 and familiarity_score <= 1),
  constraint ai_relationship_states_revision_check check (revision >= 0),
  constraint ai_relationship_states_character_fk
    foreign key (character_id, user_id)
    references public.ai_characters(id, user_id)
    on delete cascade
);

create table public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid null,
  kind text not null,
  memory_key text null,
  content text not null,
  importance numeric(4, 3) not null,
  confidence numeric(4, 3) not null,
  status text not null default 'active',
  reinforcement_count integer not null default 1,
  last_reinforced_at timestamptz not null default now(),
  superseded_by_id uuid null,
  last_recalled_at timestamptz null,
  valid_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_memories_kind_check
    check (kind in ('fact', 'preference', 'habit', 'goal', 'episode', 'open_loop', 'inside_joke')),
  constraint ai_memories_memory_key_check
    check (memory_key is null or length(btrim(memory_key)) > 0),
  constraint ai_memories_content_check check (length(btrim(content)) > 0),
  constraint ai_memories_importance_check check (importance >= 0 and importance <= 1),
  constraint ai_memories_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint ai_memories_status_check check (status in ('active', 'superseded', 'resolved')),
  constraint ai_memories_reinforcement_count_check check (reinforcement_count > 0),
  constraint ai_memories_id_user_unique unique (id, user_id),
  constraint ai_memories_character_fk
    foreign key (character_id, user_id)
    references public.ai_characters(id, user_id)
    on delete cascade,
  constraint ai_memories_superseded_by_fk
    foreign key (superseded_by_id, user_id)
    references public.ai_memories(id, user_id)
    on delete set null (superseded_by_id),
  constraint ai_memories_superseded_state_check check (
    (status = 'superseded' and superseded_by_id is not null)
    or
    (status <> 'superseded' and superseded_by_id is null)
  )
);

create unique index ai_memories_active_global_key_unique_idx
  on public.ai_memories (user_id, memory_key)
  where character_id is null and memory_key is not null and status = 'active';
create unique index ai_memories_active_character_key_unique_idx
  on public.ai_memories (user_id, character_id, memory_key)
  where character_id is not null and memory_key is not null and status = 'active';
create index ai_memories_user_status_updated_idx
  on public.ai_memories (user_id, status, updated_at desc);
create index ai_memories_user_character_status_updated_idx
  on public.ai_memories (user_id, character_id, status, updated_at desc);
create index ai_memories_user_kind_status_idx
  on public.ai_memories (user_id, kind, status);

create table public.ai_memory_evidence (
  memory_id uuid not null,
  message_id uuid not null,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now(),
  primary key (memory_id, message_id, action),
  constraint ai_memory_evidence_action_check
    check (action in ('created', 'reinforced', 'superseded', 'resolved')),
  constraint ai_memory_evidence_memory_fk
    foreign key (memory_id, user_id)
    references public.ai_memories(id, user_id)
    on delete cascade,
  constraint ai_memory_evidence_message_fk
    foreign key (message_id, user_id)
    references public.ai_messages(id, user_id)
    on delete cascade
);

create index ai_memory_evidence_message_user_idx
  on public.ai_memory_evidence (message_id, user_id);

create table public.ai_post_turn_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null,
  assistant_message_id uuid not null,
  kind text not null default 'memory-summary',
  status text not null default 'pending',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz null,
  completed_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_post_turn_jobs_kind_check check (kind in ('memory-summary')),
  constraint ai_post_turn_jobs_status_check
    check (status in ('pending', 'processing', 'retry', 'succeeded', 'dead')),
  constraint ai_post_turn_jobs_attempt_count_check check (attempt_count >= 0),
  constraint ai_post_turn_jobs_assistant_message_unique unique (assistant_message_id),
  constraint ai_post_turn_jobs_conversation_fk
    foreign key (conversation_id, user_id)
    references public.ai_conversations(id, user_id)
    on delete cascade,
  constraint ai_post_turn_jobs_assistant_message_fk
    foreign key (assistant_message_id, conversation_id, user_id)
    references public.ai_messages(id, conversation_id, user_id)
    on delete cascade
);

create index ai_post_turn_jobs_ready_idx
  on public.ai_post_turn_jobs (status, available_at, created_at)
  where status in ('pending', 'retry');

create or replace function public.ai_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.ai_touch_updated_at() from public, anon, authenticated;
grant execute on function public.ai_touch_updated_at() to service_role;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'ai_characters',
    'ai_conversation_preferences',
    'ai_conversations',
    'ai_relationship_states',
    'ai_memories',
    'ai_post_turn_jobs'
  ] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.ai_touch_updated_at()', target_table, target_table);
  end loop;
end;
$$;

create or replace function public.ai_append_message(
  p_user_id uuid,
  p_conversation_id uuid,
  p_role text,
  p_content text,
  p_client_message_id uuid default null,
  p_reply_to_message_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.ai_messages
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_content text;
  v_existing public.ai_messages%rowtype;
  v_reply_target public.ai_messages%rowtype;
  v_message public.ai_messages%rowtype;
  v_seq bigint;
  v_now timestamptz := now();
begin
  if p_user_id is null or p_conversation_id is null then
    raise exception 'AI message append requires user and conversation identifiers'
      using errcode = '22023';
  end if;

  if p_content is null or length(btrim(p_content)) = 0 then
    raise exception 'AI message content must not be empty'
      using errcode = '22023';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'AI message metadata must be a JSON object'
      using errcode = '22023';
  end if;

  if p_role not in ('user', 'assistant') then
    raise exception 'Unsupported AI message role'
      using errcode = '22023';
  end if;

  v_content := btrim(p_content);

  if p_role = 'user' then
    if p_client_message_id is null or p_reply_to_message_id is not null then
      raise exception 'User AI messages require client_message_id and no reply_to_message_id'
        using errcode = '22023';
    end if;

    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.client_message_id = p_client_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI message idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;
  else
    if p_client_message_id is not null or p_reply_to_message_id is null then
      raise exception 'Assistant AI messages require reply_to_message_id and no client_message_id'
        using errcode = '22023';
    end if;
  end if;

  perform 1
  from public.ai_conversations as conversation
  where conversation.id = p_conversation_id
    and conversation.user_id = p_user_id
  for update;

  if not found then
    raise exception 'AI conversation not found for user'
      using errcode = 'P0002';
  end if;

  if p_role = 'user' then
    -- Re-check after the conversation lock so concurrent retries serialize safely.
    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.client_message_id = p_client_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI message idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;
  else
    select message.*
    into v_existing
    from public.ai_messages as message
    where message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.role = 'assistant'
      and message.reply_to_message_id = p_reply_to_message_id
    limit 1;

    if found then
      if v_existing.content <> v_content then
        raise exception 'AI assistant reply idempotency conflict'
          using errcode = 'P0001';
      end if;
      return v_existing;
    end if;

    select message.*
    into v_reply_target
    from public.ai_messages as message
    where message.id = p_reply_to_message_id
      and message.user_id = p_user_id
      and message.conversation_id = p_conversation_id
      and message.role = 'user'
    limit 1;

    if not found then
      raise exception 'Assistant reply target is not an owned user message'
        using errcode = '22023';
    end if;
  end if;

  update public.ai_conversations as conversation
  set
    last_message_seq = conversation.last_message_seq + 1,
    last_message_at = v_now
  where conversation.id = p_conversation_id
    and conversation.user_id = p_user_id
  returning conversation.last_message_seq into v_seq;

  insert into public.ai_messages (
    user_id,
    conversation_id,
    seq,
    role,
    content,
    client_message_id,
    reply_to_message_id,
    metadata,
    created_at
  )
  values (
    p_user_id,
    p_conversation_id,
    v_seq,
    p_role,
    v_content,
    p_client_message_id,
    p_reply_to_message_id,
    p_metadata,
    v_now
  )
  returning * into v_message;

  return v_message;
end;
$$;

revoke all on function public.ai_append_message(uuid, uuid, text, text, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.ai_append_message(uuid, uuid, text, text, uuid, uuid, jsonb)
  to service_role;

alter table public.ai_characters enable row level security;
alter table public.ai_conversation_preferences enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_relationship_states enable row level security;
alter table public.ai_memories enable row level security;
alter table public.ai_memory_evidence enable row level security;
alter table public.ai_post_turn_jobs enable row level security;

create policy "Users can access own AI characters"
on public.ai_characters for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI conversation preferences"
on public.ai_conversation_preferences for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI conversations"
on public.ai_conversations for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI messages"
on public.ai_messages for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI relationship states"
on public.ai_relationship_states for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI memories"
on public.ai_memories for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can access own AI memory evidence"
on public.ai_memory_evidence for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table
  public.ai_characters,
  public.ai_conversation_preferences,
  public.ai_conversations,
  public.ai_messages,
  public.ai_relationship_states,
  public.ai_memories,
  public.ai_memory_evidence,
  public.ai_post_turn_jobs
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.ai_characters,
  public.ai_conversation_preferences,
  public.ai_conversations,
  public.ai_messages,
  public.ai_relationship_states,
  public.ai_memories,
  public.ai_memory_evidence,
  public.ai_post_turn_jobs
to service_role;

comment on table public.ai_characters is
  'User-owned stable AI character identity. Conversation modes are stored separately from character identity.';
comment on table public.ai_conversation_preferences is
  'User defaults for newly created AI conversations. Browser access is denied; application routes own persistence.';
comment on table public.ai_conversations is
  'Persisted AI conversation threads with explicit summary coverage and per-thread conversation settings.';
comment on table public.ai_messages is
  'Authoritative raw AI transcript. Product/system/context-builder instructions are not persisted as transcript messages.';
comment on table public.ai_relationship_states is
  'Compact user-character relationship state. Shared events, plans and inside jokes belong in ai_memories.';
comment on table public.ai_memories is
  'Long-term AI conversation continuity data. Global scope is represented by character_id IS NULL; FORGET deletes the row.';
comment on table public.ai_memory_evidence is
  'Many-to-many provenance linking memories to transcript messages that created or changed them.';
comment on table public.ai_post_turn_jobs is
  'Server-only durable state for post-response memory and summary processing. No prompt or transcript payload is duplicated here.';
comment on function public.ai_append_message(uuid, uuid, text, text, uuid, uuid, jsonb) is
  'Server-only atomic AI transcript append with owned-conversation sequence allocation and retry idempotency.';

commit;
