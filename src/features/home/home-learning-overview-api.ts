import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

const homeLearningOverviewSchema = z.strictObject({
 srsDueCount: z.number().int().nonnegative(),
 learningLoopDueCount: z.number().int().nonnegative(),
 readerCompletedCount: z.number().int().nonnegative(),
 readerDocumentCount: z.number().int().nonnegative(),
});
const homeLearningOverviewResponseSchema = z.strictObject({
 overview: homeLearningOverviewSchema,
});

export type HomeLearningOverview = z.output<typeof homeLearningOverviewSchema>;

export async function fetchHomeLearningOverview(): Promise<HomeLearningOverview> {
 const response = await fetch("/api/home/learning-overview", { cache: "no-store" });
 const payload: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được tổng quan học tập.");
 return homeLearningOverviewResponseSchema.parse(payload).overview;
}
