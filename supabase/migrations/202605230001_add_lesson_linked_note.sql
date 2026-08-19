alter table public.notes
add column if not exists linked_lesson_id text;

create index if not exists notes_linked_lesson_id_idx
on public.notes(linked_lesson_id)
where linked_lesson_id is not null;

create unique index if not exists notes_user_linked_lesson_unique_idx
on public.notes(user_id, linked_lesson_id)
where linked_lesson_id is not null;
