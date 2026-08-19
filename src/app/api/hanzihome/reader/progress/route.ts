import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 getReaderProgress,
 saveReaderProgress,
} from "@/features/hanzihome/reader/reader-state-repository";
import { readerAnswersSchema } from "@/features/hanzihome/reader/reader.schemas";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ documentId: z.string().min(1) });
const payloadSchema = z.strictObject({
 documentId: z.string().min(1),
 showPinyin: z.boolean(),
 showMeaning: z.boolean(),
 completed: z.boolean(),
 summaryText: z.string(),
 answers: readerAnswersSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const parsed = querySchema.safeParse({
  documentId: new URL(request.url).searchParams.get("documentId"),
 });
 if (!parsed.success) return apiError("Invalid reader progress query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({
   progress: await getReaderProgress(parsed.data.documentId, auth.context),
  });
 } catch {
  return apiError("Could not load reader progress", 503, "READER_PROGRESS_UNAVAILABLE");
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid reader progress payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({
   progress: await saveReaderProgress(parsed.data, auth.context),
  });
 } catch {
  return apiError("Could not save reader progress", 409, "READER_PROGRESS_CONFLICT");
 }
}
