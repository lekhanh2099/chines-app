begin;

create table if not exists public.hanzihome_memory_tips (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid references auth.users(id) on delete cascade,
  scope text not null default 'user'
    check (scope in ('system', 'user')),

  tip_type text not null default 'custom'
    check (tip_type in ('grammar', 'vocab', 'formula', 'custom')),

  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),

  formula text,
  example_zh text,
  example_pinyin text,
  example_vi text,

  source_type text not null default 'custom'
    check (source_type in ('grammar', 'vocab', 'lesson', 'custom', 'system')),
  source_lesson_id text,
  source_item_id text,
  source_label text,

  tags text[] not null default '{}',
  weight integer not null default 1 check (weight between 1 and 10),

  is_pinned boolean not null default false,
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hanzihome_memory_tips_owner_scope_check
    check (
      (scope = 'system' and owner_id is null)
      or
      (scope = 'user' and owner_id is not null)
    )
);

create index if not exists hanzihome_memory_tips_owner_active_idx
on public.hanzihome_memory_tips(owner_id, is_archived, created_at desc);

create index if not exists hanzihome_memory_tips_system_active_idx
on public.hanzihome_memory_tips(scope, is_archived, created_at desc);

create unique index if not exists hanzihome_memory_tips_unique_user_source_idx
on public.hanzihome_memory_tips(owner_id, source_type, source_item_id)
where owner_id is not null
  and source_item_id is not null
  and is_archived = false;

create or replace function public.set_hanzihome_memory_tips_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hanzihome_memory_tips_updated_at
on public.hanzihome_memory_tips;

create trigger set_hanzihome_memory_tips_updated_at
before update on public.hanzihome_memory_tips
for each row
execute function public.set_hanzihome_memory_tips_updated_at();

alter table public.hanzihome_memory_tips enable row level security;

drop policy if exists "Users can read own and system memory tips"
on public.hanzihome_memory_tips;

create policy "Users can read own and system memory tips"
on public.hanzihome_memory_tips
for select
to authenticated
using (
  is_archived = false
  and (
    scope = 'system'
    or owner_id = auth.uid()
  )
);

drop policy if exists "Users can insert own memory tips"
on public.hanzihome_memory_tips;

create policy "Users can insert own memory tips"
on public.hanzihome_memory_tips
for insert
to authenticated
with check (
  scope = 'user'
  and owner_id = auth.uid()
);

drop policy if exists "Users can update own memory tips"
on public.hanzihome_memory_tips;

create policy "Users can update own memory tips"
on public.hanzihome_memory_tips
for update
to authenticated
using (
  scope = 'user'
  and owner_id = auth.uid()
)
with check (
  scope = 'user'
  and owner_id = auth.uid()
);

drop policy if exists "Users can delete own memory tips"
on public.hanzihome_memory_tips;

create policy "Users can delete own memory tips"
on public.hanzihome_memory_tips
for delete
to authenticated
using (
  scope = 'user'
  and owner_id = auth.uid()
);

insert into public.hanzihome_memory_tips
(scope, tip_type, title, body, formula, example_zh, example_pinyin, example_vi, source_type, tags, weight)
values
('system', 'grammar', '把字句 cần có phần xử lý sau động từ', '把 không chỉ là đem tân ngữ lên trước. Sau động từ thường cần kết quả, hướng, nơi chốn, 给 ai đó, hoặc 了 để câu không bị cụt.', 'S + 把 + O + V + 结果/方向/到/在/给/了', '我把作业写完了。', 'Wǒ bǎ zuòyè xiě wán le.', 'Tôi làm xong bài tập rồi.', 'system', array['把字句', 'grammar'], 5),
('system', 'grammar', '又 và 再 không giống nhau', '又 thường nói việc đã lặp lại. 再 thường nói việc sẽ lặp lại hoặc làm thêm một lần nữa.', '又 = đã lại；再 = sẽ lại / thêm lần nữa', '他昨天又迟到了，明天不能再迟到了。', 'Tā zuótiān yòu chídào le, míngtiān bù néng zài chídào le.', 'Hôm qua anh ấy lại đi muộn, ngày mai không được đi muộn nữa.', 'system', array['又', '再'], 4),
('system', 'grammar', '一边...一边... cùng một chủ thể', '一边...一边... thường diễn tả một chủ thể làm hai hành động song song. Đừng tách thành hai chủ thể lung tung.', 'S + 一边 + V1 + 一边 + V2', '他一边听音乐，一边做作业。', 'Tā yìbiān tīng yīnyuè, yìbiān zuò zuòyè.', 'Anh ấy vừa nghe nhạc vừa làm bài tập.', 'system', array['一边', 'song song'], 4),
('system', 'grammar', 'V 得 + bổ ngữ trạng thái', '得 đứng sau động từ để mô tả mức độ/trạng thái của hành động, không đứng trước động từ như 地.', 'V + 得 + Adj/phrase', '他说得很快。', 'Tā shuō de hěn kuài.', 'Anh ấy nói rất nhanh.', 'system', array['得', '补语'], 4),
('system', 'vocab', '打工 không chỉ là làm thêm', '打工 là làm công/làm thuê/đi làm kiếm tiền. Làm thêm chỉ là một trường hợp hay gặp, nhất là với sinh viên.', null, '他在饭店打工。', 'Tā zài fàndiàn dǎgōng.', 'Anh ấy làm thuê ở nhà hàng.', 'system', array['打工', '工作'], 3)
on conflict do nothing;

commit;
