-- Copy-paste this file into Supabase SQL Editor and run it once.
-- It is safe to run on both:
-- 1. databases that do not have public.user_api_keys yet
-- 2. databases that already applied an older/broken version

create extension if not exists pgcrypto;

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('deepseek', 'gemini', 'openai')),
  label text not null,
  masked_key text not null,
  encrypted_key text not null,
  is_active boolean not null default true,
  priority integer not null default 1,
  default_model text default null,
  last_validated_at timestamp with time zone default null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

do $$
declare
  existing_constraint text;
begin
  select tc.constraint_name
  into existing_constraint
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'user_api_keys'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'user_id'
  limit 1;

  if existing_constraint is not null then
    execute format(
      'alter table public.user_api_keys drop constraint %I',
      existing_constraint
    );
  end if;

  begin
    alter table public.user_api_keys
      add constraint user_api_keys_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  exception
    when duplicate_object then null;
  end;
end $$;

create index if not exists idx_user_api_keys_user_priority
  on public.user_api_keys (user_id, priority);

create index if not exists idx_user_api_keys_user_provider
  on public.user_api_keys (user_id, provider, is_active);

alter table public.user_api_keys enable row level security;

drop policy if exists "Users can view own API keys" on public.user_api_keys;
create policy "Users can view own API keys"
on public.user_api_keys
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own API keys" on public.user_api_keys;
create policy "Users can insert own API keys"
on public.user_api_keys
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own API keys" on public.user_api_keys;
create policy "Users can update own API keys"
on public.user_api_keys
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own API keys" on public.user_api_keys;
create policy "Users can delete own API keys"
on public.user_api_keys
for delete
using (auth.uid() = user_id);

comment on table public.user_api_keys
  is 'User-managed AI provider API keys with provider-aware failover order.';

insert into public.user_api_keys (
  user_id,
  provider,
  label,
  masked_key,
  encrypted_key,
  is_active,
  priority,
  created_at,
  updated_at,
  last_validated_at
)
select
  settings.user_id,
  'deepseek',
  'DeepSeek Key (Legacy)',
  'Imported legacy key',
  settings.deepseek_api_key_encrypted,
  coalesce(settings.deepseek_enabled, true),
  1,
  settings.created_at,
  settings.updated_at,
  settings.updated_at
from public.user_ai_prompt_settings as settings
where settings.deepseek_api_key_encrypted is not null
  and not exists (
    select 1
    from public.user_api_keys as keys
    where keys.user_id = settings.user_id
      and keys.provider = 'deepseek'
      and keys.encrypted_key = settings.deepseek_api_key_encrypted
  );

select
  count(*) as total_user_api_keys,
  count(*) filter (where provider = 'deepseek') as deepseek_keys,
  count(*) filter (where is_active) as active_keys
from public.user_api_keys;