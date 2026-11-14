import { z } from "zod";

import { readerAnnotationRowSchema } from "@/features/reading/model/reading-annotation.schemas";
import { readerPronunciationOverrideRowSchema } from "@/features/reading/model/reading-pronunciation.schemas";
import {
 readerAnswersSchema,
 readerProgressRowSchema,
} from "@/features/reading/model/reading-progress.schemas";

const expectedAuthenticatedOwnerHeader = "X-HanziHome-Owner-Id";
const progressResponseSchema = z.strictObject({
 progress: readerProgressRowSchema.nullable(),
});
const readerStateResponseSchema = z.strictObject({
 progress: readerProgressRowSchema.nullable(),
 annotations: z.array(readerAnnotationRowSchema),
 overrides: z.array(readerPronunciationOverrideRowSchema),
});

const progressPayloadSchema = z.strictObject({
 documentId: z.string().min(1),
 completed: z.boolean(),
 answers: readerAnswersSchema,
 expectedRevision: z.number().int().nonnegative(),
});

export type ReaderProgressPayload = z.output<typeof progressPayloadSchema>;
export type ReaderStateBootstrap = z.output<typeof readerStateResponseSchema>;

export class ReaderProgressConflictError extends Error {
 constructor() {
  super("Tiến độ Reader đã thay đổi ở nơi khác.");
  this.name = "ReaderProgressConflictError";
 }
}

type ReaderProgressSaveOptions = {
 signal?: AbortSignal;
};

function ownerHeaders(ownerUserId: string) {
 return { [expectedAuthenticatedOwnerHeader]: ownerUserId };
}

export async function fetchReaderState(
 documentId: string,
 ownerUserId: string,
): Promise<ReaderStateBootstrap | null> {
 const response = await fetch(`/api/reading/state?documentId=${encodeURIComponent(documentId)}`, {
  cache: "no-store",
  headers: ownerHeaders(ownerUserId),
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được trạng thái Reader.");
 return readerStateResponseSchema.parse(payload);
}

export async function saveReaderProgress(
 input: ReaderProgressPayload,
 ownerUserId: string,
 options?: ReaderProgressSaveOptions,
) {
 const payload = progressPayloadSchema.parse(input);
 const response = await fetch("/api/reading/progress", {
  method: "PUT",
  headers: { "Content-Type": "application/json", ...ownerHeaders(ownerUserId) },
  body: JSON.stringify(payload),
  signal: options?.signal,
 });
 const value = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (response.status === 409) throw new ReaderProgressConflictError();
 if (!response.ok) throw new Error("Không lưu được tiến độ Reader.");
 return progressResponseSchema.parse(value).progress;
}
