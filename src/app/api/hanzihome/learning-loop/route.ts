import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 appendLearningEvent,
 listLearningLoopItems,
 rateLearningLoopItem,
 saveLearningLoopItem,
} from "@/features/hanzihome/reader/reader-state-repository";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { learningLoopItemRowSchema } from "@/features/hanzihome/reader/reader-state.schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createSchema = z.strictObject({
 action: z.literal("save"),
 item: learningLoopItemRowSchema.omit({ user_id: true, created_at: true, updated_at: true }),
});
const rateSchema = z.strictObject({
 action: z.literal("rate"),
 itemId: z.string().min(1),
 rating: z.enum(["again", "hard", "good"]),
 expectedRevision: z.number().int().nonnegative(),
});
const eventSchema = z.strictObject({
 action: z.literal("event"),
 kind: z.enum(["encountered", "inspected", "review-added"]),
 sourceId: z.string().min(1),
 sourceHref: z.string().min(1),
 term: z.string().min(1).max(48),
 contextText: z.string().max(500),
});

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 try {
  return privateNoStoreJson({ items: await listLearningLoopItems() });
 } catch {
  return apiError("Could not load learning loop", 503, "LEARNING_LOOP_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = z
  .discriminatedUnion("action", [createSchema, rateSchema, eventSchema])
  .safeParse(body);
 if (!parsed.success) return apiError("Invalid learning loop payload", 400, "INVALID_PAYLOAD");

 try {
  if (parsed.data.action === "save") {
   return privateNoStoreJson({ item: await saveLearningLoopItem({ item: parsed.data.item }) });
  }
  if (parsed.data.action === "rate") {
   return privateNoStoreJson({
    item: await rateLearningLoopItem({
     itemId: parsed.data.itemId,
     rating: parsed.data.rating,
     expectedRevision: parsed.data.expectedRevision,
    }),
   });
  }
  return privateNoStoreJson({ event: await appendLearningEvent(parsed.data) });
 } catch {
  return apiError("Could not update learning loop", 409, "LEARNING_LOOP_CONFLICT");
 }
}
