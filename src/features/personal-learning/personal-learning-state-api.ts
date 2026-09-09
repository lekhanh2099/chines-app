import { z } from "zod";
import { personalLearningStateRowSchema } from "./personal-learning-state.schemas";
import { readerFeatureStateSchema } from "@/features/reading/model/reading-progress.schemas";
const personalStateResponseSchema = z.strictObject({
 state: personalLearningStateRowSchema.nullable(),
});

export async function fetchPersonalLearningState(nodeId: string, ownerUserId: string) {
 const response = await fetch(`/api/personal-learning/state?nodeId=${encodeURIComponent(nodeId)}`, {
  cache: "no-store",
  headers: { "X-HanziHome-Owner-Id": ownerUserId },
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được tiến độ Personal Learning.");
 return personalStateResponseSchema.parse(payload).state;
}

export async function savePersonalLearningState(
 input: {
  nodeId: string;
  state: z.output<typeof readerFeatureStateSchema>;
  expectedRevision: number;
 },
 ownerUserId: string,
) {
 const response = await fetch("/api/personal-learning/state", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify(input),
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không lưu được tiến độ Personal Learning.");
 return personalStateResponseSchema.parse(payload).state;
}
