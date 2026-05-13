import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyVocabType } from "@/services/vocab.service";
import type { AiAnalysis } from "@/types/database";

export const dynamic = "force-dynamic";

type StagedLesson = {
 lesson_key: string;
 lesson_number: number | null;
 lesson_title: string;
 count: number;
};

type StagedItem = {
 hanzi: string;
 pinyin?: string;
 sino_vietnamese?: string;
 meaning_summary?: string;
 meaning_detail?: string;
 source_metadata?: AiAnalysis["source_metadata"];
 definitions?: AiAnalysis["definitions"];
 word_type?: string;
 decomposition?: string;
 comparisons?: string[];
 collocations?: string[];
 examples?: AiAnalysis["examples"];
 cultural_note?: string;
 usage_note?: string;
 notes?: string;
};

type StagedPayload = {
 source_file?: string;
 generated_at?: string;
 lessons: StagedLesson[];
 items: StagedItem[];
};

function statusResponse(error: string, details?: string, status = 500) {
 return NextResponse.json({ error, details }, { status });
}

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

export async function POST() {
 if (process.env.NODE_ENV !== "development") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
 }

 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const payloadPath = path.join(process.cwd(), "data/import/hanyu-docx-vocab-staging.json");
 const payload = JSON.parse(await fs.readFile(payloadPath, "utf8")) as StagedPayload;
 const sourceFile = path.basename(payload.source_file || "Vocabulary Compilation.docx");
 const courseKey = payload.items[0]?.source_metadata?.course_key || `docx:${sourceFile.replace(/\.[^.]+$/, "")}`;
 const courseTitle = sourceFile.replace(/\.[^.]+$/, "");

 await supabase.from("user_vocab_entry_progress").delete().eq("user_id", user.id);
 await supabase.from("user_vocab_progress").delete().eq("user_id", user.id);
 await supabase.from("user_vocabularies").delete().eq("user_id", user.id);

const existingCourse = await supabase
  .from("vocab_courses")
  .select("id")
 .eq("owner_id", user.id)
  .eq("course_key", courseKey)
  .maybeSingle();

 if (isMissingTableError(existingCourse.error)) return migrationRequiredResponse(existingCourse.error?.message);
 if (existingCourse.error) {
  return statusResponse("Failed to lookup course", existingCourse.error.message);
 }

 if (existingCourse.data?.id) {
  const deleteCourse = await supabase
   .from("vocab_courses")
   .delete()
   .eq("id", existingCourse.data.id);
  if (deleteCourse.error) {
   return statusResponse("Failed to clean old course", deleteCourse.error.message);
  }
 }

 const courseInsert = await supabase
  .from("vocab_courses")
  .insert({
   owner_id: user.id,
   course_key: courseKey,
   title: courseTitle,
   source_file: sourceFile,
   source_path: payload.source_file || null,
   generated_at: payload.generated_at || null,
  })
  .select("id")
  .single();

 if (courseInsert.error || !courseInsert.data) {
  return statusResponse("Failed to create course", courseInsert.error?.message);
 }

 const courseId = courseInsert.data.id as string;
 const lessonRows = payload.lessons.map((lesson, index) => ({
  course_id: courseId,
  lesson_key: lesson.lesson_key,
  lesson_number: lesson.lesson_number,
  title: lesson.lesson_title,
  lesson_order: lesson.lesson_number ?? index + 1,
  item_count: lesson.count,
 }));

 const lessonsInsert = await supabase
  .from("vocab_lessons")
  .insert(lessonRows)
  .select("id, lesson_key");

 if (lessonsInsert.error || !lessonsInsert.data) {
  return statusResponse("Failed to create lessons", lessonsInsert.error?.message);
 }

 const lessonIds = new Map<string, string>(
  lessonsInsert.data.map((lesson: { id: string; lesson_key: string }) => [lesson.lesson_key, lesson.id]),
 );

 const entryRows = payload.items.map((item, index) => {
  const source = item.source_metadata;
  const lessonId = lessonIds.get(source?.lesson_key || "");
  if (!lessonId) {
   throw new Error(`Missing lesson for ${item.hanzi} at ${index + 1}`);
  }

  const aiAnalysis: AiAnalysis = {
   ...item,
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   han_viet: item.sino_vietnamese,
   meaning_summary: item.meaning_summary,
   meaning_detail: item.meaning_detail,
   source_metadata: source,
  };

  return {
   course_id: courseId,
   lesson_id: lessonId,
   hanzi: item.hanzi,
   pinyin: item.pinyin || "",
   sino_vietnamese: item.sino_vietnamese || null,
   meaning: item.meaning_summary || item.meaning_detail || "",
   word_type: item.word_type || item.definitions?.[0]?.pos || null,
   category: source?.category || null,
   row_number: source?.row_number || index + 1,
   ai_analysis: aiAnalysis,
  };
 });

 const entriesInsert = await supabase.from("vocab_entries").insert(entryRows).select("id, hanzi");
 if (entriesInsert.error || !entriesInsert.data) {
  return statusResponse("Failed to create entries", entriesInsert.error?.message);
 }

 const progressRows = entriesInsert.data.map((entry: { id: string }) => ({
  user_id: user.id,
  entry_id: entry.id,
  proficiency_level: 0,
  is_favorited: true,
 }));
 const progressInsert = await supabase.from("user_vocab_entry_progress").insert(progressRows);
 if (progressInsert.error) {
  return statusResponse("Failed to create progress", progressInsert.error.message);
 }

 const dictionaryRows = new Map<string, StagedItem>();
 for (const item of payload.items) {
  if (!dictionaryRows.has(item.hanzi)) dictionaryRows.set(item.hanzi, item);
 }

 for (const item of dictionaryRows.values()) {
  await supabase.from("dictionary_core").upsert(
   {
    headword: item.hanzi,
    lookup_key: item.hanzi,
    pinyin: item.pinyin || "",
    sino_vietnamese: item.sino_vietnamese || null,
    data: item,
    type: classifyVocabType(item.hanzi, item.pinyin),
   },
   { onConflict: "lookup_key" },
  );
 }

 return NextResponse.json({
  courseId,
  sourceFile,
  lessonCount: payload.lessons.length,
  entryCount: entriesInsert.data.length,
  dictionaryUnique: dictionaryRows.size,
 });
}
