begin;

create or replace function public.set_hanzihome_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.hanzihome_content_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('read_only', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hanzihome_content_roles enable row level security;

drop policy if exists "Users can read own HanziHome content role"
on public.hanzihome_content_roles;

create policy "Users can read own HanziHome content role"
on public.hanzihome_content_roles
for select
to authenticated
using (auth.uid() = user_id);

drop trigger if exists set_hanzihome_content_roles_updated_at
on public.hanzihome_content_roles;

create trigger set_hanzihome_content_roles_updated_at
before update on public.hanzihome_content_roles
for each row execute function public.set_hanzihome_updated_at();

create index if not exists hanzihome_lessons_course_book_order_idx
on public.hanzihome_lessons (course_id, book_id, lesson_order);

create index if not exists hanzihome_vocab_items_lesson_order_idx
on public.hanzihome_vocab_items (lesson_id, item_order);

create index if not exists hanzihome_grammar_points_lesson_order_idx
on public.hanzihome_grammar_points (lesson_id, point_order);

create index if not exists hanzihome_vocab_examples_item_order_idx
on public.hanzihome_vocab_examples (vocab_item_id, example_order);

create index if not exists hanzihome_grammar_examples_point_order_idx
on public.hanzihome_grammar_examples (grammar_point_id, example_order);

create index if not exists hanzihome_vocab_detail_sections_item_order_idx
on public.hanzihome_vocab_detail_sections (vocab_item_id, section_order);

create index if not exists hanzihome_grammar_detail_sections_point_order_idx
on public.hanzihome_grammar_detail_sections (grammar_point_id, section_order);

create index if not exists hanzihome_lesson_texts_lesson_key_idx
on public.hanzihome_lesson_texts (lesson_id, text_key);

comment on table public.hanzihome_content_roles is
  'Future HanziHome content access roles. Role assignment remains server-managed.';

commit;
