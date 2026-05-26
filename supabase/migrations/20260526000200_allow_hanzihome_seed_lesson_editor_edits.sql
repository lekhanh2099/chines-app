begin;

drop policy if exists "Seed editors can claim hanzihome lessons"
on public.hanzihome_lessons;

create policy "Seed editors can claim hanzihome lessons"
on public.hanzihome_lessons
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

commit;
