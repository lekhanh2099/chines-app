import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 getDailyReadingState,
 saveDailyReadingState,
} from "@/features/hanzihome/reader/daily-reading-state-repository.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";
import { JsonObjectSchema } from "@/types/json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ publishedDate: z.iso.date() });
const payloadSchema = z.strictObject({
 publishedDate: z.iso.date(),
 state: JsonObjectSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const parsed = querySchema.safeParse({
  publishedDate: new URL(request.url).searchParams.get("publishedDate"),
 });
 if (!parsed.success) return apiError("Invalid daily reading query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({
   state: await getDailyReadingState(parsed.data.publishedDate, auth.context),
  });
 } catch {
  return apiError("Could not load daily reading state", 503, "DAILY_STATE_UNAVAILABLE");
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid daily reading payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({ state: await saveDailyReadingState(parsed.data, auth.context) });
 } catch {
  return apiError("Could not save daily reading state", 409, "DAILY_STATE_CONFLICT");
 }
}
