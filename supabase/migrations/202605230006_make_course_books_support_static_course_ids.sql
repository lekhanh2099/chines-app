alter table public.hanzihome_course_books
drop constraint if exists hanzihome_course_books_course_id_fkey;

alter table public.hanzihome_course_books
alter column course_id type text using course_id::text;
