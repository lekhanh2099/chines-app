import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const progressItemSchema = z.object({
 level: z.number(),
 status: z.enum(["new", "learning", "known", "hard"]),
 lastReviewedAt: z.string().optional(),
});

const learningStateSchema = z.object({
 settings: z
  .object({
   lastCourseId: z.string().optional(),
   lastLessonId: z.string().optional(),
   lastModule: z
    .enum(["overview", "lessonText", "vocab", "grammar", "radicals", "review"])
    .optional(),
   density: z.enum(["comfortable", "compact", "focus"]).optional(),
   vocabDetailTab: z.string().optional(),
  })
  .default({}),
 progress: z
  .object({
   vocab: z.record(progressItemSchema).optional(),
   grammar: z.record(progressItemSchema).optional(),
  })
  .default({}),
 bookmarks: z
  .object({
   lessons: z.array(z.string()).optional(),
   vocab: z.array(z.string()).optional(),
   grammar: z.array(z.string()).optional(),
   radicals: z.array(z.string()).optional(),
  })
  .default({}),
 reviewHistory: z
  .array(
   z.object({
    type: z.enum(["vocab", "grammar", "radical"]),
    id: z.string(),
    result: z.enum(["again", "hard", "known"]),
    answeredAt: z.string(),
   }),
  )
  .default([]),
});

function emptyPayload() {
 return {
  settings: {},
  progress: {},
  bookmarks: {},
  reviewHistory: [],
 };
}

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json(emptyPayload(), { status: 401 });
 }

 const { data, error } = await supabase
  .from("user_learning_state")
  .select("settings, progress, bookmarks, review_history")
  .eq("user_id", user.id)
  .maybeSingle();

 if (error) {
  return NextResponse.json(emptyPayload(), { status: 500 });
 }

 if (!data) {
  const { error: insertError } = await supabase
   .from("user_learning_state")
   .insert({ user_id: user.id });

  if (insertError) {
   return NextResponse.json(emptyPayload(), { status: 500 });
  }

  return NextResponse.json(emptyPayload());
 }

 return NextResponse.json({
  settings: data.settings,
  progress: data.progress,
  bookmarks: data.bookmarks,
  reviewHistory: data.review_history,
 });
}

export async function PUT(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = learningStateSchema.safeParse(await request.json());
 if (!parsed.success) {
  return NextResponse.json({ error: "Invalid learning state" }, { status: 400 });
 }

 const { settings, progress, bookmarks, reviewHistory } = parsed.data;
 const { data, error } = await supabase
  .from("user_learning_state")
  .upsert({
   user_id: user.id,
   settings,
   progress,
   bookmarks,
   review_history: reviewHistory,
   updated_at: new Date().toISOString(),
  })
  .select("settings, progress, bookmarks, review_history")
  .single();

 if (error) {
  return NextResponse.json({ error: "Could not save learning state" }, { status: 500 });
 }

 return NextResponse.json({
  settings: data.settings,
  progress: data.progress,
  bookmarks: data.bookmarks,
  reviewHistory: data.review_history,
 });
}
