import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { generateGrammarExerciseSetDetailed } from "@/services/ai.service";
import { generateGrammarExercisesForPoint, isMissingGrammarTableError } from "@/services/grammar-learning.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import type { DbGrammarExercise, DbGrammarPoint, DbUserGrammarPointProgress, GrammarExerciseType, GrammarPointWithProgress } from "@/types/database";

export const dynamic = "force-dynamic";

const exerciseTypes: GrammarExerciseType[] = ["fill_blank", "multiple_choice", "reorder_sentence", "translate_zh", "identify_error"];

function migrationRequired(message?: string) {
 return NextResponse.json(
  {
   error: "Database grammar schema chưa được apply. Chạy migration supabase/migrations/20260312000016_grammar_learning.sql trước.",
   details: message,
   migrationRequired: true,
  },
  { status: 409 },
 );
}

function asPointWithProgress(point: DbGrammarPoint, progress?: DbUserGrammarPointProgress | null, exercises: DbGrammarExercise[] = []): GrammarPointWithProgress {
 const level = progress?.proficiency_level ?? 0;
 return {
  ...point,
  tags: point.tags || [],
  content: point.content || {},
  proficiency_level: level,
  status: level >= 4 ? "mastered" : level >= 2 ? "learning" : "new",
  exercises,
 };
}

function isValidExerciseType(value: unknown): value is GrammarExerciseType {
 return typeof value === "string" && exerciseTypes.includes(value as GrammarExerciseType);
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 try {
  const body = (await request.json()) as {
   lesson_id?: string | null;
   point_id?: string | null;
   exercise_type?: GrammarExerciseType | "mixed";
   count_per_type?: number;
   replace_old?: boolean;
  };
  if (!body.lesson_id && !body.point_id) return NextResponse.json({ error: "Chọn bài hoặc điểm ngữ pháp để tạo bài tập" }, { status: 400 });

  const pointQuery = supabase.from("grammar_points").select("*").order("row_number", { ascending: true });
  const { data: rawPoints, error: pointError } = body.point_id
   ? await pointQuery.eq("id", body.point_id)
   : await pointQuery.eq("lesson_id", body.lesson_id);
  if (isMissingGrammarTableError(pointError)) return migrationRequired(pointError?.message);
  if (pointError) return NextResponse.json({ error: pointError.message }, { status: 500 });
  if (!rawPoints?.length) return NextResponse.json({ error: "Không có điểm ngữ pháp để tạo bài tập" }, { status: 404 });

  const selectedPointIds = rawPoints.map((point) => point.id);
  const poolLessonId = body.lesson_id || rawPoints[0]?.lesson_id || null;
  const { data: poolRawPoints } = poolLessonId
   ? await supabase.from("grammar_points").select("*").eq("lesson_id", poolLessonId).order("row_number", { ascending: true })
   : { data: rawPoints };
  const pointIds = Array.from(new Set([...(poolRawPoints || rawPoints).map((point) => point.id), ...selectedPointIds]));
  const { data: progressRows } = await supabase
   .from("user_grammar_point_progress")
   .select("*")
   .eq("user_id", user.id)
   .in("point_id", pointIds);
  const progressByPoint = new Map(((progressRows || []) as DbUserGrammarPointProgress[]).map((row) => [row.point_id, row]));
  const poolPoints = ((poolRawPoints?.length ? poolRawPoints : rawPoints) as DbGrammarPoint[]).map((point) => asPointWithProgress(point, progressByPoint.get(point.id)));
  const points = (rawPoints as DbGrammarPoint[]).map((point) => asPointWithProgress(point, progressByPoint.get(point.id)));

  const selectedTypes = body.exercise_type && body.exercise_type !== "mixed" ? [body.exercise_type] : exerciseTypes;
  const count = Math.min(Math.max(Number(body.count_per_type || 10), 1), 20);
  const exerciseSetId = `set-${Date.now()}`;

  if (body.replace_old !== false) {
   const { data: existing, error: existingError } = await supabase
    .from("grammar_exercises")
    .select("id, content")
    .in("point_id", pointIds);
   if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
   const generatedIds = (existing || [])
    .filter((exercise) => {
     const generatedBy = (exercise.content as { generated_by?: string } | null)?.generated_by;
     return generatedBy === "grammar-rule-v1" || generatedBy === "ai";
    })
    .map((exercise) => exercise.id);
   if (generatedIds.length) {
    const { error: deleteError } = await supabase.from("grammar_exercises").delete().in("id", generatedIds);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
   }
  }

  const { data: grammarLesson } = poolLessonId
   ? await supabase.from("grammar_lessons").select("lesson_number").eq("id", poolLessonId).maybeSingle()
   : { data: null };
  const { data: vocabLessons } = grammarLesson?.lesson_number
   ? await supabase
      .from("vocab_lessons")
      .select("id, lesson_number")
      .eq("lesson_number", grammarLesson.lesson_number)
   : { data: [] };
  const vocabLessonIds = (vocabLessons || []).map((lesson) => lesson.id);
  const { data: vocabRows } = vocabLessonIds.length
   ? await supabase.from("vocab_entries").select("hanzi, pinyin, meaning").in("lesson_id", vocabLessonIds).limit(60)
   : { data: [] };

  let rows: Omit<DbGrammarExercise, "id" | "created_at" | "updated_at">[] = [];
  let generatedBy = "fallback";
  try {
   const promptSettings = await getUserAiPromptSettings(supabase, user.id);
   const userApiKeys = await getActiveUserApiKeyCredentials(supabase, user.id);
   const aiResult = await generateGrammarExerciseSetDetailed(
    {
     points,
     exerciseType: body.exercise_type || "mixed",
     countPerType: count,
     lessonTitle: rawPoints[0]?.content?.source_metadata?.lesson_title || null,
     vocabulary: (vocabRows || []).map((row) => ({ hanzi: row.hanzi, pinyin: row.pinyin, meaning: row.meaning })),
    },
    {
     geminiModel: promptSettings.geminiModel,
     userApiKeys,
    },
   );
   if (aiResult.data?.exercises?.length) {
    rows = aiResult.data.exercises
     .filter((exercise) => isValidExerciseType(exercise.exercise_type) && exercise.prompt?.trim())
     .map((exercise, index) => {
      const point = points[index % points.length];
      return {
       course_id: point.course_id,
       lesson_id: point.lesson_id,
       point_id: point.id,
       exercise_type: exercise.exercise_type,
       prompt: exercise.prompt.trim(),
       content: {
        ...(exercise.content || {}),
        exercise_set_id: exerciseSetId,
        generated_by: "ai",
        generated_at: new Date().toISOString(),
        source_point_title: point.title,
       },
       answer: exercise.answer || {},
       explanation: exercise.explanation || point.content.explanation || null,
       exercise_order: index + 1,
      };
     });
    generatedBy = "ai";
   }
  } catch {
   rows = [];
  }

  if (!rows.length) {
   rows = points.flatMap((point, pointIndex) =>
    selectedTypes.flatMap((type) =>
     generateGrammarExercisesForPoint({
      point,
      type,
      count,
      pool: rotatePool(poolPoints, pointIndex),
      exerciseSetId,
     }),
    ),
   );
  }

  const { data: inserted, error: insertError } = await supabase.from("grammar_exercises").insert(rows).select("*");
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({
   exerciseSetId,
   inserted: inserted?.length || 0,
   types: selectedTypes,
   points: points.length,
   generatedBy,
  });
 } catch (error) {
  if (isMissingGrammarTableError(error as { code?: string; message?: string })) {
   return migrationRequired((error as Error).message);
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Không tạo được bài tập" }, { status: 500 });
 }
}

function rotatePool(points: GrammarPointWithProgress[], index: number) {
 if (!points.length) return points;
 const offset = index % points.length;
 return [...points.slice(offset), ...points.slice(0, offset)];
}
