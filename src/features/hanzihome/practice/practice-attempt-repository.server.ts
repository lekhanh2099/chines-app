import "server-only";

import type { JsonObject } from "@/types/json";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import {
 practiceAttemptRowSchema,
 type PracticeAttemptRow,
 type PracticeAttemptSurface,
} from "@/features/hanzihome/practice/practice-attempt.schemas";

export async function savePracticeAttempt(
 input: {
  attemptId?: string;
  surface: PracticeAttemptSurface;
  contentId: string;
  direction: string | null;
  answer: JsonObject;
  scorePercent: number | null;
  responseMs: number | null;
 },
 userId: string,
): Promise<PracticeAttemptRow> {
 const authority = createServiceRoleSupabaseClient();
 const { data, error } = await authority
  .from("hanzihome_practice_attempts")
  .insert({
   ...(input.attemptId ? { id: input.attemptId } : {}),
   user_id: userId,
   surface: input.surface,
   content_id: input.contentId,
   direction: input.direction,
   answer: input.answer,
   score: input.scorePercent === null ? null : input.scorePercent / 100,
   response_ms: input.responseMs,
  })
  .select("*")
  .single();

 if (error) {
  if (error.code === "23505" && input.attemptId) {
   const { data: existing, error: existingError } = await authority
    .from("hanzihome_practice_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", input.attemptId)
    .maybeSingle();
   if (existingError) throw new Error(existingError.message);
   if (existing !== null) return practiceAttemptRowSchema.parse(existing);
  }
  throw new Error(error.message);
 }

 return practiceAttemptRowSchema.parse(data);
}

export async function listPracticeAttempts(
 input: {
  surface: PracticeAttemptSurface;
  contentId: string;
 },
 userId: string,
): Promise<PracticeAttemptRow[]> {
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_practice_attempts")
  .select("*")
  .eq("user_id", userId)
  .eq("surface", input.surface)
  .eq("content_id", input.contentId)
  .order("created_at", { ascending: false });
 if (error) throw new Error(error.message);
 return practiceAttemptRowSchema.array().parse(data);
}

export async function listRecentPracticeAttempts(
 userId: string,
 input: { surface: PracticeAttemptSurface; limit: number },
): Promise<PracticeAttemptRow[]> {
 const limit = Math.max(1, Math.min(input.limit, 100));
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_practice_attempts")
  .select("*")
  .eq("user_id", userId)
  .eq("surface", input.surface)
  .order("created_at", { ascending: false })
  .limit(limit);

 if (error) throw new Error(error.message);
 return practiceAttemptRowSchema.array().parse(data);
}

export async function countPracticeAttempts(
 userId: string,
 input: {
  surface: PracticeAttemptSurface;
  since: string;
  until: string;
 },
): Promise<number> {
 const { count, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_practice_attempts")
  .select("id", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("surface", input.surface)
  .gte("created_at", input.since)
  .lte("created_at", input.until);

 if (error) throw new Error(error.message);
 return count ?? 0;
}
