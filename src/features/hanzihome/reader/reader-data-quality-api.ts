import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

const reportSchema = z.strictObject({
 documents: z.number().int().nonnegative(),
 paragraphs: z.number().int().nonnegative(),
 vocabularyLinks: z.number().int().nonnegative(),
 exerciseGroups: z.number().int().nonnegative(),
 exerciseItems: z.number().int().nonnegative(),
 assets: z.number().int().nonnegative(),
 orphanParagraphs: z.number().int().nonnegative(),
 orphanVocabularyLinks: z.number().int().nonnegative(),
 orphanExerciseGroups: z.number().int().nonnegative(),
 orphanExerciseItems: z.number().int().nonnegative(),
 orphanAssets: z.number().int().nonnegative(),
 publishedKinds: z.array(
  z.strictObject({ kind: z.string().min(1), count: z.number().int().nonnegative() }),
 ),
 issues: z.array(z.string()),
});

export type ReaderDataQualityReport = z.output<typeof reportSchema>;

export async function fetchReaderDataQualityReport(): Promise<ReaderDataQualityReport> {
 const response = await fetch("/api/hanzihome/reader/data-quality", { cache: "no-store" });
 const body: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không tải được data-quality report.");
 return reportSchema.parse(body);
}
