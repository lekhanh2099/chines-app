import { z } from "zod";
import { dailyReadingStateRowSchema } from "./daily-reading-state.schemas";
import { readerFeatureStateSchema } from "@/features/reading/model/reading-progress.schemas";
const dailyStateResponseSchema = z.strictObject({ state: dailyReadingStateRowSchema.nullable() });

export async function fetchDailyReadingState(publishedDate: string, ownerUserId: string) {
 const response = await fetch(
  `/api/daily-reading/state?publishedDate=${encodeURIComponent(publishedDate)}`,
  { cache: "no-store", headers: { "X-HanziHome-Owner-Id": ownerUserId } },
 );
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không tải được tiến độ Daily Reading.");
 return dailyStateResponseSchema.parse(payload).state;
}

export async function saveDailyReadingState(
 input: {
  publishedDate: string;
  state: z.output<typeof readerFeatureStateSchema>;
  expectedRevision: number;
 },
 ownerUserId: string,
) {
 const response = await fetch("/api/daily-reading/state", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify(input),
 });
 const payload = await response.json().catch(() => null);
 if (response.status === 401) return null;
 if (!response.ok) throw new Error("Không lưu được tiến độ Daily Reading.");
 return dailyStateResponseSchema.parse(payload).state;
}
