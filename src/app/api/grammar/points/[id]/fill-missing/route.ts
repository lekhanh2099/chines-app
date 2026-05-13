import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import {
 generateGrammarFillMissingDetailed,
 type GrammarFillMissingResult,
} from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import type { DbGrammarExercise, GrammarPointContent } from "@/types/database";

export const dynamic = "force-dynamic";

function hasText(value?: string | null) {
 return Boolean(value?.trim());
}

function hasList(value?: unknown[] | null) {
 return Boolean(value?.length);
}

function mergeContent(existing: GrammarPointContent, generated: GrammarFillMissingResult): GrammarPointContent {
 return {
  ...existing,
  quick_example: {
   ...existing.quick_example,
   ...(!hasText(existing.quick_example?.zh) && generated.quick_example?.zh ? { zh: generated.quick_example.zh } : {}),
   ...(!hasText(existing.quick_example?.pinyin) && generated.quick_example?.pinyin ? { pinyin: generated.quick_example.pinyin } : {}),
   ...(!hasText(existing.quick_example?.vi) && generated.quick_example?.vi ? { vi: generated.quick_example.vi } : {}),
  },
  ...(!hasText(existing.explanation) && hasText(generated.explanation) ? { explanation: generated.explanation } : {}),
  ...(!hasList(existing.structures) && hasList(generated.structures) ? { structures: generated.structures } : {}),
  ...(!hasList(existing.usage_notes) && hasList(generated.usage_notes) ? { usage_notes: generated.usage_notes } : {}),
  ...(!hasList(existing.common_mistakes) && hasList(generated.common_mistakes) ? { common_mistakes: generated.common_mistakes } : {}),
  ...(!hasList(existing.comparisons) && hasList(generated.comparisons) ? { comparisons: generated.comparisons } : {}),
  ...(!hasList(existing.examples) && hasList(generated.examples) ? { examples: generated.examples } : {}),
 };
}

export async function POST(
 _request: NextRequest,
 { params }: { params: Promise<{ id: string }> },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const { data: point, error: pointError } = await supabase
  .from("grammar_points")
  .select("*")
  .eq("id", id)
  .single();
 if (pointError) return NextResponse.json({ error: pointError.message }, { status: 500 });

 const { data: exercises, error: exercisesError } = await supabase
  .from("grammar_exercises")
  .select("*")
  .eq("point_id", id)
  .order("exercise_order", { ascending: true });
 if (exercisesError) return NextResponse.json({ error: exercisesError.message }, { status: 500 });

 const promptSettings = await getUserAiPromptSettings(supabase, user.id);
 const userApiKeys = await getActiveUserApiKeyCredentials(supabase, user.id);
 const existingContent = (point.content || {}) as GrammarPointContent;
 const aiResult = await generateGrammarFillMissingDetailed(
  {
   title: point.title,
   pinyin: point.pinyin,
   vietnameseTitle: point.vietnamese_title,
   level: point.level,
   category: point.category,
   existing: existingContent,
  },
  {
   geminiModel: promptSettings.geminiModel,
   userApiKeys,
  },
 );

 if (!aiResult.data) {
  return NextResponse.json(
   { error: aiResult.error || "Không thể bổ sung ngữ pháp lúc này." },
   { status: 503 },
  );
 }

 const mergedContent = mergeContent(existingContent, aiResult.data);
 const { data: updatedPoint, error: updateError } = await supabase
  .from("grammar_points")
  .update({
   content: mergedContent,
   updated_at: new Date().toISOString(),
  })
  .eq("id", id)
  .select("*")
  .single();
 if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

 let insertedExercises: DbGrammarExercise[] = [];
 if (!(exercises || []).length && aiResult.data.exercises?.length) {
  const exerciseRows = aiResult.data.exercises
   .filter((exercise) => hasText(exercise.prompt))
   .map((exercise, index) => ({
    course_id: point.course_id,
    lesson_id: point.lesson_id,
    point_id: point.id,
    exercise_type: exercise.exercise_type || "fill_blank",
    prompt: exercise.prompt || "",
    content: exercise.content || {},
    answer: exercise.answer || {},
    explanation: exercise.explanation || null,
    exercise_order: index + 1,
   }));
  if (exerciseRows.length) {
   const { data, error } = await supabase.from("grammar_exercises").insert(exerciseRows).select("*");
   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   insertedExercises = (data || []) as DbGrammarExercise[];
  }
 }

 return NextResponse.json({
  point: updatedPoint,
  insertedExercises,
  preservedExisting: true,
 });
}
