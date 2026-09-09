import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 createReaderAnnotation,
 listReaderAnnotations,
} from "@/features/reading/repositories/reading-annotation.repository";
import { JsonObjectSchema } from "@/types/json";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({ documentId: z.string().min(1) });
const createSchema = z
 .strictObject({
  documentId: z.string().min(1),
  paragraphId: z.string().min(1).nullable(),
  assetId: z.string().min(1).nullable(),
  annotationType: z.enum(["highlight", "underline", "note", "ink"]),
  pageNumber: z.number().int().positive().nullable(),
  startOffset: z.number().int().nonnegative().nullable(),
  endOffset: z.number().int().positive().nullable(),
  selectedText: z.string(),
  noteText: z.string(),
  color: z.enum(["yellow", "green", "blue", "pink"]),
  payload: JsonObjectSchema,
 })
 .superRefine((value, context) => {
  if ((value.paragraphId === null) === (value.assetId === null)) {
   context.addIssue({
    code: "custom",
    path: ["paragraphId"],
    message: "Annotation target is required.",
   });
  }
 });

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const parsed = querySchema.safeParse({
  documentId: new URL(request.url).searchParams.get("documentId"),
 });
 if (!parsed.success) return apiError("Invalid annotation query", 400, "INVALID_QUERY");
 try {
  return privateNoStoreJson({
   annotations: await listReaderAnnotations(parsed.data.documentId, auth.context),
  });
 } catch {
  return apiError("Could not load Reader annotations", 503, "ANNOTATIONS_UNAVAILABLE");
 }
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = createSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid annotation payload", 400, "INVALID_PAYLOAD");
 try {
  return privateNoStoreJson({
   annotation: await createReaderAnnotation(parsed.data, auth.context),
  });
 } catch {
  return apiError("Could not save Reader annotation", 503, "ANNOTATION_SAVE_UNAVAILABLE");
 }
}
