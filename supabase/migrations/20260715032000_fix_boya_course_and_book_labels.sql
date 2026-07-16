begin;

update public.hanzihome_courses
set title = case id
  when 'boya-elementary' then 'Boya · Sơ cấp'
  when 'boya-preintermediate' then 'Boya · Cận trung cấp'
  when 'boya-intermediate' then 'Boya · Trung cấp'
 end,
 subtitle = case id
  when 'boya-elementary' then '初级起步篇 · Quyển I–II'
  when 'boya-preintermediate' then '准中级加速篇 · Quyển I–II'
  when 'boya-intermediate' then '中级冲刺篇 · hiện có Quyển II'
 end,
 updated_at = now()
where source = 'seed'
 and id in ('boya-elementary', 'boya-preintermediate', 'boya-intermediate');

update public.hanzihome_course_books
set title = case id
  when 'boya-elementary-1' then 'Boya Sơ cấp · Quyển 1'
  when 'boya-elementary-2' then 'Boya Sơ cấp · Quyển 2'
  when 'boya-preintermediate-1' then 'Boya Cận trung cấp · Quyển 1'
  when 'boya-preintermediate-2' then 'Boya Cận trung cấp · Quyển 2'
  when 'boya-intermediate-2' then 'Boya Trung cấp · Quyển 2'
 end,
 short_title = case id
  when 'boya-elementary-1' then 'Sơ cấp · Quyển 1'
  when 'boya-elementary-2' then 'Sơ cấp · Quyển 2'
  when 'boya-preintermediate-1' then 'Cận trung cấp · Quyển 1'
  when 'boya-preintermediate-2' then 'Cận trung cấp · Quyển 2'
  when 'boya-intermediate-2' then 'Trung cấp · Quyển 2'
 end,
 updated_at = now()
where source = 'seed'
 and id in (
  'boya-elementary-1',
  'boya-elementary-2',
  'boya-preintermediate-1',
  'boya-preintermediate-2',
  'boya-intermediate-2'
 );

commit;
