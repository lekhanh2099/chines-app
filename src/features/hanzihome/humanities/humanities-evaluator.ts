import { z } from "zod";

import type { ReaderHumanitiesEvaluation } from "@/features/hanzihome/reader/reader.schemas";

const evaluationUnitResultSchema = z.strictObject({
 unitId: z.string().min(1),
 status: z.enum(["covered", "missing", "unresolved"]),
 matchedRealization: z.string().nullable(),
 messageVi: z.string().min(1),
});

export const humanitiesEvaluationResultSchema = z.strictObject({
 score: z.number().int().min(0).max(100),
 evidenceCoverage: z.number().int().min(0).max(100),
 coveredRequiredUnits: z.number().int().min(0),
 totalRequiredUnits: z.number().int().min(0),
 missingRequiredUnitIds: z.array(z.string()),
 unresolvedDimensionIds: z.array(z.string()),
 unitResults: z.array(evaluationUnitResultSchema),
 dimensionScores: z.array(
  z.strictObject({
   dimensionId: z.string().min(1),
   score: z.number().int().min(0).max(100).nullable(),
   weight: z.number().positive(),
  }),
 ),
});

export type HumanitiesEvaluationResult = z.output<typeof humanitiesEvaluationResultSchema>;

const combiningMarks = /[\u0300-\u036f]/gu;
const punctuation = /[\p{P}\p{S}\s]/gu;

function normalizeEvaluationText(value: string): string {
 return value
  .normalize("NFD")
  .replace(combiningMarks, "")
  .toLocaleLowerCase("vi")
  .replace(punctuation, "");
}

function categoryForUnit(type: string): "meaning" | "complete" | "logic" | "terms" {
 if (
  ["causal-relation", "contrast-relation", "condition-relation", "negation", "modality"].includes(
   type,
  )
 )
  return "logic";
 if (["term", "quantity", "time", "place"].includes(type)) return "terms";
 if (["actor", "action", "object", "proposition"].includes(type)) return "meaning";
 return "complete";
}

function matchedRealization(
 answer: string,
 acceptedRealizations: readonly string[],
): string | null {
 const normalizedAnswer = normalizeEvaluationText(answer);
 return (
  acceptedRealizations.find((realization) => {
   const normalizedRealization = normalizeEvaluationText(realization);
   return normalizedRealization.length > 0 && normalizedAnswer.includes(normalizedRealization);
  }) ?? null
 );
}

export function evaluateHumanitiesAnswer(
 answer: string,
 evaluation: ReaderHumanitiesEvaluation,
): HumanitiesEvaluationResult {
 const unitResults = evaluation.informationUnits.map((unit) => {
  const matched = matchedRealization(answer, unit.acceptedRealizations);
  return evaluationUnitResultSchema.parse({
   unitId: unit.id,
   status: matched !== null ? "covered" : unit.required ? "missing" : "unresolved",
   matchedRealization: matched,
   messageVi:
    matched !== null
     ? `Đã nhận diện ý: ${unit.canonicalMeaningVi}.`
     : unit.required
       ? `Chưa tìm thấy ý bắt buộc: ${unit.canonicalMeaningVi}.`
       : `Chưa đủ bằng chứng cho ý: ${unit.canonicalMeaningVi}.`,
  });
 });
 const requiredUnits = evaluation.informationUnits.filter((unit) => unit.required);
 const requiredWeight = requiredUnits.reduce((sum, unit) => sum + unit.weight, 0);
 const coveredRequiredUnits = requiredUnits.filter(
  (unit) => matchedRealization(answer, unit.acceptedRealizations) !== null,
 );
 const coveredWeight = coveredRequiredUnits.reduce((sum, unit) => sum + unit.weight, 0);
 const categories = new Map<string, { earned: number; possible: number }>();
 for (const unit of requiredUnits) {
  const category = categoryForUnit(unit.type);
  const current = categories.get(category) ?? { earned: 0, possible: 0 };
  current.possible += unit.weight;
  if (matchedRealization(answer, unit.acceptedRealizations) !== null) current.earned += unit.weight;
  categories.set(category, current);
 }
 const dimensionScores = evaluation.rubric.map((dimension) => {
  if (!dimension.deterministic)
   return { dimensionId: dimension.id, score: null, weight: dimension.weight };
  const category = categories.get(dimension.id === "units" ? "meaning" : dimension.id);
  return {
   dimensionId: dimension.id,
   score:
    category === undefined || category.possible === 0
     ? null
     : Math.round((category.earned / category.possible) * 100),
   weight: dimension.weight,
  };
 });
 const scoredDimensions = dimensionScores.filter((dimension) => dimension.score !== null);
 const scoredWeight = scoredDimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
 const weightedScore = scoredDimensions.reduce(
  (sum, dimension) => sum + (dimension.score ?? 0) * dimension.weight,
  0,
 );
 return humanitiesEvaluationResultSchema.parse({
  score: scoredWeight === 0 ? 0 : Math.round(weightedScore / scoredWeight),
  evidenceCoverage: requiredWeight === 0 ? 0 : Math.round((coveredWeight / requiredWeight) * 100),
  coveredRequiredUnits: coveredRequiredUnits.length,
  totalRequiredUnits: requiredUnits.length,
  missingRequiredUnitIds: unitResults
   .filter((result) => result.status === "missing")
   .map((result) => result.unitId),
  unresolvedDimensionIds: dimensionScores
   .filter((dimension) => dimension.score === null)
   .map((dimension) => dimension.dimensionId),
  unitResults,
  dimensionScores,
 });
}
