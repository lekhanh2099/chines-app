import { z } from "zod";

import {
 readerAnswersSchema,
 readerAnnotationRowSchema,
 readerPronunciationOverrideRowSchema,
} from "./reader.schemas";
import {
 dailyReadingStateRowSchema,
 personalLearningStateRowSchema,
 readerFeatureStateSchema,
 readerProgressRowSchema,
} from "./reader-state.schemas";

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
 showPinyin: z.boolean(),
 showMeaning: z.boolean(),
 completed: z.boolean(),
 summaryText: z.string(),
 answers: readerAnswersSchema,
 expectedRevision: z.number().int().nonnegative(),
});
const personalStateResponseSchema = z.strictObject({
 state: personalLearningStateRowSchema.nullable(),
});
const dailyStateResponseSchema = z.strictObject({
 state: dailyReadingStateRowSchema.nullable(),
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

export async function fetchReaderState(documentId: string): Promise<ReaderStateBootstrap | null> {
 const response = await fetch(
  `/api/hanzihome/reader/state?documentId=${encodeURIComponent(documentId)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được trạng thái Reader.");
 return readerStateResponseSchema.parse(payload);
}

export async function saveReaderProgress(
 input: ReaderProgressPayload,
 options?: ReaderProgressSaveOptions,
) {
 const payload = progressPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/reader/progress", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  signal: options?.signal,
 });
 const value = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (response.status === 409) throw new ReaderProgressConflictError();
 if (!response.ok) throw new Error("Không lưu được tiến độ Reader.");
 return progressResponseSchema.parse(value).progress;
}

export async function fetchPersonalLearningState(nodeId: string) {
 const response = await fetch(
  `/api/hanzihome/reader/personal-state?nodeId=${encodeURIComponent(nodeId)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được tiến độ Personal Learning.");
 return personalStateResponseSchema.parse(payload).state;
}

export async function savePersonalLearningState(input: {
 nodeId: string;
 state: z.output<typeof readerFeatureStateSchema>;
 expectedRevision: number;
}) {
 const response = await fetch("/api/hanzihome/reader/personal-state", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không lưu được tiến độ Personal Learning.");
 return personalStateResponseSchema.parse(payload).state;
}

export async function fetchDailyReadingState(publishedDate: string) {
 const response = await fetch(
  `/api/hanzihome/reader/daily-state?publishedDate=${encodeURIComponent(publishedDate)}`,
  { cache: "no-store" },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được tiến độ Daily Reading.");
 return dailyStateResponseSchema.parse(payload).state;
}

export async function saveDailyReadingState(input: {
 publishedDate: string;
 state: z.output<typeof readerFeatureStateSchema>;
 expectedRevision: number;
}) {
 const response = await fetch("/api/hanzihome/reader/daily-state", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không lưu được tiến độ Daily Reading.");
 return dailyStateResponseSchema.parse(payload).state;
}
