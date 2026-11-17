begin;

-- Course lesson content is bundled with the application (static textbook JSON).
-- Nothing reads or writes these tables or functions any more. The course,
-- book and lesson rows stay: the vocabulary store rows in hanzihome_vocab_items
-- and lesson annotations still reference them.

do $$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'public' and p.proname = any (array[
        'get_hanzihome_catalog_stats',
        'get_hanzihome_aggregate_grammar',
        'hanzihome_apply_external_seed_patches',
        'hanzihome_import_external_seed_package',
        'hanzihome_refresh_external_seed_package',
        'hanzihome_list_vocab_children',
        'hanzihome_preview_vocab_child_bulk',
        'hanzihome_mutate_vocab_child_bulk',
        'hanzihome_vocab_child_candidates',
        'hanzihome_mutate_content',
        'hanzihome_mutate_content_as_user',
        'hanzihome_purge_deleted_content_as_user',
        'hanzihome_update_listening_item_as_user'
      ]))
      or (n.nspname = 'private' and p.proname = 'hanzihome_mutate_content')
  loop
    execute format('drop function %s', v_function);
  end loop;
end;
$$;

drop table public.hanzihome_listening_audio;
drop table public.hanzihome_listening_items;
drop table public.hanzihome_vocab_examples;
drop table public.hanzihome_vocab_detail_sections;
drop table public.hanzihome_grammar_examples;
drop table public.hanzihome_grammar_detail_sections;
drop table public.hanzihome_grammar_points;
drop table public.hanzihome_lesson_sections;
drop table public.hanzihome_lesson_texts;

commit;
