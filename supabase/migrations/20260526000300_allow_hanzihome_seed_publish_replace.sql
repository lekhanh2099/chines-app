begin;

drop policy if exists "Seed editors can insert hanzihome vocab items"
on public.hanzihome_vocab_items;

create policy "Seed editors can insert hanzihome vocab items"
on public.hanzihome_vocab_items
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_lessons lesson
    where lesson.id = lesson_id
      and lesson.source = 'seed'
      and lesson.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome vocab items"
on public.hanzihome_vocab_items;

create policy "Seed editors can delete hanzihome vocab items"
on public.hanzihome_vocab_items
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can insert hanzihome grammar points"
on public.hanzihome_grammar_points;

create policy "Seed editors can insert hanzihome grammar points"
on public.hanzihome_grammar_points
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_lessons lesson
    where lesson.id = lesson_id
      and lesson.source = 'seed'
      and lesson.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome grammar points"
on public.hanzihome_grammar_points;

create policy "Seed editors can delete hanzihome grammar points"
on public.hanzihome_grammar_points
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

drop policy if exists "Seed editors can claim hanzihome lesson texts"
on public.hanzihome_lesson_texts;

create policy "Seed editors can claim hanzihome lesson texts"
on public.hanzihome_lesson_texts
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
    from public.hanzihome_lessons lesson
    where lesson.id = lesson_id
      and lesson.source = 'seed'
      and lesson.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can insert hanzihome lesson texts"
on public.hanzihome_lesson_texts;

create policy "Seed editors can insert hanzihome lesson texts"
on public.hanzihome_lesson_texts
for insert
to authenticated
with check (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
  and exists (
    select 1
    from public.hanzihome_lessons lesson
    where lesson.id = lesson_id
      and lesson.source = 'seed'
      and lesson.owner_id = auth.uid()
  )
);

drop policy if exists "Seed editors can delete hanzihome lesson texts"
on public.hanzihome_lesson_texts;

create policy "Seed editors can delete hanzihome lesson texts"
on public.hanzihome_lesson_texts
for delete
to authenticated
using (
  source = 'seed'
  and public.is_hanzihome_content_editor()
  and auth.uid() = owner_id
);

commit;
