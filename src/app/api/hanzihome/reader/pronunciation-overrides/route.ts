import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 deleteReaderPronunciationOverride,
 listReaderPronunciationOverrides,
 saveReaderPronunciationOverride,
} from "@/features/hanzihome/reader/reader-pronunciation-override-repository.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ documentId: z.string().min(1) });
const payloadSchema = z.strictObject({
 id: z.uuid(),
 documentId: z.string().min(1),
 paragraphId: z.string().min(1),
 text: z.string().min(1),
 readings: z.array(z.string().regex(/^[a-zv]+[1-5]$/u)).min(1),
 scope: z.enum(["character-global", "phrase", "sentence-instance"]),
 sentenceText: z.string().nullable(),
 startOffset: z.number().int().nonnegative().nullable(),
 endOffset: z.number().int().positive().nullable(),
 expectedRevision: z.number().int().nonnegative(),
});
const deleteSchema = z.strictObject({
 id: z.uuid(),
 expectedRevision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const parsed = querySchema.safeParse({
  documentId: new URL(request.url).searchParams.get("documentId"),
 });
 if (!parsed.success) return apiError("Invalid pronunciation override query", 400, "INVALID_QUERY");
 try {
  return privateNoStoreJson({
   overrides: await listReaderPronunciationOverrides(parsed.data.documentId, auth.context),
  });
 } catch {
  return apiError(
   "Could not load pronunciation overrides",
   503,
   "PRONUNCIATION_OVERRIDE_UNAVAILABLE",
  );
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success)
  return apiError("Invalid pronunciation override payload", 400, "INVALID_PAYLOAD");
 try {
  return privateNoStoreJson({
   override: await saveReaderPronunciationOverride(
    {
     id: parsed.data.id,
     documentId: parsed.data.documentId,
     paragraphId: parsed.data.paragraphId,
     text: parsed.data.text,
     readings: parsed.data.readings,
     scope: parsed.data.scope,
     sentenceText: parsed.data.sentenceText,
     startOffset: parsed.data.startOffset,
     endOffset: parsed.data.endOffset,
     expectedRevision: parsed.data.expectedRevision,
    },
    auth.context,
   ),
  });
 } catch {
  return apiError("Could not save pronunciation override", 409, "PRONUNCIATION_OVERRIDE_CONFLICT");
 }
}

export async function DELETE(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = deleteSchema.safeParse(body);
 if (!parsed.success)
  return apiError("Invalid pronunciation override delete payload", 400, "INVALID_PAYLOAD");
 try {
  await deleteReaderPronunciationOverride(parsed.data, auth.context);
  return privateNoStoreJson({ deleted: true });
 } catch {
  return apiError(
   "Could not delete pronunciation override",
   409,
   "PRONUNCIATION_OVERRIDE_CONFLICT",
  );
 }
}
