import { NextResponse } from "next/server";
import { z } from "zod";

import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import type { UserLearningState } from "@/features/hanzihome/types";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearningStateRow = {
 settings: unknown;
 progress: unknown;
 bookmarks: unknown;
 review_history: unknown;
};

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingLearningStateTable(code: string | undefined) {
 return code === "42P01" || code === "PGRST205";
}

function rowToLearningState(row: LearningStateRow | null): UserLearningState {
 if (!row) return normalizeLearningState(emptyLearningState);

 const parsed = userLearningStateSchema.safeParse({
  settings: row.settings,
  progress: row.progress,
  bookmarks: row.bookmarks,
  reviewHistory: Array.isArray(row.review_history) ? row.review_history : [],
 });

 return normalizeLearningState(parsed.success ? parsed.data : emptyLearningState);
}

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const { data, error } = await supabase
  .from("user_learning_state")
  .select("settings, progress, bookmarks, review_history")
  .eq("user_id", user.id)
  .maybeSingle();

 if (error) {
  if (isMissingLearningStateTable(error.code)) {
   return NextResponse.json(
    { state: normalizeLearningState(emptyLearningState), source: "missing-table" },
    { headers: { "Cache-Control": "no-store" } },
   );
  }

  return jsonError("Could not load learning state", 500, error.code);
 }

 return NextResponse.json(
  { state: rowToLearningState(data) },
  { headers: { "Cache-Control": "no-store" } },
 );
}

export async function PUT(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json().catch(() => null);
 const parsed = userLearningStateSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid learning state payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400 },
  );
 }

 const state = normalizeLearningState(parsed.data);
 const { data, error } = await supabase
  .from("user_learning_state")
  .upsert(
   {
    user_id: user.id,
    settings: state.settings,
    progress: state.progress,
    bookmarks: state.bookmarks,
    review_history: state.reviewHistory,
    updated_at: new Date().toISOString(),
   },
   { onConflict: "user_id" },
  )
  .select("settings, progress, bookmarks, review_history")
  .maybeSingle();

 if (error) {
  if (isMissingLearningStateTable(error.code)) {
   return jsonError("Learning state table is not ready", 503, error.code);
  }

  return jsonError("Could not save learning state", 500, error.code);
 }

 return NextResponse.json({ state: rowToLearningState(data) });
}
