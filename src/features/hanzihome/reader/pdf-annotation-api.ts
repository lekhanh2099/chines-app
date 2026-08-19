import { z } from "zod";

import { pdfAnnotationPayloadSchema, pdfAnnotationRowSchema } from "./pdf-annotations";

const annotationResponseSchema = z.strictObject({
 annotation: pdfAnnotationRowSchema.nullable(),
});

const annotationQuerySchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: z.number().int().positive(),
});

const annotationPayloadSchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: z.number().int().positive(),
 payload: pdfAnnotationPayloadSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export type PdfAnnotationQuery = z.output<typeof annotationQuerySchema>;
export type PdfAnnotationPayloadInput = z.output<typeof annotationPayloadSchema>;

export async function fetchPdfAnnotation(input: PdfAnnotationQuery) {
 const query = annotationQuerySchema.parse(input);
 const response = await fetch(
  `/api/hanzihome/reader/pdf-annotations?assetId=${encodeURIComponent(query.assetId)}&pageNumber=${query.pageNumber}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được ghi chú PDF.");
 return annotationResponseSchema.parse(payload).annotation;
}

export async function savePdfAnnotation(input: PdfAnnotationPayloadInput) {
 const payload = annotationPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/reader/pdf-annotations", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không lưu được ghi chú PDF.");
 return annotationResponseSchema.parse(value).annotation;
}
