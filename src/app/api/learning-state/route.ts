import type { JsonFieldValue } from "@/types/json";
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
 settings: JsonFieldValue;
 progress: JsonFieldValue;
 bookmarks: JsonFieldValue;
 review_history: JsonFieldValue;
 updated_at: string | null;
};

const updatePayloadSchema = z.strictObject({
 state: userLearningStateSchema,
 expectedUpdatedAt: z.string().nullable(),
});

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json({ error: message, code }, { status });
}

function isMissingLearningStateTable(code: Parameters<typeof jsonError>[2]) {
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

function learningStateResponse(row: LearningStateRow | null) {
 return {
  state: rowToLearningState(row),
  updatedAt: row?.updated_at ?? null,
 };
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
  .select("settings, progress, bookmarks, review_history, updated_at")
  .eq("user_id", user.id)
  .maybeSingle();

 if (error) {
  if (isMissingLearningStateTable(error.code)) {
   return NextResponse.json(
    { ...learningStateResponse(null), source: "missing-table" },
    { headers: { "Cache-Control": "no-store" } },
   );
  }

  return jsonError("Could not load learning state", 500, error.code);
 }

 return NextResponse.json(learningStateResponse(data), {
  headers: { "Cache-Control": "no-store" },
 });
}

export async function PUT(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updatePayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid learning state payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400 },
  );
 }

 const state = normalizeLearningState(parsed.data.state);
 const { data: current, error: currentError } = await supabase
  .from("user_learning_state")
  .select("settings, progress, bookmarks, review_history, updated_at")
  .eq("user_id", user.id)
  .maybeSingle();

 if (currentError) {
  if (isMissingLearningStateTable(currentError.code)) {
   return jsonError("Learning state table is not ready", 503, currentError.code);
  }
  return jsonError("Could not inspect learning state", 500, currentError.code);
 }

 if ((current?.updated_at ?? null) !== parsed.data.expectedUpdatedAt) {
  return NextResponse.json(
   {
    error: "Learning state changed since it was loaded",
    code: "LEARNING_STATE_CONFLICT",
    ...learningStateResponse(current),
   },
   { status: 409 },
  );
 }

 const updatedAt = new Date().toISOString();
 const write = {
  user_id: user.id,
  settings: state.settings,
  progress: state.progress,
  bookmarks: state.bookmarks,
  review_history: state.reviewHistory,
  updated_at: updatedAt,
 };
 const writeResult =
  current === null
   ? await supabase
      .from("user_learning_state")
      .insert(write)
      .select("settings, progress, bookmarks, review_history, updated_at")
      .maybeSingle()
   : parsed.data.expectedUpdatedAt === null
     ? await supabase
        .from("user_learning_state")
        .update(write)
        .eq("user_id", user.id)
        .is("updated_at", null)
        .select("settings, progress, bookmarks, review_history, updated_at")
        .maybeSingle()
     : await supabase
        .from("user_learning_state")
        .update(write)
        .eq("user_id", user.id)
        .eq("updated_at", parsed.data.expectedUpdatedAt)
        .select("settings, progress, bookmarks, review_history, updated_at")
        .maybeSingle();
 const { data, error } = writeResult;

 if (error) {
  if (isMissingLearningStateTable(error.code)) {
   return jsonError("Learning state table is not ready", 503, error.code);
  }

  if (error.code !== "23505") {
   return jsonError("Could not save learning state", 500, error.code);
  }
 }

 if (data === null) {
  const { data: latest } = await supabase
   .from("user_learning_state")
   .select("settings, progress, bookmarks, review_history, updated_at")
   .eq("user_id", user.id)
   .maybeSingle();
  return NextResponse.json(
   {
    error: "Learning state changed since it was loaded",
    code: "LEARNING_STATE_CONFLICT",
    ...learningStateResponse(latest),
   },
   { status: 409 },
  );
 }

 return NextResponse.json(learningStateResponse(data));
}
