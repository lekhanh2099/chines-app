import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { learningLoopItemRowSchema, type LearningLoopItemRow } from "./reader-state.schemas";

const defaultDueQueueLimit = 50;
const maxDueQueueLimit = 100;

type DueQueueResult = {
 data: unknown;
 error: { message: string } | null;
};

type DueQueueRequest = {
 userId: string;
 dueBefore: string;
 limit: number;
};

type DueQueueExecutor = (request: DueQueueRequest) => PromiseLike<DueQueueResult>;

function createDueQueueRequest(
 userId: string,
 options?: { now?: Date; limit?: number },
): DueQueueRequest {
 const dueBefore = (options?.now ?? new Date()).toISOString();
 const requestedLimit = options?.limit ?? defaultDueQueueLimit;
 const limit = Math.min(Math.max(requestedLimit, 1), maxDueQueueLimit);
 return { userId, dueBefore, limit };
}

async function executeDueQueue(
 context: AuthenticatedRouteContext,
 request: DueQueueRequest,
): Promise<DueQueueResult> {
 return createServiceRoleSupabaseClient()
  .from("hanzihome_learning_loop_items")
  .select("*")
  .eq("user_id", request.userId)
  .lte("due_at", request.dueBefore)
  .order("due_at", { ascending: true })
  .limit(request.limit);
}

export async function listDueLearningLoopItemsWithExecutor(
 userId: string,
 execute: DueQueueExecutor,
 options?: { now?: Date; limit?: number },
): Promise<LearningLoopItemRow[]> {
 const request = createDueQueueRequest(userId, options);
 const { data, error } = await execute(request);
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.array().parse(data);
}

export async function listDueLearningLoopItems(
 context: AuthenticatedRouteContext,
 options?: { now?: Date; limit?: number },
): Promise<LearningLoopItemRow[]> {
 return listDueLearningLoopItemsWithExecutor(
  context.user.id,
  (request) => executeDueQueue(context, request),
  options,
 );
}

export async function saveLearningLoopItem(
 input: {
  item: Omit<LearningLoopItemRow, "user_id" | "created_at" | "updated_at">;
 },
 context: AuthenticatedRouteContext,
): Promise<LearningLoopItemRow> {
 const authority = createServiceRoleSupabaseClient();
 const { data: current, error: currentError } = await authority
  .from("hanzihome_learning_loop_items")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("id", input.item.id)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current !== null && current.state !== "new") {
  return learningLoopItemRowSchema.parse(current);
 }
 const { data, error } = await authority
  .from("hanzihome_learning_loop_items")
  .upsert({ user_id: context.user.id, ...input.item }, { onConflict: "user_id,id" })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.parse(data);
}

export async function rateLearningLoopItem(
 input: {
  itemId: string;
  rating: "again" | "hard" | "good";
  expectedRevision: number;
 },
 context: AuthenticatedRouteContext,
): Promise<LearningLoopItemRow> {
 const authority = createServiceRoleSupabaseClient();
 const { data: current, error: currentError } = await authority
  .from("hanzihome_learning_loop_items")
  .select("revision")
  .eq("user_id", context.user.id)
  .eq("id", input.itemId)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null || current.revision !== input.expectedRevision) {
  throw new Error("Learning loop item changed since it was loaded");
 }

 const { data, error } = await authority.rpc("hanzihome_rate_learning_loop_item_as_server", {
  p_user_id: context.user.id,
  p_item_id: input.itemId,
  p_rating: input.rating,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return learningLoopItemRowSchema.parse(data);
}
