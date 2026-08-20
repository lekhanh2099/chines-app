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

const learningStateOwnerHeader = "X-HanziHome-Owner-Id";

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

class InvalidStoredLearningStateError extends Error {
 constructor() {
  super("Stored learning state does not match the current schema");
  this.name = "InvalidStoredLearningStateError";
 }
}

function jsonError(message: string, status: number, code?: string) {
 return NextResponse.json(
  { error: message, code },
  { status, headers: { "Cache-Control": "no-store" } },
 );
}

function isMissingLearningStateTable(code: Parameters<typeof jsonError>[2]) {
 return code === "42P01" || code === "PGRST205";
}

function verifyExpectedOwner(request: Request, authenticatedUserId: string) {
 const expectedOwner = request.headers.get(learningStateOwnerHeader);
 return expectedOwner === authenticatedUserId
  ? null
  : jsonError(
     "Learning-state owner no longer matches the authenticated session",
     412,
     "AUTH_OWNER_MISMATCH",
    );
}

function rowToLearningState(row: LearningStateRow | null): UserLearningState {
 if (!row) return normalizeLearningState(emptyLearningState);

 const parsed = userLearningStateSchema.safeParse({
  settings: row.settings,
  progress: row.progress,
  bookmarks: row.bookmarks,
  reviewHistory: row.review_history,
 });

 if (!parsed.success) throw new InvalidStoredLearningStateError();
 return normalizeLearningState(parsed.data);
}

function learningStateResponse(row: LearningStateRow | null) {
 return {
  state: rowToLearningState(row),
  updatedAt: row?.updated_at ?? null,
 };
}

function invalidStoredLearningStateResponse() {
 return jsonError(
  "Stored learning state is incompatible with the current application schema",
  500,
  "LEARNING_STATE_INVALID",
 );
}

export async function GET(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const ownerError = verifyExpectedOwner(request, user.id);
 if (ownerError) return ownerError;

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

 try {
  return NextResponse.json(learningStateResponse(data), {
   headers: { "Cache-Control": "no-store" },
  });
 } catch (error) {
  if (error instanceof InvalidStoredLearningStateError) {
   return invalidStoredLearningStateResponse();
  }
  throw error;
 }
}

export async function PUT(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const ownerError = verifyExpectedOwner(request, user.id);
 if (ownerError) return ownerError;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = updatePayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid learning state payload",
    issues: z.flattenError(parsed.error),
   },
   { status: 400, headers: { "Cache-Control": "no-store" } },
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

 try {
  rowToLearningState(current);
 } catch (error) {
  if (error instanceof InvalidStoredLearningStateError) {
   return invalidStoredLearningStateResponse();
  }
  throw error;
 }

 if ((current?.updated_at ?? null) !== parsed.data.expectedUpdatedAt) {
  return NextResponse.json(
   {
    error: "Learning state changed since it was loaded",
    code: "LEARNING_STATE_CONFLICT",
    ...learningStateResponse(current),
   },
   { status: 409, headers: { "Cache-Control": "no-store" } },
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
  const { data: latest, error: latestError } = await supabase
   .from("user_learning_state")
   .select("settings, progress, bookmarks, review_history, updated_at")
   .eq("user_id", user.id)
   .maybeSingle();

  if (latestError) {
   return jsonError("Could not reload learning state after a conflict", 500, latestError.code);
  }

  try {
   return NextResponse.json(
    {
     error: "Learning state changed since it was loaded",
     code: "LEARNING_STATE_CONFLICT",
     ...learningStateResponse(latest),
    },
    { status: 409, headers: { "Cache-Control": "no-store" } },
   );
  } catch (latestParseError) {
   if (latestParseError instanceof InvalidStoredLearningStateError) {
    return invalidStoredLearningStateResponse();
   }
   throw latestParseError;
  }
 }

 try {
  return NextResponse.json(learningStateResponse(data), {
   headers: { "Cache-Control": "no-store" },
  });
 } catch (responseError) {
  if (responseError instanceof InvalidStoredLearningStateError) {
   return invalidStoredLearningStateResponse();
  }
  throw responseError;
 }
}
