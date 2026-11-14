import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import { learningLoopItemRowSchema } from "@/features/hanzihome/learning-loop/learning-loop-state.schemas";

const itemsResponseSchema = z.strictObject({
 items: z.array(learningLoopItemRowSchema),
});
const itemResponseSchema = z.strictObject({
 item: learningLoopItemRowSchema,
});

export type LearningLoopItemRow = z.output<typeof learningLoopItemRowSchema>;

const saveItemPayloadSchema = z.strictObject({
 action: z.literal("save"),
 item: learningLoopItemRowSchema.omit({ user_id: true, created_at: true, updated_at: true }),
});

export async function fetchLearningLoopItems(): Promise<LearningLoopItemRow[]> {
 const response = await fetch("/api/hanzihome/learning-loop", { cache: "no-store" });
 const body: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được Learning Loop.");
 return itemsResponseSchema.parse(body).items;
}

export async function rateLearningLoopItem(input: {
 itemId: string;
 rating: "again" | "hard" | "good";
 expectedRevision: number;
}): Promise<LearningLoopItemRow> {
 let response: Response;
 try {
  response = await fetch("/api/hanzihome/learning-loop", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ action: "rate", ...input }),
  });
 } catch {
  throw new Error("Không cập nhật được Learning Loop.");
 }
 const body: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không cập nhật được Learning Loop.");
 return itemResponseSchema.parse(body).item;
}

export async function upsertLearningLoopItem(
 input: z.input<typeof saveItemPayloadSchema>["item"],
): Promise<LearningLoopItemRow> {
 const payload = saveItemPayloadSchema.parse({ action: "save", item: input });
 const response = await fetch("/api/hanzihome/learning-loop", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
 });
 const body: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không thêm được item vào Learning Loop.");
 return itemResponseSchema.parse(body).item;
}
