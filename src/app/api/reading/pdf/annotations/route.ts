import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 getPdfAnnotation,
 savePdfAnnotation,
} from "@/features/reading/pdf/pdf-annotation-repository";
import { annotationPayloadSchema } from "@/features/reading/pdf/pdf-annotation-api";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
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

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

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
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = annotationPayloadSchema.safeParse(body);
 if (!parsed.success) return apiError("Invalid PDF annotation payload", 400, "INVALID_PAYLOAD");

 try {
  const result = await savePdfAnnotation(parsed.data, auth.context);
  return privateNoStoreJson(
   { annotation: result.annotation },
   { status: result.saved ? 200 : 409 },
  );
 } catch {
  return apiError("Could not save PDF annotation", 503, "PDF_ANNOTATION_UNAVAILABLE");
 }
}
