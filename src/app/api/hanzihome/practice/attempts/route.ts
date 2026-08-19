import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 listPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/reader/reader-state-repository";
import { JsonObjectSchema } from "@/types/json";
import { practiceAttemptSurfaceSchema } from "@/features/hanzihome/reader/reader-state.schemas";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({
 surface: practiceAttemptSurfaceSchema,
 contentId: z.string().min(1),
});
const payloadSchema = z.strictObject({
 surface: practiceAttemptSurfaceSchema,
 contentId: z.string().min(1),
 direction: z.string().min(1).nullable(),
 answer: JsonObjectSchema,
 scorePercent: z.number().int().min(0).max(100).nullable(),
 responseMs: z.number().int().nonnegative().nullable(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const parsed = querySchema.safeParse({
  surface: new URL(request.url).searchParams.get("surface"),
  contentId: new URL(request.url).searchParams.get("contentId"),
 });
 if (!parsed.success) return apiError("Invalid practice history query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({
   attempts: await listPracticeAttempts(parsed.data),
  });
 } catch {
  return apiError("Could not load practice history", 503, "PRACTICE_HISTORY_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid practice attempt payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({
   attempt: await savePracticeAttempt(parsed.data),
  });
 } catch {
  return apiError("Could not save practice attempt", 503, "PRACTICE_ATTEMPT_UNAVAILABLE");
 }
}
