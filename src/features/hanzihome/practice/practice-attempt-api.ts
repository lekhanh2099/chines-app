import { JsonObjectSchema } from "@/types/json";
import { z } from "zod";

import {
 practiceAttemptRowSchema,
 practiceAttemptSurfaceSchema,
} from "@/features/hanzihome/reader/reader-state.schemas";

const practiceAttemptPayloadSchema = z.strictObject({
 surface: practiceAttemptSurfaceSchema,
 contentId: z.string().min(1),
 direction: z.string().min(1).nullable(),
 answer: JsonObjectSchema,
 scorePercent: z.number().int().min(0).max(100).nullable(),
 responseMs: z.number().int().nonnegative().nullable(),
});
const practiceAttemptResponseSchema = z.strictObject({ attempt: practiceAttemptRowSchema });
const practiceAttemptsResponseSchema = z.strictObject({
 attempts: z.array(practiceAttemptRowSchema),
});

export type PracticeAttemptPayload = z.output<typeof practiceAttemptPayloadSchema>;

export async function savePracticeAttempt(input: PracticeAttemptPayload) {
 const payload = practiceAttemptPayloadSchema.parse(input);
 const response = await fetch("/api/hanzihome/practice/attempts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const value = await response.json().catch(() => null);
 if (!response.ok) {
  throw new Error(
   value && typeof value === "object" && "error" in value && typeof value.error === "string"
    ? value.error
    : "Không lưu được lịch sử luyện tập.",
  );
 }
 return practiceAttemptResponseSchema.parse(value).attempt;
}

export async function fetchPracticeAttempts(input: {
 surface: z.output<typeof practiceAttemptSurfaceSchema>;
 contentId: string;
}) {
 const response = await fetch(
  `/api/hanzihome/practice/attempts?surface=${encodeURIComponent(input.surface)}&contentId=${encodeURIComponent(input.contentId)}`,
  { cache: "no-store" },
 );
 const value = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được lịch sử luyện tập.");
 return practiceAttemptsResponseSchema.parse(value).attempts;
}
