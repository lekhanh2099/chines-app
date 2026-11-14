import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 getPersonalLearningState,
 savePersonalLearningState,
} from "@/features/personal-learning/personal-learning-state-repository.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";
import { JsonObjectSchema } from "@/types/json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ nodeId: z.string().min(1) });
const payloadSchema = z.strictObject({
 nodeId: z.string().min(1),
 state: JsonObjectSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const parsed = querySchema.safeParse({
  nodeId: new URL(request.url).searchParams.get("nodeId"),
 });
 if (!parsed.success) return apiError("Invalid personal learning query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({
   state: await getPersonalLearningState(parsed.data.nodeId, auth.context),
  });
 } catch {
  return apiError("Could not load personal learning state", 503, "PERSONAL_STATE_UNAVAILABLE");
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid personal learning payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({ state: await savePersonalLearningState(parsed.data, auth.context) });
 } catch {
  return apiError("Could not save personal learning state", 409, "PERSONAL_STATE_CONFLICT");
 }
}
