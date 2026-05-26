begin;

update public.hanzihome_lesson_drafts
set status = 'archived',
    updated_at = now()
where lesson_key like 'seed-copy-%'
  and status <> 'archived';

update public.hanzihome_lesson_drafts draft
set status = 'archived',
    updated_at = now()
from public.hanzihome_lessons lesson
where draft.status <> 'archived'
  and draft.lesson_key not like 'seed-copy-%'
  and lesson.course_id = coalesce(draft.content #>> '{lesson,courseId}', '')
  and lesson.book_id = coalesce(draft.content #>> '{lesson,bookId}', '')
  and lesson.lesson_number = draft.lesson_number;

commit;
