begin;

-- Built-in HanziHome seed content must be readable by normal authenticated users.
-- Custom content remains owner-scoped.

drop policy if exists "Authenticated users can read hanzihome seed vocab items"
on public.hanzihome_vocab_items;

create policy "Authenticated users can read hanzihome seed vocab items"
on public.hanzihome_vocab_items
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

drop policy if exists "Authenticated users can read hanzihome seed grammar points"
on public.hanzihome_grammar_points;

create policy "Authenticated users can read hanzihome seed grammar points"
on public.hanzihome_grammar_points
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

drop policy if exists "Authenticated users can read hanzihome seed vocab examples"
on public.hanzihome_vocab_examples;

create policy "Authenticated users can read hanzihome seed vocab examples"
on public.hanzihome_vocab_examples
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

drop policy if exists "Authenticated users can read hanzihome seed vocab detail sections"
on public.hanzihome_vocab_detail_sections;

create policy "Authenticated users can read hanzihome seed vocab detail sections"
on public.hanzihome_vocab_detail_sections
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

drop policy if exists "Authenticated users can read hanzihome seed grammar examples"
on public.hanzihome_grammar_examples;

create policy "Authenticated users can read hanzihome seed grammar examples"
on public.hanzihome_grammar_examples
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

drop policy if exists "Authenticated users can read hanzihome seed grammar detail sections"
on public.hanzihome_grammar_detail_sections;

create policy "Authenticated users can read hanzihome seed grammar detail sections"
on public.hanzihome_grammar_detail_sections
for select
to authenticated
using (
  source = 'seed'
  or (source = 'custom' and owner_id = auth.uid())
);

commit;
