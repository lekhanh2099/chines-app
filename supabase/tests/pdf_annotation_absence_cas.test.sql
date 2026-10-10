begin;
select plan(18);
insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-000000003001', 'pdf-cas-owner@example.test'),
 ('00000000-0000-4000-8000-000000003002', 'pdf-cas-other@example.test');

select ok(not has_function_privilege('anon', 'public.hanzihome_upsert_pdf_annotation_cas(text,integer,jsonb,integer,boolean)', 'EXECUTE'), 'guest cannot invoke PDF CAS');
select ok(not has_function_privilege('authenticated', 'public.hanzihome_upsert_pdf_annotation(text,integer,jsonb,integer)', 'EXECUTE'), 'legacy client RPC is blocked');
select ok(not has_function_privilege('service_role', 'public.hanzihome_upsert_pdf_annotation(text,integer,jsonb,integer)', 'EXECUTE'), 'legacy service RPC is blocked');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_pdf_annotations', 'INSERT'), 'direct insert cannot bypass absence CAS');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_pdf_annotations', 'UPDATE'), 'direct update cannot bypass revision CAS');
select ok(not has_table_privilege('authenticated', 'public.hanzihome_pdf_annotations', 'DELETE'), 'direct delete cannot bypass the observed base');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003001","role":"authenticated"}', true);
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[{"id":"A","tool":"pen","color":"#ff0000","width":4,"points":[{"x":0.1,"y":0.2}]}]}', 0, true)#>>'{annotation,revision}', '0', 'observed absence creates revision zero');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 0, true)->>'saved', 'false', 'second absent reader cannot overwrite revision zero');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 0, true)#>>'{annotation,payload,strokes,0,id}', 'A', 'creation conflict returns the entire current stroke payload');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 0, false)#>>'{annotation,revision}', '1', 'a loaded revision-zero row remains editable');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[{"id":"stale"}]}', 0, false)->>'saved', 'false', 'stale existing base cannot overwrite');
select is((select jsonb_array_length(payload->'strokes') from public.hanzihome_pdf_annotations where asset_id='pdf-cas-fixture'), 0, 'stale edits leave committed strokes unchanged');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 2, '{"strokes":[]}', 0, false)->>'saved', 'false', 'expected existing row cannot silently create a missing row');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 2, '{"strokes":[]}', 0, false)->'annotation', 'null'::jsonb, 'missing-row conflict returns observed absence');
select throws_ok($$select public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 1, true)$$, '22023', 'Invalid PDF annotation patch', 'absence base cannot carry a nonzero revision');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000003002","role":"authenticated"}', true);
select is((select count(*)::integer from public.hanzihome_pdf_annotations where asset_id='pdf-cas-fixture'), 0, 'another owner cannot read the first owner strokes');
select is(public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 0, true)#>>'{annotation,user_id}', '00000000-0000-4000-8000-000000003002', 'same page creation resolves identity from the caller');
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$select public.hanzihome_upsert_pdf_annotation_cas('pdf-cas-fixture', 1, '{"strokes":[]}', 0, true)$$, '28000', 'Authentication required', 'missing authenticated identity cannot mutate');
select * from finish();
rollback;
