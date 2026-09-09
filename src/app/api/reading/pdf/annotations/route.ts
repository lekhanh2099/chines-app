import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 getPdfAnnotation,
 savePdfAnnotation,
} from "@/features/reading/pdf/pdf-annotation-repository";
import { pdfAnnotationPayloadSchema } from "@/features/reading/pdf/pdf-annotations";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pageNumberQuerySchema = z
 .string()
 .regex(/^[1-9]\d*$/u)
 .transform((value) => Number(value));
const querySchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: pageNumberQuerySchema,
});
const payloadSchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: z.number().int().positive(),
 payload: pdfAnnotationPayloadSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const url = new URL(request.url);
 const parsed = querySchema.safeParse({
  assetId: url.searchParams.get("assetId"),
  pageNumber: url.searchParams.get("pageNumber"),
 });
 if (!parsed.success) return apiError("Invalid PDF annotation query", 400, "INVALID_QUERY");

 try {
  return privateNoStoreJson({ annotation: await getPdfAnnotation(parsed.data, auth.context) });
 } catch {
  return apiError("Could not load PDF annotation", 503, "PDF_ANNOTATION_UNAVAILABLE");
 }
}

export async function PUT(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = payloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid PDF annotation payload", 400, "INVALID_PAYLOAD");

 try {
  return privateNoStoreJson({ annotation: await savePdfAnnotation(parsed.data, auth.context) });
 } catch {
  return apiError("Could not save PDF annotation", 409, "PDF_ANNOTATION_CONFLICT");
 }
}
