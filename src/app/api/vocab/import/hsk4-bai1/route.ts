import { NextResponse } from "next/server";
import { hsk4Bai1Lesson } from "@/features/hsk/data/hsk4-bai1";
import { createClient } from "@/lib/supabase/server";
import type { AiAnalysis } from "@/types/database";

export const dynamic = "force-dynamic";

const COURSE_KEY = "hsk4-bai1";
const LESSON_KEY = "HSK4-L01";
const SOURCE_FILE = "hsk_4_bai_1_on_tap_app.jsx";

function normalizeType(type: string) {
 const value = type.trim();
 const map: Record<string, string> = {
  dt: "Danh từ",
  đgt: "Động từ",
  tt: "Tính từ",
 };
 return map[value] || value;
}

function buildAnalysis(index: number): AiAnalysis {
 const item = hsk4Bai1Lesson.vocab[index];
 const relatedPhrases = hsk4Bai1Lesson.phrases
  .filter((phrase) => phrase.example.includes(item.hanzi) || phrase.hanzi.includes(item.hanzi))
  .slice(0, 4);

 return {
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  han_viet: "",
  sino_vietnamese: "",
  meaning_summary: item.vi,
  meaning_detail: item.vi,
  word_type: normalizeType(item.type),
  hsk_level: hsk4Bai1Lesson.hskLevel,
  collocations: relatedPhrases.map((phrase) => `${phrase.hanzi} – ${phrase.vi}`),
  examples: [
   {
    zh: item.example,
    pinyin: "",
    vi: item.vi,
    note: "Ví dụ từ nguồn HSK Bài 1.",
   },
  ],
  usage_note: relatedPhrases.length
   ? `Cụm liên quan: ${relatedPhrases.map((phrase) => phrase.hanzi).join("、")}.`
   : undefined,
  cultural_note: hsk4Bai1Lesson.title,
  source_metadata: {
   course_key: COURSE_KEY,
   lesson_key: LESSON_KEY,
   lesson_number: hsk4Bai1Lesson.lessonNumber,
   lesson_title: `${hsk4Bai1Lesson.hskLevel} Bài ${hsk4Bai1Lesson.lessonNumber}: ${hsk4Bai1Lesson.title}`,
   row_number: index + 1,
   category: "HSK từ vựng",
   source_file: SOURCE_FILE,
  },
 };
}

export async function POST() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const now = new Date().toISOString();
 const { data: course, error: courseError } = await supabase
  .from("vocab_courses")
  .upsert(
   {
    owner_id: user.id,
    course_key: COURSE_KEY,
    title: `${hsk4Bai1Lesson.hskLevel} · Bài ${hsk4Bai1Lesson.lessonNumber}: ${hsk4Bai1Lesson.title}`,
    source_file: SOURCE_FILE,
    source_path: "src/features/hsk/data/hsk4-bai1.ts",
    generated_at: now,
   },
   { onConflict: "owner_id,course_key" },
  )
  .select("*")
  .single();

 if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });

 const { data: existingLesson, error: existingLessonError } = await supabase
  .from("vocab_lessons")
  .select("*")
  .eq("course_id", course.id)
  .eq("lesson_key", LESSON_KEY)
  .maybeSingle();

 if (existingLessonError) {
  return NextResponse.json({ error: existingLessonError.message }, { status: 500 });
 }

 const lessonTitle = `Bài ${hsk4Bai1Lesson.lessonNumber}: ${hsk4Bai1Lesson.title}`;
 const lesson =
  existingLesson ||
  (
   await supabase
    .from("vocab_lessons")
    .insert({
     course_id: course.id,
     lesson_key: LESSON_KEY,
     lesson_number: hsk4Bai1Lesson.lessonNumber,
     title: lessonTitle,
     lesson_order: hsk4Bai1Lesson.lessonNumber,
     item_count: hsk4Bai1Lesson.vocab.length,
    })
    .select("*")
    .single()
  ).data;

 if (!lesson) return NextResponse.json({ error: "Không tạo được bài HSK" }, { status: 500 });

 if (existingLesson) {
  const { count, error: countError } = await supabase
   .from("vocab_entries")
   .select("id", { count: "exact", head: true })
   .eq("lesson_id", existingLesson.id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count || 0) > 0) {
   return NextResponse.json({ courseId: course.id, lessonId: existingLesson.id, created: false });
  }
 }

 const rows = hsk4Bai1Lesson.vocab.map((item, index) => ({
  course_id: course.id,
  lesson_id: lesson.id,
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  sino_vietnamese: null,
  meaning: item.vi,
  word_type: normalizeType(item.type),
  category: "HSK từ vựng",
  row_number: index + 1,
  ai_analysis: buildAnalysis(index),
 }));

 const { data: entries, error: entriesError } = await supabase
  .from("vocab_entries")
  .insert(rows)
  .select("id");

 if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });

 if (entries?.length) {
  const { error: progressError } = await supabase.from("user_vocab_entry_progress").upsert(
   entries.map((entry) => ({
    user_id: user.id,
    entry_id: entry.id,
    proficiency_level: 0,
    is_favorited: false,
   })),
   { onConflict: "user_id,entry_id" },
  );
  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });
 }

 await supabase
  .from("vocab_lessons")
  .update({ item_count: hsk4Bai1Lesson.vocab.length })
  .eq("id", lesson.id);

 return NextResponse.json({
  courseId: course.id,
  lessonId: lesson.id,
  created: true,
  imported: entries?.length || 0,
 });
}
