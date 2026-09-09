import { z } from "zod";

import { readerPronunciationOverrideRowSchema } from "@/features/reading/model/reading-pronunciation.schemas";

const listResponseSchema = z.strictObject({
 overrides: z.array(readerPronunciationOverrideRowSchema),
});
const saveResponseSchema = z.strictObject({
 override: readerPronunciationOverrideRowSchema,
});
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
const deletePayloadSchema = z.strictObject({
 id: z.uuid(),
 expectedRevision: z.number().int().nonnegative(),
});

export type ReaderPronunciationOverridePayload = z.output<typeof payloadSchema>;

export async function fetchReaderPronunciationOverrides(documentId: string) {
 const query = querySchema.parse({ documentId });
 const response = await fetch(
  `/api/reading/pronunciation-overrides?documentId=${encodeURIComponent(query.documentId)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return [];
 if (!response.ok) throw new Error("Không tải được pinyin override của Reader.");
 return listResponseSchema.parse(payload).overrides;
}

export async function saveReaderPronunciationOverride(input: ReaderPronunciationOverridePayload) {
 const payload = payloadSchema.parse(input);
 const response = await fetch("/api/reading/pronunciation-overrides", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không lưu được pinyin override của Reader.");
 return saveResponseSchema.parse(value).override;
}

export async function deleteReaderPronunciationOverride(input: {
 id: string;
 expectedRevision: number;
}) {
 const payload = deletePayloadSchema.parse(input);
 const response = await fetch("/api/reading/pronunciation-overrides", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 if (!response.ok) throw new Error("Không xoá được pinyin override của Reader.");
}
