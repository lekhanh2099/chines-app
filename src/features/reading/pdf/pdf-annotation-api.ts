import { z } from "zod";

import {
 pdfAnnotationPayloadSchema,
 pdfAnnotationRowSchema,
 equalPdfAnnotationPayloads,
} from "@/features/reading/pdf/pdf-annotations";

export const annotationResponseSchema = z.strictObject({
 annotation: pdfAnnotationRowSchema.nullable(),
});
export const annotationSaveResultSchema = annotationResponseSchema.extend({ saved: z.boolean() });

const annotationQuerySchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: z.number().int().positive(),
});

export const annotationPayloadSchema = z.strictObject({
 assetId: z.string().min(1),
 pageNumber: z.number().int().positive(),
 payload: pdfAnnotationPayloadSchema,
 expectedRevision: z.number().int().nonnegative(),
 expectedAbsent: z.boolean(),
});

export type PdfAnnotationQuery = z.output<typeof annotationQuerySchema>;
export type PdfAnnotationPayloadInput = z.output<typeof annotationPayloadSchema>;

export class PdfAnnotationApiError extends Error {
 constructor(
  message: string,
  readonly status: number,
 ) {
  super(message);
 }
}

export class PdfAnnotationConflictError extends PdfAnnotationApiError {
 constructor(readonly annotation: z.output<typeof annotationResponseSchema>["annotation"]) {
  super("Ghi chú PDF đã thay đổi trên thiết bị khác. Bản trên thiết bị này vẫn được giữ.", 409);
 }
}

export async function fetchPdfAnnotation(input: PdfAnnotationQuery, ownerUserId: string) {
 const query = annotationQuerySchema.parse(input);
 const response = await fetch(
  `/api/reading/pdf/annotations?assetId=${encodeURIComponent(query.assetId)}&pageNumber=${query.pageNumber}`,
  { cache: "no-store", headers: { "X-HanziHome-Owner-Id": ownerUserId } },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new PdfAnnotationApiError("Không tải được ghi chú PDF.", response.status);
 const annotation = annotationResponseSchema.parse(payload).annotation;
 if (
  annotation &&
  (annotation.user_id !== ownerUserId ||
   annotation.asset_id !== query.assetId ||
   annotation.page_number !== query.pageNumber)
 ) {
  throw new Error("Ghi chú PDF không thuộc tài khoản hoặc trang đang mở.");
 }
 return annotation;
}

export async function savePdfAnnotation(input: PdfAnnotationPayloadInput, ownerUserId: string) {
 const payload = annotationPayloadSchema.parse(input);
 const response = await fetch("/api/reading/pdf/annotations", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (response.status === 409) {
  const conflict = annotationResponseSchema.parse(value).annotation;
  if (
   conflict &&
   (conflict.user_id !== ownerUserId ||
    conflict.asset_id !== payload.assetId ||
    conflict.page_number !== payload.pageNumber)
  ) {
   throw new Error("Ghi chú PDF không thuộc tài khoản hoặc trang đang mở.");
  }
  throw new PdfAnnotationConflictError(conflict);
 }
 if (!response.ok) throw new PdfAnnotationApiError("Không lưu được ghi chú PDF.", response.status);
 const annotation = annotationResponseSchema.parse(value).annotation;
 if (!annotation) throw new Error("Server chưa xác nhận ghi chú PDF.");
 if (
  annotation.user_id !== ownerUserId ||
  annotation.asset_id !== payload.assetId ||
  annotation.page_number !== payload.pageNumber ||
  annotation.revision !== (payload.expectedAbsent ? 0 : payload.expectedRevision + 1) ||
  !equalPdfAnnotationPayloads(annotation.payload, payload.payload)
 ) {
  throw new Error("Server trả về ghi chú PDF không khớp thao tác lưu.");
 }
 return annotation;
}
