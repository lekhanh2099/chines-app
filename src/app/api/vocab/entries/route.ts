import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyVocabType, getPrimaryMeaning } from "@/services/vocab.service";
import type {
 AiAnalysis,
 DbVocabCourse,
 DbVocabEntry,
 DbVocabLesson,
 DbUserVocabEntryProgress,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";

export const dynamic = "force-dynamic";

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
 return error?.code === "PGRST205" || error?.message?.includes("Could not find the table");
}

function migrationRequiredResponse(details?: string) {
 return NextResponse.json(
  {
   error: "Database vocab schema chưa được apply. Chạy migration supabase/migrations/20260312000015_vocab_learning_entries.sql trước.",
   details,
   migrationRequired: true,
  },
  { status: 409 },
 );
}

function statusFromLevel(level: number): VocabEntryWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

function buildEntry(
 entry: DbVocabEntry,
 lesson: DbVocabLesson,
 course: DbVocabCourse,
 progress?: DbUserVocabEntryProgress,
): VocabEntryWithProgress {
 const analysis = (entry.ai_analysis || {}) as AiAnalysis;
 const level = progress?.proficiency_level ?? 0;
 const category = entry.category || analysis.source_metadata?.category || undefined;
 return {
  id: entry.id,
  course_id: entry.course_id,
  lesson_id: entry.lesson_id,
  hanzi: entry.hanzi,
  pinyin: entry.pinyin || analysis.pinyin || "",
  sino_vietnamese: entry.sino_vietnamese || analysis.sino_vietnamese || analysis.han_viet || undefined,
  meaning: getPrimaryMeaning(analysis, entry.meaning || ""),
  word_type: entry.word_type || analysis.word_type,
  category,
  row_number: entry.row_number,
  ai_analysis: analysis,
  proficiency_level: level,
  is_favorited: progress?.is_favorited ?? true,
  status: statusFromLevel(level),
  type: classifyVocabType(entry.hanzi, entry.pinyin),
  source: {
   courseKey: course.course_key,
   lessonKey: lesson.lesson_key,
   lessonNumber: lesson.lesson_number,
   lessonTitle: lesson.title,
   rowNumber: entry.row_number,
   category,
   sourceFile: course.source_file,
  },
 };
}

export async function GET(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const courseIdParam = request.nextUrl.searchParams.get("courseId");
const courseQuery = courseIdParam
  ? supabase
     .from("vocab_courses")
     .select("*")
     .eq("owner_id", user.id)
     .eq("id", courseIdParam)
     .maybeSingle()
  : supabase
     .from("vocab_courses")
     .select("*")
     .eq("owner_id", user.id)
     .order("imported_at", { ascending: false })
     .limit(1)
     .maybeSingle();

 const { data: course, error: courseError } = await courseQuery;
 if (isMissingTableError(courseError)) return migrationRequiredResponse(courseError?.message);
 if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
 if (!course) {
  return NextResponse.json({
   course: null,
   lessons: [],
   entries: [],
  });
 }

 const { data: lessons, error: lessonsError } = await supabase
  .from("vocab_lessons")
  .select("*")
 .eq("course_id", course.id)
 .order("lesson_order", { ascending: true });
 if (isMissingTableError(lessonsError)) return migrationRequiredResponse(lessonsError?.message);
 if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });

 const { data: entries, error: entriesError } = await supabase
  .from("vocab_entries")
  .select("*")
 .eq("course_id", course.id)
 .order("row_number", { ascending: true });
 if (isMissingTableError(entriesError)) return migrationRequiredResponse(entriesError?.message);
 if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });

 const entryIds = new Set((entries || []).map((entry) => entry.id));
 const { data: progressRows, error: progressError } = entryIds.size
  ? await supabase
     .from("user_vocab_entry_progress")
     .select("*")
     .eq("user_id", user.id)
  : { data: [], error: null };
 if (isMissingTableError(progressError)) return migrationRequiredResponse(progressError?.message);
 if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });

const progressByEntry = new Map<string, DbUserVocabEntryProgress>(
  (progressRows || [])
   .filter((progress) => entryIds.has(progress.entry_id))
   .map((progress) => [progress.entry_id, progress as DbUserVocabEntryProgress]),
 );
 const lessonById = new Map<string, DbVocabLesson>(
  (lessons || []).map((lesson) => [lesson.id, lesson as DbVocabLesson]),
 );
 const builtEntries = (entries || [])
  .map((entry) => {
   const lesson = lessonById.get(entry.lesson_id);
   if (!lesson) return null;
   return buildEntry(entry as DbVocabEntry, lesson, course as DbVocabCourse, progressByEntry.get(entry.id));
  })
  .filter((entry): entry is VocabEntryWithProgress => Boolean(entry));

 const entriesByLesson = builtEntries.reduce((map, entry) => {
  const current = map.get(entry.lesson_id) || [];
  current.push(entry);
  map.set(entry.lesson_id, current);
  return map;
 }, new Map<string, VocabEntryWithProgress[]>());

 const lessonPayload: VocabLessonWithStats[] = (lessons || []).map((lesson) => {
  const lessonEntries = entriesByLesson.get(lesson.id) || [];
  const mastered = lessonEntries.filter((entry) => entry.status === "mastered").length;
  const learning = lessonEntries.filter((entry) => entry.status === "learning").length;
  const fresh = lessonEntries.filter((entry) => entry.status === "new").length;
  const categories = Array.from(
   lessonEntries.reduce((map, entry) => {
    const name = entry.category || "Bổ sung";
    map.set(name, (map.get(name) || 0) + 1);
    return map;
   }, new Map<string, number>()),
  )
   .map(([name, count]) => ({ name, count }))
   .sort((a, b) => b.count - a.count);

  return {
   id: lesson.id,
   course_id: lesson.course_id,
   lesson_key: lesson.lesson_key,
   lesson_number: lesson.lesson_number,
   title: lesson.title,
   lesson_order: lesson.lesson_order,
   item_count: lessonEntries.length,
   entries: lessonEntries,
   mastered,
   learning,
   fresh,
   progress: lessonEntries.length ? Math.round((mastered / lessonEntries.length) * 100) : 0,
   categories,
  };
 });

 const payload: VocabCourseWithLessons = {
  id: course.id,
  course_key: course.course_key,
  title: course.title,
  source_file: course.source_file,
  source_path: course.source_path,
  generated_at: course.generated_at,
  imported_at: course.imported_at,
  lessons: lessonPayload,
  entries: builtEntries,
 };

 return NextResponse.json(payload);
}

type EntryCreate = {
 lesson_id?: string;
 hanzi?: string;
 pinyin?: string;
 sino_vietnamese?: string;
 meaning?: string;
 word_type?: string;
 category?: string;
 row_number?: number;
 ai_analysis?: AiAnalysis;
};

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = (await request.json()) as EntryCreate;
 if (!body.lesson_id) return NextResponse.json({ error: "Thiếu bài học cho từ mới" }, { status: 400 });
 if (!body.hanzi?.trim()) return NextResponse.json({ error: "Thiếu Hán tự" }, { status: 400 });

 const { data: lesson, error: lessonError } = await supabase
  .from("vocab_lessons")
  .select("id, course_id, lesson_key, lesson_number, title")
  .eq("id", body.lesson_id)
  .single();
 if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 });

 const { count, error: countError } = await supabase
  .from("vocab_entries")
  .select("id", { count: "exact", head: true })
  .eq("lesson_id", body.lesson_id);
 if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

 const rowNumber = Number(body.row_number || (count || 0) + 1);
 const aiAnalysis: AiAnalysis = {
  ...(body.ai_analysis || {}),
  hanzi: body.hanzi.trim(),
  pinyin: body.pinyin || body.ai_analysis?.pinyin || "",
  sino_vietnamese: body.sino_vietnamese || body.ai_analysis?.sino_vietnamese,
  han_viet: body.sino_vietnamese || body.ai_analysis?.han_viet,
  meaning_summary: body.meaning || body.ai_analysis?.meaning_summary || "",
  word_type: body.word_type || body.ai_analysis?.word_type,
  source_metadata: {
   ...body.ai_analysis?.source_metadata,
   lesson_key: lesson.lesson_key,
   lesson_number: lesson.lesson_number,
   lesson_title: lesson.title,
   row_number: rowNumber,
   category: body.category,
  },
 };

 const { data, error } = await supabase
  .from("vocab_entries")
  .insert({
   course_id: lesson.course_id,
   lesson_id: lesson.id,
   hanzi: body.hanzi.trim(),
   pinyin: body.pinyin || null,
   sino_vietnamese: body.sino_vietnamese || null,
   meaning: body.meaning || null,
   word_type: body.word_type || null,
   category: body.category || null,
   row_number: rowNumber,
   ai_analysis: aiAnalysis,
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ entry: data });
}
