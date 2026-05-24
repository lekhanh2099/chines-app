begin;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'hanzihome_vocab_items',
        'hanzihome_grammar_points',
        'hanzihome_vocab_examples',
        'hanzihome_vocab_detail_sections',
        'hanzihome_grammar_examples',
        'hanzihome_grammar_detail_sections'
      )
      and cmd in ('SELECT', 'ALL')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "Read seed and own custom hanzihome vocab items"
on public.hanzihome_vocab_items
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

create policy "Read seed and own custom hanzihome grammar points"
on public.hanzihome_grammar_points
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

create policy "Read seed and own custom hanzihome vocab examples"
on public.hanzihome_vocab_examples
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

create policy "Read seed and own custom hanzihome vocab detail sections"
on public.hanzihome_vocab_detail_sections
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

create policy "Read seed and own custom hanzihome grammar examples"
on public.hanzihome_grammar_examples
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

create policy "Read seed and own custom hanzihome grammar detail sections"
on public.hanzihome_grammar_detail_sections
for select
to anon, authenticated
using (
  source = 'seed'
  or owner_id = auth.uid()
);

commit;
