create index if not exists hanzihome_lesson_sections_owner_idx
on public.hanzihome_lesson_sections (owner_id)
where owner_id is not null;
