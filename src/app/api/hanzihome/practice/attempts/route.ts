import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 countPracticeAttempts,
 listPracticeAttempts,
 listRecentPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/practice/practice-attempt-repository.server";
import { JsonObjectSchema } from "@/types/json";
import { practiceAttemptSurfaceSchema } from "@/features/hanzihome/practice/practice-attempt.schemas";
import {
 apiError,
 expectedAuthenticatedOwnerHeader,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({
 mode: z.enum(["list", "count"]).default("list"),
 surface: practiceAttemptSurfaceSchema,
 contentId: z.string().min(1).optional(),
 limit: z.coerce.number().int().min(1).max(100).default(50),
 since: z.iso.datetime({ offset: true }).optional(),
 until: z.iso.datetime({ offset: true }).optional(),
});
const payloadSchema = z.strictObject({
 attemptId: z.uuid().optional(),
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
 const searchParams = new URL(request.url).searchParams;
 const parsed = querySchema.safeParse({
  mode: searchParams.get("mode") || undefined,
  surface: searchParams.get("surface"),
  contentId: searchParams.get("contentId") || undefined,
  limit: searchParams.get("limit") || undefined,
  since: searchParams.get("since") || undefined,
  until: searchParams.get("until") || undefined,
 });
 if (!parsed.success) return apiError("Invalid practice history query", 400, "INVALID_QUERY");

 if (parsed.data.mode === "count") {
  if (parsed.data.contentId || !parsed.data.since || !parsed.data.until) {
   return apiError("Invalid practice count query", 400, "INVALID_QUERY");
  }
  try {
   return privateNoStoreJson({
    count: await countPracticeAttempts(auth.context.user.id, {
     surface: parsed.data.surface,
     since: parsed.data.since,
     until: parsed.data.until,
    }),
   });
  } catch {
   return apiError("Could not count practice history", 503, "PRACTICE_HISTORY_UNAVAILABLE");
  }
 }

 if (parsed.data.since || parsed.data.until) {
  return apiError("Invalid practice history query", 400, "INVALID_QUERY");
 }

 try {
  return privateNoStoreJson({
   attempts: parsed.data.contentId
    ? await listPracticeAttempts(
       { surface: parsed.data.surface, contentId: parsed.data.contentId },
       auth.context.user.id,
      )
    : await listRecentPracticeAttempts(auth.context.user.id, {
       surface: parsed.data.surface,
       limit: parsed.data.limit,
      }),
  });
 } catch {
  return apiError("Could not load practice history", 503, "PRACTICE_HISTORY_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 if (request.headers.has(expectedAuthenticatedOwnerHeader)) {
  const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
  if (ownerError) return ownerError;
 }

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid practice attempt payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({
   attempt: await savePracticeAttempt(parsed.data, auth.context.user.id),
  });
 } catch {
  return apiError("Could not save practice attempt", 503, "PRACTICE_ATTEMPT_UNAVAILABLE");
 }
}
