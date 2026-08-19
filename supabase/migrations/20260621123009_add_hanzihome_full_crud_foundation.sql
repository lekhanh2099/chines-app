begin;

do $$
declare
  target_table_name text;
begin
  foreach target_table_name in array array[
    'hanzihome_courses',
    'hanzihome_course_books',
    'hanzihome_lessons',
    'hanzihome_lesson_sections',
    'hanzihome_lesson_texts',
    'hanzihome_vocab_items',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_detail_sections',
    'hanzihome_grammar_points',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_detail_sections'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists deleted_at timestamptz, add column if not exists deleted_by uuid references auth.users(id) on delete set null',
      target_table_name
    );
    execute format(
      'create index if not exists %I on public.%I (deleted_at)',
      target_table_name || '_active_idx',
      target_table_name
    );
  end loop;
end $$;

alter table public.hanzihome_lessons
  add column if not exists title_pinyin text,
  add column if not exists title_en text,
  add column if not exists tags text[] not null default '{}';

alter table public.hanzihome_vocab_items
  add column if not exists meaning_en text,
  add column if not exists tags text[] not null default '{}';

alter table public.hanzihome_grammar_points
  add column if not exists title_vi text,
  add column if not exists level text,
  add column if not exists tags text[] not null default '{}';

create table if not exists public.hanzihome_content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  operation text not null check (operation in ('create', 'update', 'delete', 'restore', 'reorder')),
  entity_type text not null,
  entity_id text not null,
  parent_entity_type text,
  parent_entity_id text,
  before_data jsonb,
  after_data jsonb,
  reason text not null check (length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists hanzihome_content_audit_entity_idx
on public.hanzihome_content_audit_log (entity_type, entity_id, created_at desc);

create index if not exists hanzihome_content_audit_actor_idx
on public.hanzihome_content_audit_log (actor_id, created_at desc);

alter table public.hanzihome_content_audit_log enable row level security;

drop policy if exists "Authenticated users can read HanziHome content audit log"
on public.hanzihome_content_audit_log;

create policy "Authenticated users can read HanziHome content audit log"
on public.hanzihome_content_audit_log
for select
to authenticated
using ((select auth.uid()) is not null);

grant select on table public.hanzihome_content_audit_log to authenticated;
revoke insert, update, delete on table public.hanzihome_content_audit_log from anon, authenticated;

do $$
declare
  target_table_name text;
  policy_name text;
  read_expression text;
begin
  foreach target_table_name in array array[
    'hanzihome_courses',
    'hanzihome_course_books',
    'hanzihome_lessons',
    'hanzihome_lesson_sections',
    'hanzihome_lesson_texts',
    'hanzihome_vocab_items',
    'hanzihome_vocab_examples',
    'hanzihome_vocab_detail_sections',
    'hanzihome_grammar_points',
    'hanzihome_grammar_examples',
    'hanzihome_grammar_detail_sections'
  ]
  loop
    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table_name
        and cmd = 'SELECT'
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, target_table_name);
    end loop;
    read_expression := 'deleted_at is null and (source = ''seed'' or (source = ''custom'' and (select auth.uid()) is not null))';
    read_expression := read_expression || case target_table_name
      when 'hanzihome_course_books' then
        ' and exists (select 1 from public.hanzihome_courses parent where parent.id = hanzihome_course_books.course_id and parent.deleted_at is null)'
      when 'hanzihome_lessons' then
        ' and exists (select 1 from public.hanzihome_course_books parent where parent.id = hanzihome_lessons.book_id and parent.course_id = hanzihome_lessons.course_id and parent.deleted_at is null)'
        || ' and exists (select 1 from public.hanzihome_courses parent where parent.id = hanzihome_lessons.course_id and parent.deleted_at is null)'
      when 'hanzihome_lesson_sections' then
        ' and exists (select 1 from public.hanzihome_lessons parent where parent.id = hanzihome_lesson_sections.lesson_id and parent.deleted_at is null)'
      when 'hanzihome_lesson_texts' then
        ' and exists (select 1 from public.hanzihome_lessons parent where parent.id = hanzihome_lesson_texts.lesson_id and parent.deleted_at is null)'
      when 'hanzihome_vocab_items' then
        ' and exists (select 1 from public.hanzihome_lessons parent where parent.id = hanzihome_vocab_items.lesson_id and parent.course_id = hanzihome_vocab_items.course_id and parent.book_id = hanzihome_vocab_items.book_id and parent.deleted_at is null)'
      when 'hanzihome_vocab_examples' then
        ' and exists (select 1 from public.hanzihome_vocab_items parent where parent.id = hanzihome_vocab_examples.vocab_item_id and parent.lesson_id = hanzihome_vocab_examples.lesson_id and parent.deleted_at is null)'
      when 'hanzihome_vocab_detail_sections' then
        ' and exists (select 1 from public.hanzihome_vocab_items parent where parent.id = hanzihome_vocab_detail_sections.vocab_item_id and parent.lesson_id = hanzihome_vocab_detail_sections.lesson_id and parent.deleted_at is null)'
      when 'hanzihome_grammar_points' then
        ' and exists (select 1 from public.hanzihome_lessons parent where parent.id = hanzihome_grammar_points.lesson_id and parent.course_id = hanzihome_grammar_points.course_id and parent.book_id = hanzihome_grammar_points.book_id and parent.deleted_at is null)'
      when 'hanzihome_grammar_examples' then
        ' and exists (select 1 from public.hanzihome_grammar_points parent where parent.id = hanzihome_grammar_examples.grammar_point_id and parent.lesson_id = hanzihome_grammar_examples.lesson_id and parent.deleted_at is null)'
      when 'hanzihome_grammar_detail_sections' then
        ' and exists (select 1 from public.hanzihome_grammar_points parent where parent.id = hanzihome_grammar_detail_sections.grammar_point_id and parent.lesson_id = hanzihome_grammar_detail_sections.lesson_id and parent.deleted_at is null)'
      else ''
    end;
    execute format(
      'create policy "HanziHome canonical active reads" on public.%I for select to anon, authenticated using (%s)',
      target_table_name,
      read_expression
    );
    execute format(
      'revoke insert, update, delete on table public.%I from anon, authenticated',
      target_table_name
    );
    execute format('grant select on table public.%I to anon, authenticated', target_table_name);
  end loop;
end $$;

alter table public.hanzihome_lessons
  drop constraint if exists hanzihome_lessons_course_id_book_id_lesson_number_key,
  drop constraint if exists hanzihome_lessons_course_id_book_id_lesson_order_key;

create unique index if not exists hanzihome_lessons_active_number_idx
on public.hanzihome_lessons (course_id, book_id, lesson_number)
where deleted_at is null;

create unique index if not exists hanzihome_lessons_active_order_idx
on public.hanzihome_lessons (course_id, book_id, lesson_order)
where deleted_at is null;

alter table public.hanzihome_lesson_texts
  drop constraint if exists hanzihome_lesson_texts_lesson_id_text_key_key;

create unique index if not exists hanzihome_lesson_texts_active_key_idx
on public.hanzihome_lesson_texts (lesson_id, text_key)
where deleted_at is null;

alter table public.hanzihome_lesson_sections
  drop constraint if exists hanzihome_lesson_sections_lesson_id_source_section_id_key,
  drop constraint if exists hanzihome_lesson_sections_lesson_id_section_key_key,
  drop constraint if exists hanzihome_lesson_sections_lesson_id_section_order_key;

create unique index if not exists hanzihome_lesson_sections_active_source_idx
on public.hanzihome_lesson_sections (lesson_id, source_section_id)
where deleted_at is null;

create unique index if not exists hanzihome_lesson_sections_active_key_idx
on public.hanzihome_lesson_sections (lesson_id, section_key)
where deleted_at is null;

create unique index if not exists hanzihome_lesson_sections_active_order_idx
on public.hanzihome_lesson_sections (lesson_id, section_order)
where deleted_at is null;

alter table public.hanzihome_vocab_items
  drop constraint if exists hanzihome_vocab_items_lesson_id_word_pinyin_key;

create unique index if not exists hanzihome_vocab_items_active_word_idx
on public.hanzihome_vocab_items (lesson_id, word, pinyin)
where deleted_at is null;

alter table public.hanzihome_vocab_examples
  drop constraint if exists hanzihome_vocab_examples_vocab_item_id_example_order_key;

create unique index if not exists hanzihome_vocab_examples_active_order_idx
on public.hanzihome_vocab_examples (vocab_item_id, example_order)
where deleted_at is null;

alter table public.hanzihome_vocab_detail_sections
  drop constraint if exists hanzihome_vocab_detail_sections_vocab_item_id_section_key_key;

create unique index if not exists hanzihome_vocab_detail_sections_active_key_idx
on public.hanzihome_vocab_detail_sections (vocab_item_id, section_key)
where deleted_at is null;

alter table public.hanzihome_grammar_points
  drop constraint if exists hanzihome_grammar_points_lesson_id_title_key;

create unique index if not exists hanzihome_grammar_points_active_title_idx
on public.hanzihome_grammar_points (lesson_id, title)
where deleted_at is null;

alter table public.hanzihome_grammar_examples
  drop constraint if exists hanzihome_grammar_examples_grammar_point_id_example_order_key;

create unique index if not exists hanzihome_grammar_examples_active_order_idx
on public.hanzihome_grammar_examples (grammar_point_id, example_order)
where deleted_at is null;

alter table public.hanzihome_grammar_detail_sections
  drop constraint if exists hanzihome_grammar_detail_sections_grammar_point_id_section_key_key;

create unique index if not exists hanzihome_grammar_detail_sections_active_key_idx
on public.hanzihome_grammar_detail_sections (grammar_point_id, section_key)
where deleted_at is null;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create or replace function private.hanzihome_mutate_content(
  p_actor_id uuid,
  p_operation text,
  p_entity_type text,
  p_entity_id text default null,
  p_expected_updated_at timestamptz default null,
  p_changes jsonb default '{}'::jsonb,
  p_reason text default null,
  p_audit_operation text default null,
  p_audit_entity_type text default null,
  p_audit_entity_id text default null,
  p_audit_parent_entity_type text default null,
  p_audit_parent_entity_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table_name text;
  v_owner_column text;
  v_parent_entity_type text;
  v_parent_id_column text;
  v_parent_id text;
  v_order_column text;
  v_allowed_columns text[];
  v_change_key text;
  v_set_clause text;
  v_new_id text;
  v_before jsonb;
  v_after jsonb;
  v_insert_data jsonb;
  v_current_updated_at timestamptz;
  v_current_order integer;
  v_next_order integer;
  v_sibling_id text;
  v_parent_exists boolean;
begin
  if p_actor_id is null then
    raise exception using errcode = '28000', message = 'Authenticated actor is required';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception using errcode = '22023', message = 'Mutation reason is required';
  end if;
  if p_operation not in ('create', 'update', 'delete', 'restore', 'reorder') then
    raise exception using errcode = '22023', message = 'Unsupported HanziHome mutation operation';
  end if;
  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Mutation changes must be an object';
  end if;

  case p_entity_type
    when 'course' then
      v_table_name := 'hanzihome_courses';
      v_owner_column := 'user_id';
      v_order_column := 'course_order';
      v_allowed_columns := array['slug', 'title', 'subtitle', 'type', 'course_order'];
    when 'book' then
      v_table_name := 'hanzihome_course_books';
      v_owner_column := 'user_id';
      v_parent_entity_type := 'course';
      v_parent_id_column := 'course_id';
      v_order_column := 'book_order';
      v_allowed_columns := array['course_id', 'title', 'short_title', 'book_order'];
    when 'lesson' then
      v_table_name := 'hanzihome_lessons';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'book';
      v_parent_id_column := 'book_id';
      v_order_column := 'lesson_order';
      v_allowed_columns := array['course_id', 'book_id', 'lesson_number', 'lesson_order', 'title_zh', 'title_pinyin', 'title_vi', 'title_en', 'tags', 'source_file'];
    when 'section' then
      v_table_name := 'hanzihome_lesson_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['lesson_id', 'source_section_id', 'section_key', 'section_type', 'title', 'title_vi', 'section_order', 'payload', 'source_file'];
    when 'lesson_text' then
      v_table_name := 'hanzihome_lesson_texts';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_allowed_columns := array['lesson_id', 'text_key', 'title', 'content', 'content_format'];
    when 'vocab_item' then
      v_table_name := 'hanzihome_vocab_items';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'item_order';
      v_allowed_columns := array['lesson_id', 'course_id', 'book_id', 'item_order', 'word', 'pinyin', 'han_viet', 'meaning', 'meaning_en', 'category', 'level', 'pos_vi', 'pos_zh', 'tone', 'tags', 'source_file'];
    when 'vocab_example' then
      v_table_name := 'hanzihome_vocab_examples';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'vocab_item';
      v_parent_id_column := 'vocab_item_id';
      v_order_column := 'example_order';
      v_allowed_columns := array['vocab_item_id', 'lesson_id', 'example_order', 'zh', 'pinyin', 'vi', 'note'];
    when 'vocab_detail_section' then
      v_table_name := 'hanzihome_vocab_detail_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'vocab_item';
      v_parent_id_column := 'vocab_item_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['vocab_item_id', 'lesson_id', 'section_key', 'title', 'lines', 'section_order'];
    when 'grammar_point' then
      v_table_name := 'hanzihome_grammar_points';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'lesson';
      v_parent_id_column := 'lesson_id';
      v_order_column := 'point_order';
      v_allowed_columns := array['lesson_id', 'course_id', 'book_id', 'point_order', 'title', 'title_vi', 'clean_title', 'level', 'core', 'content_md', 'structures_view', 'notes', 'tags'];
    when 'grammar_example' then
      v_table_name := 'hanzihome_grammar_examples';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'grammar_point';
      v_parent_id_column := 'grammar_point_id';
      v_order_column := 'example_order';
      v_allowed_columns := array['grammar_point_id', 'lesson_id', 'example_order', 'zh', 'pinyin', 'vi', 'note'];
    when 'grammar_detail_section' then
      v_table_name := 'hanzihome_grammar_detail_sections';
      v_owner_column := 'owner_id';
      v_parent_entity_type := 'grammar_point';
      v_parent_id_column := 'grammar_point_id';
      v_order_column := 'section_order';
      v_allowed_columns := array['grammar_point_id', 'lesson_id', 'section_key', 'title', 'lines', 'section_order'];
    else
      raise exception using errcode = '22023', message = 'Unsupported HanziHome entity type';
  end case;

  for v_change_key in select jsonb_object_keys(coalesce(p_changes, '{}'::jsonb))
  loop
    if not (v_change_key = any(v_allowed_columns)) then
      raise exception using errcode = '22023', message = format('Field %s is not editable for %s', v_change_key, p_entity_type);
    end if;
    if p_operation <> 'create' and v_change_key = any(array['course_id', 'book_id', 'lesson_id', 'vocab_item_id', 'grammar_point_id']) then
      raise exception using errcode = '22023', message = 'Parent relationships cannot be changed by update';
    end if;
  end loop;

  if p_operation = 'create' then
    v_new_id := coalesce(nullif(p_entity_id, ''), gen_random_uuid()::text);
    v_insert_data := coalesce(p_changes, '{}'::jsonb)
      || jsonb_build_object('id', v_new_id, 'source', 'custom', v_owner_column, p_actor_id, 'created_at', now(), 'updated_at', now());

    if v_order_column is not null and not (v_insert_data ? v_order_column) then
      if v_parent_id_column is null then
        execute format('select coalesce(max(%I), 0) + 1 from public.%I where deleted_at is null', v_order_column, v_table_name)
          into v_next_order;
      else
        v_parent_id := v_insert_data ->> v_parent_id_column;
        execute format('select coalesce(max(%I), 0) + 1 from public.%I where %I = $1 and deleted_at is null', v_order_column, v_table_name, v_parent_id_column)
          using v_parent_id into v_next_order;
      end if;
      v_insert_data := v_insert_data || jsonb_build_object(v_order_column, v_next_order);
    end if;

    if v_parent_id_column is not null then
      v_parent_id := nullif(v_insert_data ->> v_parent_id_column, '');
      if v_parent_id is null then
        raise exception using errcode = '23503', message = format('%s is required', v_parent_id_column);
      end if;

      case v_parent_entity_type
        when 'course' then execute 'select exists(select 1 from public.hanzihome_courses where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'book' then execute 'select exists(select 1 from public.hanzihome_course_books where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'lesson' then execute 'select exists(select 1 from public.hanzihome_lessons where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'vocab_item' then execute 'select exists(select 1 from public.hanzihome_vocab_items where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'grammar_point' then execute 'select exists(select 1 from public.hanzihome_grammar_points where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
      end case;
      if not coalesce(v_parent_exists, false) then
        raise exception using errcode = '23503', message = 'Active parent entity was not found';
      end if;
    end if;

    if p_entity_type = 'lesson' and not exists (
      select 1
      from public.hanzihome_course_books book
      where book.id = v_insert_data ->> 'book_id'
        and book.course_id = v_insert_data ->> 'course_id'
        and book.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Book does not belong to the requested course';
    end if;

    if p_entity_type in ('vocab_item', 'grammar_point') and not exists (
      select 1
      from public.hanzihome_lessons lesson
      where lesson.id = v_insert_data ->> 'lesson_id'
        and lesson.course_id = v_insert_data ->> 'course_id'
        and lesson.book_id = v_insert_data ->> 'book_id'
        and lesson.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Lesson hierarchy does not match course and book';
    end if;

    if p_entity_type in ('vocab_example', 'vocab_detail_section') and not exists (
      select 1
      from public.hanzihome_vocab_items item
      where item.id = v_insert_data ->> 'vocab_item_id'
        and item.lesson_id = v_insert_data ->> 'lesson_id'
        and item.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Vocabulary child does not belong to the requested lesson';
    end if;

    if p_entity_type in ('grammar_example', 'grammar_detail_section') and not exists (
      select 1
      from public.hanzihome_grammar_points point
      where point.id = v_insert_data ->> 'grammar_point_id'
        and point.lesson_id = v_insert_data ->> 'lesson_id'
        and point.deleted_at is null
    ) then
      raise exception using errcode = '23503', message = 'Grammar child does not belong to the requested lesson';
    end if;

    execute format(
      'insert into public.%1$I as inserted select (jsonb_populate_record(null::public.%1$I, $1)).* returning to_jsonb(inserted.*)',
      v_table_name
    ) using v_insert_data into v_after;
  else
    if p_entity_id is null or length(trim(p_entity_id)) = 0 then
      raise exception using errcode = '22023', message = 'Entity id is required';
    end if;
    execute format('select to_jsonb(t), t.updated_at from public.%I t where t.id::text = $1 for update', v_table_name)
      using p_entity_id into v_before, v_current_updated_at;
    if v_before is null then
      raise exception using errcode = 'P0002', message = 'HanziHome entity not found';
    end if;
    if p_expected_updated_at is null or v_current_updated_at <> p_expected_updated_at then
      raise exception using errcode = '40001', message = 'HanziHome entity changed since it was loaded';
    end if;
    if p_operation <> 'restore' and v_before ->> 'deleted_at' is not null then
      raise exception using errcode = '22023', message = 'Deleted content must be restored before it can be changed';
    end if;

    v_parent_id := case when v_parent_id_column is null then null else v_before ->> v_parent_id_column end;

    if p_operation <> 'restore' and v_parent_entity_type is not null then
      case v_parent_entity_type
        when 'course' then execute 'select exists(select 1 from public.hanzihome_courses where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'book' then execute 'select exists(select 1 from public.hanzihome_course_books where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'lesson' then execute 'select exists(select 1 from public.hanzihome_lessons where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'vocab_item' then execute 'select exists(select 1 from public.hanzihome_vocab_items where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
        when 'grammar_point' then execute 'select exists(select 1 from public.hanzihome_grammar_points where id = $1 and deleted_at is null)' using v_parent_id into v_parent_exists;
      end case;
      if not coalesce(v_parent_exists, false) then
        raise exception using errcode = '23503', message = 'Active parent entity was not found';
      end if;
    end if;

    if p_operation = 'update' then
      if p_changes = '{}'::jsonb then
        raise exception using errcode = '22023', message = 'Update requires at least one changed field';
      end if;

      select string_agg(
        format('%1$I = patch.%1$I', attribute.attname),
        ', '
      )
      into v_set_clause
      from pg_attribute attribute
      where attribute.attrelid = format('public.%s', v_table_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
        and attribute.attname in (select jsonb_object_keys(p_changes));

      if v_set_clause is null then
        raise exception using errcode = '22023', message = 'No editable changes were provided';
      end if;

      execute format(
        'update public.%1$I target set %2$s from jsonb_populate_record(null::public.%1$I, $1) patch where target.id::text = $2 returning to_jsonb(target.*)',
        v_table_name,
        v_set_clause
      ) using p_changes, p_entity_id into v_after;
    elsif p_operation = 'reorder' then
      if v_order_column is null or not (p_changes ? v_order_column) then
        raise exception using errcode = '22023', message = 'Reorder requires the owned order field';
      end if;
      if (select count(*) from jsonb_object_keys(p_changes)) <> 1 then
        raise exception using errcode = '22023', message = 'Reorder only accepts the owned order field';
      end if;

      v_current_order := (v_before ->> v_order_column)::integer;
      v_next_order := (p_changes ->> v_order_column)::integer;
      if v_next_order < 1 then
        raise exception using errcode = '22023', message = 'Order must be a positive integer';
      end if;

      if v_next_order = v_current_order then
        v_after := v_before;
      else
        if v_parent_id_column is null then
          execute format(
            'select id::text from public.%I where %I = $1 and deleted_at is null and id::text <> $2 limit 1 for update',
            v_table_name,
            v_order_column
          ) using v_next_order, p_entity_id into v_sibling_id;
        else
          execute format(
            'select id::text from public.%I where %I = $1 and %I = $2 and deleted_at is null and id::text <> $3 limit 1 for update',
            v_table_name,
            v_order_column,
            v_parent_id_column
          ) using v_next_order, v_parent_id, p_entity_id into v_sibling_id;
        end if;

        if v_sibling_id is not null then
          execute format(
            'update public.%I set %I = $1 where id::text = $2',
            v_table_name,
            v_order_column
          ) using -2147483648, p_entity_id;
          execute format(
            'update public.%I set %I = $1 where id::text = $2',
            v_table_name,
            v_order_column
          ) using v_current_order, v_sibling_id;
        end if;

        execute format(
          'update public.%I set %I = $1 where id::text = $2 returning to_jsonb(%I.*)',
          v_table_name,
          v_order_column,
          v_table_name
        ) using v_next_order, p_entity_id into v_after;
      end if;
    elsif p_operation = 'delete' then
      if v_before ->> 'deleted_at' is not null then
        raise exception using errcode = '22023', message = 'Entity is already deleted';
      end if;
      execute format('update public.%I set deleted_at = now(), deleted_by = $1 where id::text = $2 returning to_jsonb(%I.*)', v_table_name, v_table_name)
        using p_actor_id, p_entity_id into v_after;
    elsif p_operation = 'restore' then
      if v_before ->> 'deleted_at' is null then
        raise exception using errcode = '22023', message = 'Entity is not deleted';
      end if;
      execute format('update public.%I set deleted_at = null, deleted_by = null where id::text = $1 returning to_jsonb(%I.*)', v_table_name, v_table_name)
        using p_entity_id into v_after;
    end if;
  end if;

  insert into public.hanzihome_content_audit_log (
    actor_id,
    operation,
    entity_type,
    entity_id,
    parent_entity_type,
    parent_entity_id,
    before_data,
    after_data,
    reason
  ) values (
    p_actor_id,
    coalesce(p_audit_operation, p_operation),
    coalesce(p_audit_entity_type, p_entity_type),
    coalesce(p_audit_entity_id, p_entity_id, v_new_id),
    coalesce(p_audit_parent_entity_type, v_parent_entity_type),
    coalesce(p_audit_parent_entity_id, v_parent_id),
    v_before,
    v_after,
    trim(p_reason)
  );

  return jsonb_build_object('item', v_after);
end;
$$;

revoke all on function private.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
from public, anon, authenticated;
grant execute on function private.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
to service_role;

comment on function private.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
) is
  'Server-only canonical HanziHome CRUD boundary. Applies optimistic concurrency and writes the audit record in the same transaction.';

create or replace function public.hanzihome_mutate_content(
  p_actor_id uuid,
  p_operation text,
  p_entity_type text,
  p_entity_id text default null,
  p_expected_updated_at timestamptz default null,
  p_changes jsonb default '{}'::jsonb,
  p_reason text default null,
  p_audit_operation text default null,
  p_audit_entity_type text default null,
  p_audit_entity_id text default null,
  p_audit_parent_entity_type text default null,
  p_audit_parent_entity_id text default null
)
returns jsonb
language sql
set search_path = ''
as $$
  select private.hanzihome_mutate_content(
    p_actor_id,
    p_operation,
    p_entity_type,
    p_entity_id,
    p_expected_updated_at,
    p_changes,
    p_reason,
    p_audit_operation,
    p_audit_entity_type,
    p_audit_entity_id,
    p_audit_parent_entity_type,
    p_audit_parent_entity_id
  );
$$;

revoke all on function public.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
from public, anon, authenticated;
grant execute on function public.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
)
to service_role;

comment on function public.hanzihome_mutate_content(
  uuid, text, text, text, timestamptz, jsonb, text, text, text, text, text, text
) is
  'Service-role RPC wrapper for the private HanziHome canonical CRUD transaction.';

commit;
