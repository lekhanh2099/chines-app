-- 1. Bảng Users (Extended Profile)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  
  -- Monetization & AI Quota (Chuẩn bị cho tương lai)
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'lifetime')),
  ai_credits int default 10, -- Số lượt dùng AI còn lại trong ngày/tháng
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bật RLS (Row Level Security) ngay lập tức
alter table public.users enable row level security;

-- Policy mẫu: User xem được profile của chính mình
create policy "Users can view own profile" on public.users 
  for select using (auth.uid() = id);

-- 2. Bảng Books (Giáo trình)
create table public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,        -- VD: Giáo trình Hán ngữ 1
  level text,                 -- VD: HSK 1
  cover_url text,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Bảng Lessons (Bài học)
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books(id) on delete cascade,
  title text not null,        -- VD: Bài 5 - Cửa hàng ở đâu
  lesson_order int,           -- Thứ tự bài: 1, 2, 3...
  
  -- Hybrid Content:
  description text,           -- Mô tả ngắn
  raw_passage text,           -- Bài khóa gốc (Text thô)
  audio_url text,             -- Link file nghe (nếu có)
  
  created_at timestamp with time zone default now()
);

-- 4. Bảng Vocabularies (Kho từ vựng dùng chung)
create table public.vocabularies (
  id uuid default gen_random_uuid() primary key,
  hanzi text not null unique, -- "Hạt nhân" duy nhất (Index tự động)
  pinyin text,
  meaning text,
  
  -- 🌟 HYBRID POWER: Lưu toàn bộ phân tích AI vào JSONB
  ai_analysis jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default now()
);

-- 5. Bảng Pivot: Lesson <-> Vocabulary (Many-to-Many)
create table public.lesson_vocabularies (
  lesson_id uuid references public.lessons(id) on delete cascade,
  vocab_id uuid references public.vocabularies(id) on delete cascade,
  is_target_word boolean default true, -- Đánh dấu từ trọng tâm
  primary key (lesson_id, vocab_id)
);

-- 6. Bảng Notes (Ghi chú cá nhân)
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  
  title text default 'Untitled',
  
  -- 🌟 NOTION COMPATIBILITY: Content dạng JSON Blocks
  content jsonb default '{}'::jsonb,
  
  tags text[],                 -- Array tags: ['grammar', 'hsk1']
  linked_lesson_id uuid references public.lessons(id), -- Link note vào bài học
  
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Policy: Chỉ user sở hữu mới được xem/sửa note của mình
alter table public.notes enable row level security;
create policy "Users can manage own notes" on public.notes
  for all using (auth.uid() = user_id);

-- 7. Bảng Exercises (Ngân hàng câu hỏi)
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade,
  type text check (type in ('multiple_choice', 'fill_blank', 'true_false')),
  
  -- Hybrid: Lưu cấu trúc câu hỏi + đáp án trong JSONB
  content jsonb not null, 
  
  order_index int
);

-- 8. Bảng User Progress (Tiến độ bài học)
create table public.user_lesson_progress (
  user_id uuid references public.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  status text default 'started' check (status in ('started', 'completed')),
  last_accessed_at timestamp with time zone default now(),
  primary key (user_id, lesson_id)
);

-- 9. Bảng SRS Tracking (Tiến độ nhớ từ - Spaced Repetition)
create table public.user_vocab_progress (
  user_id uuid references public.users(id) on delete cascade,
  vocab_id uuid references public.vocabularies(id) on delete cascade,
  
  proficiency_level int default 0, -- 0-5 (0: Mới, 5: Master)
  next_review_at timestamp with time zone, -- Thời gian cần ôn lại
  
  is_favorited boolean default false,
  primary key (user_id, vocab_id)
);
