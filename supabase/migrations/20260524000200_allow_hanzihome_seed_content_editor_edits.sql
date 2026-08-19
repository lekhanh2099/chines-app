begin;

-- Seed lesson content is public-readable but not public-writable. This
-- allowlist lets explicitly granted editors update seed vocab/grammar rows
-- with the normal RLS client. No app route uses a service-role key.
create table if not exists public.hanzihome_content_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.hanzihome_content_editors enable row level security;

comment on table public.hanzihome_content_editors is
  'Allowlist for authenticated users who may edit built-in HanziHome seed vocab and grammar content. Rows are managed manually by a database owner, not by app clients.';

drop policy if exists "Seed editors can read own hanzihome editor grant"
on public.hanzihome_content_editors;

create policy "Seed editors can read own hanzihome editor grant"
on public.hanzihome_content_editors
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.is_hanzihome_content_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hanzihome_content_editors editor
    where editor.user_id = auth.uid()
  );
$$;

revoke all on function public.is_hanzihome_content_editor() from public;
grant execute on function public.is_hanzihome_content_editor() to authenticated;

drop policy if exists "Seed editors can claim hanzihome vocab items"
on public.hanzihome_vocab_items;

create policy "Seed editors can claim hanzihome vocab items"
on public.hanzihome_vocab_items
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome grammar points"
on public.hanzihome_grammar_points;

create policy "Seed editors can claim hanzihome grammar points"
on public.hanzihome_grammar_points
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome vocab examples"
on public.hanzihome_vocab_examples;

create policy "Seed editors can claim hanzihome vocab examples"
on public.hanzihome_vocab_examples
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_vocab_items item
    where item.id = vocab_item_id
      and item.source = 'seed'
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can insert hanzihome vocab examples"
on public.hanzihome_vocab_examples;

create policy "Seed editors can insert hanzihome vocab examples"
on public.hanzihome_vocab_examples
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_vocab_items item
    where item.id = vocab_item_id
      and item.source = 'seed'
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome vocab examples"
on public.hanzihome_vocab_examples;

create policy "Seed editors can delete hanzihome vocab examples"
on public.hanzihome_vocab_examples
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections;

create policy "Seed editors can claim hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_vocab_items item
    where item.id = vocab_item_id
      and item.source = 'seed'
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can insert hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections;

create policy "Seed editors can insert hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_vocab_items item
    where item.id = vocab_item_id
      and item.source = 'seed'
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections;

create policy "Seed editors can delete hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome grammar examples"
on public.hanzihome_grammar_examples;

create policy "Seed editors can claim hanzihome grammar examples"
on public.hanzihome_grammar_examples
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_grammar_points point
    where point.id = grammar_point_id
      and point.source = 'seed'
      and point.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can insert hanzihome grammar examples"
on public.hanzihome_grammar_examples;

create policy "Seed editors can insert hanzihome grammar examples"
on public.hanzihome_grammar_examples
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_grammar_points point
    where point.id = grammar_point_id
      and point.source = 'seed'
      and point.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome grammar examples"
on public.hanzihome_grammar_examples;

create policy "Seed editors can delete hanzihome grammar examples"
on public.hanzihome_grammar_examples
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections;

create policy "Seed editors can claim hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections
for update
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and (owner_id is null or auth.uid() = owner_id)
)
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_grammar_points point
    where point.id = grammar_point_id
      and point.source = 'seed'
      and point.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can insert hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections;

create policy "Seed editors can insert hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_grammar_points point
    where point.id = grammar_point_id
      and point.source = 'seed'
      and point.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections;

create policy "Seed editors can delete hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

commit;
