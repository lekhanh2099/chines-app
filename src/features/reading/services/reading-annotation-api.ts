import { JsonObjectSchema } from "@/types/json";
import { z } from "zod";

import {
 readerAnnotationRowSchema,
 type ReaderAnnotationRow,
} from "@/features/reading/model/reading-annotation.schemas";

const annotationFieldsSchema = z
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
    message: "Exactly one Reader annotation target is required.",
   });
  }
  if ((value.startOffset === null) !== (value.endOffset === null)) {
   context.addIssue({
    code: "custom",
    path: ["startOffset"],
    message: "Annotation range must be complete.",
   });
  }
 });

const createAnnotationResponseSchema = z.strictObject({ annotation: readerAnnotationRowSchema });
const listAnnotationResponseSchema = z.strictObject({
 annotations: z.array(readerAnnotationRowSchema),
});

export type ReaderAnnotationInput = z.output<typeof annotationFieldsSchema>;

export async function fetchReaderAnnotations(documentId: string) {
 const response = await fetch(
  `/api/reading/annotations?documentId=${encodeURIComponent(documentId)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return [];
 if (!response.ok) throw new Error("Không tải được ghi chú Reader.");
 return listAnnotationResponseSchema.parse(payload).annotations;
}

export async function createReaderAnnotation(input: ReaderAnnotationInput) {
 const payload = annotationFieldsSchema.parse(input);
 const response = await fetch("/api/reading/annotations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không lưu được ghi chú Reader.");
 return createAnnotationResponseSchema.parse(value).annotation;
}

export async function deleteReaderAnnotation(annotationId: string, expectedRevision: number) {
 const response = await fetch(`/api/reading/annotations/${encodeURIComponent(annotationId)}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ expectedRevision }),
 });
 if (!response.ok) throw new Error("Không xoá được ghi chú Reader.");
}

export async function updateReaderAnnotation(annotation: ReaderAnnotationRow, noteText: string) {
 const response = await fetch(`/api/reading/annotations/${encodeURIComponent(annotation.id)}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
   paragraphId: annotation.paragraph_id,
   assetId: annotation.asset_id,
   color: annotation.color,
   pageNumber: annotation.page_number,
   startOffset: annotation.start_offset,
   endOffset: annotation.end_offset,
   selectedText: annotation.selected_text,
   noteText,
   payload: annotation.payload,
   expectedRevision: annotation.revision,
  }),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không cập nhật được ghi chú Reader.");
 return createAnnotationResponseSchema.parse(value).annotation;
}
