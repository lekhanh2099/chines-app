import type { JsonFieldValue } from "@/types/json";

import {
 aiRuntimeWithTaskRuntimesResponseSchema,
 type AiRuntimeWithTaskRuntimesResponse,
} from "@/lib/ai-task-contract";

export const aiRuntimeQueryKey = ["ai-runtime", "readiness"];

export async function fetchAiRuntimeReadiness(): Promise<AiRuntimeWithTaskRuntimesResponse> {
 const response = await fetch("/api/ai/runtime", {
  method: "GET",
  credentials: "include",
  cache: "no-store",
 });
 const payload: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  const message =
   payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : "Không thể kiểm tra trạng thái AI runtime.";
  throw new Error(message);
 }

 const parsed = aiRuntimeWithTaskRuntimesResponseSchema.safeParse(payload);
 if (!parsed.success) throw new Error("Phản hồi AI runtime không đúng định dạng.");
 return parsed.data;
}
