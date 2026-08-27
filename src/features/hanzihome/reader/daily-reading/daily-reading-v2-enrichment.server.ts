import "server-only";

import { z } from "zod";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import {
 dailyReadingV2GrammarDataSchema,
 dailyReadingV2QuestionsDataSchema,
 dailyReadingV2TranslationDataSchema,
 dailyReadingV2VocabularyDataSchema,
 type DailyReadingV2EnrichmentModule,
} from "./daily-reading-v2.schemas";
import type {
 DailyReadingV2EnrichmentArticle,
 DailyReadingV2EnrichmentResponse,
 DailyReadingV2GeneratedBy,
} from "./daily-reading-v2-enrichment.schemas";
import {
 requestDailyReadingV2EnrichmentProvider,
 type DailyReadingV2ProviderModule,
} from "./daily-reading-v2-enrichment-provider.server";

const translationChunkMaximumCharacters = 1_500;
const translationChunkMaximumParagraphs = 3;
const translationSegmentMaximumCharacters = 1_200;
const maximumPromptCharacters = 48_000;
const maximumRepairAttempts = 2;

const translationMetadataDraftSchema = z.strictObject({
 titleVi: z.string().trim().min(1).max(320),
 whyWorthReadingVi: z.string().max(2_000),
});

const translationDraftSchema = z.strictObject({
 paragraphs: z
  .array(
   z.strictObject({
    paragraphId: z.string().trim().min(1).max(80),
    vi: z.string().trim().min(1).max(5_000),
    roleVi: z.string().max(500),
   }),
  )
  .min(1)
  .max(24),
});

const vocabularyDraftSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    hanzi: z.string().trim().min(1).max(24),
    meaningVi: z.string().trim().min(1).max(320),
    meaningInContextVi: z.string().trim().min(1).max(480),
    categoryVi: z.string().trim().min(1).max(120),
   }),
  )
  .min(8)
  .max(18),
});

const grammarDraftSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    patternZh: z.string().trim().min(1).max(120),
    explanationVi: z.string().trim().min(1).max(1_000),
    evidenceSentenceZh: z.string().trim().min(1).max(600),
   }),
  )
  .min(3)
  .max(6),
});

const questionsDraftSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    type: z.enum(["main_idea", "detail", "inference", "vocabulary", "summary"]),
    promptZh: z.string().trim().min(1).max(600),
    promptVi: z.string().trim().min(1).max(800),
    answerZh: z.string().trim().min(1).max(1_200),
    answerVi: z.string().trim().min(1).max(1_600),
    evidenceParagraphIds: z.array(z.string().trim().min(1).max(80)).min(1).max(3),
   }),
  )
  .min(5)
  .max(8),
 sourcePhrasesZh: z.array(z.string().trim().min(1).max(40)).max(6),
 verificationSummaryVi: z.string().max(1_400),
});

type TranslationDraft = z.output<typeof translationDraftSchema>;
export type TranslationParagraph = TranslationDraft["paragraphs"][number];
export type TranslationUnit = {
 paragraphId: string;
 sourceParagraphId: string;
 zh: string;
};
type VocabularyDraft = z.output<typeof vocabularyDraftSchema>;
type GrammarDraft = z.output<typeof grammarDraftSchema>;
type QuestionsDraft = z.output<typeof questionsDraftSchema>;

type ProviderFailure = Extract<DailyReadingV2EnrichmentResponse, { ok: false }>;

export type StructuredResult<T> =
 | { ok: true; data: T }
 | {
    ok: false;
    errorCode: ProviderFailure["errorCode"];
    errorDetail: string;
   };

function parseJson(raw: string): unknown {
 const cleaned = raw
  .trim()
  .replace(/^```(?:json)?\s*/u, "")
  .replace(/\s*```$/u, "");
 return JSON.parse(cleaned);
}

function targetLevelLabel(reading: DailyReadingV2EnrichmentArticle) {
 return (
  reading.classification.targetLevel ?? reading.classification.estimatedLevel ?? "unspecified"
 );
}

function articleEvidence(reading: DailyReadingV2EnrichmentArticle) {
 return reading.article.paragraphs
  .map((paragraph) => `[${paragraph.id}] ${paragraph.zh}`)
  .join("\n");
}

function boundedPrompt(prompt: string) {
 const normalized = prompt.normalize("NFC").trim();
 if (normalized.length === 0 || normalized.length > maximumPromptCharacters) {
  throw new Error("Daily Reading enrichment prompt vượt giới hạn an toàn.");
 }
 return normalized;
}

function repairPrompt(prompt: string, diagnostic: string) {
 return `${prompt}\n\nSCHEMA/CONTENT REPAIR: the previous JSON was invalid. ${diagnostic.slice(0, 500)} Return the complete corrected JSON object only. Do not add markdown, pinyin, or commentary.`;
}

async function requestStructured<T, Validated>(input: {
 runtime: ResolvedUserAiRuntime;
 module: DailyReadingV2ProviderModule;
 prompt: string;
 schema: z.ZodType<T>;
 signal?: AbortSignal;
 validate(data: T): Validated;
 maximumAttempts?: number;
}): Promise<StructuredResult<Validated>> {
 let currentPrompt = boundedPrompt(input.prompt);
 const maximumAttempts = input.maximumAttempts ?? maximumRepairAttempts;
 for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
  const response = await requestDailyReadingV2EnrichmentProvider({
   runtime: input.runtime,
   prompt: currentPrompt,
   module: input.module,
   schema: input.schema,
   signal: input.signal,
  });
  if (!response.ok) {
   return {
    ok: false,
    errorCode: response.errorCode,
    errorDetail: response.errorDetail,
   };
  }

  try {
   const parsedJson = parseJson(response.content);
   const parsed = input.schema.safeParse(parsedJson);
   if (!parsed.success) {
    const diagnostic = parsed.error.issues
     .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
     .join("; ");
    throw new Error(`JSON không khớp schema ${input.module}: ${diagnostic.slice(0, 500)}`);
   }
   return { ok: true, data: input.validate(parsed.data) };
  } catch (error) {
   if (attempt === maximumAttempts - 1) {
    return {
     ok: false,
     errorCode: "invalid-response",
     errorDetail:
      error instanceof Error
       ? `AI trả dữ liệu ${input.module} không hợp lệ: ${error.message.slice(0, 320)}`
       : `AI trả dữ liệu ${input.module} không hợp lệ.`,
    };
   }
   const diagnostic = error instanceof Error ? error.message : "Validation failed.";
   currentPrompt = boundedPrompt(repairPrompt(input.prompt, diagnostic));
  }
 }

 return {
  ok: false,
  errorCode: "invalid-response",
  errorDetail: `AI không tạo được dữ liệu ${input.module} hợp lệ.`,
 };
}

function splitTextAtSentenceBoundaries(text: string, maximumCharacters: number) {
 const sentences = text.match(/[^。！？!?]+[。！？!?]?/gu)?.filter(Boolean) ?? [text];
 const segments: string[] = [];
 let current = "";
 for (const sentence of sentences) {
  if (sentence.length > maximumCharacters) {
   if (current) {
    segments.push(current);
    current = "";
   }
   for (let offset = 0; offset < sentence.length; offset += maximumCharacters) {
    segments.push(sentence.slice(offset, offset + maximumCharacters));
   }
   continue;
  }
  if (current && current.length + sentence.length > maximumCharacters) {
   segments.push(current);
   current = sentence;
  } else {
   current += sentence;
  }
 }
 if (current) segments.push(current);
 return segments;
}

function translationUnits(reading: DailyReadingV2EnrichmentArticle): TranslationUnit[] {
 return reading.article.paragraphs.flatMap((paragraph) => {
  if (paragraph.zh.length <= translationSegmentMaximumCharacters) {
   return [{ paragraphId: paragraph.id, sourceParagraphId: paragraph.id, zh: paragraph.zh }];
  }
  return splitTextAtSentenceBoundaries(paragraph.zh, translationSegmentMaximumCharacters).map(
   (segment, index) => ({
    paragraphId: `${paragraph.id}::segment-${index + 1}`,
    sourceParagraphId: paragraph.id,
    zh: segment,
   }),
  );
 });
}

function translationChunks(units: readonly TranslationUnit[]) {
 const groups: TranslationUnit[][] = [];
 let current: TranslationUnit[] = [];
 let currentCharacters = 0;

 for (const unit of units) {
  if (
   current.length > 0 &&
   (current.length >= translationChunkMaximumParagraphs ||
    currentCharacters + unit.zh.length > translationChunkMaximumCharacters)
  ) {
   groups.push(current);
   current = [];
   currentCharacters = 0;
  }
  current.push(unit);
  currentCharacters += unit.zh.length;
 }
 if (current.length > 0) groups.push(current);
 return groups;
}

export function createDailyReadingV2TranslationPlan(reading: DailyReadingV2EnrichmentArticle) {
 const units = translationUnits(reading);
 return {
  groups: translationChunks(units),
  progressTotal: units.length + 1,
 };
}

function validateTranslationChunk(
 expectedParagraphs: readonly TranslationUnit[],
 draft: TranslationDraft,
) {
 if (draft.paragraphs.length !== expectedParagraphs.length) {
  throw new Error("Bản dịch không giữ đủ số đoạn nguồn.");
 }
 for (let index = 0; index < expectedParagraphs.length; index += 1) {
  if (draft.paragraphs[index]?.paragraphId !== expectedParagraphs[index]?.paragraphId) {
   throw new Error("Bản dịch đổi hoặc làm lệch paragraphId nguồn.");
  }
 }
 return draft;
}

function translationPrompt(input: {
 reading: DailyReadingV2EnrichmentArticle;
 units: readonly TranslationUnit[];
 chunkLabel: string;
}) {
 return [
  `Translate the following ORIGINAL Chinese article paragraphs into natural Vietnamese for a ${targetLevelLabel(input.reading)} learner.`,
  "Do not simplify, rewrite, summarize, merge, split, or omit Chinese source content.",
  "Do not generate pinyin.",
  "Return JSON with paragraphs[{paragraphId,vi,roleVi}] only.",
  "paragraphId values and order must exactly match the supplied chunk.",
  `Article title: ${input.reading.article.titleZh}`,
  `Publisher: ${input.reading.source.publisher}`,
  `Chunk: ${input.chunkLabel}`,
  "SOURCE PARAGRAPHS:",
  ...input.units.map((unit) => `[${unit.paragraphId}] ${unit.zh}`),
 ].join("\n");
}

async function translateUnitsAdaptively(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 units: readonly TranslationUnit[];
 chunkLabel: string;
 signal?: AbortSignal;
}): Promise<StructuredResult<TranslationParagraph[]>> {
 const result = await requestStructured({
  runtime: input.runtime,
  module: "translation",
  prompt: translationPrompt(input),
  schema: translationDraftSchema.extend({
   paragraphs: translationDraftSchema.shape.paragraphs.length(input.units.length),
  }),
  signal: input.signal,
  validate: (draft) => validateTranslationChunk(input.units, draft).paragraphs,
 });
 if (result.ok || result.errorCode !== "invalid-response") return result;

 if (input.units.length > 1) {
  const midpoint = Math.ceil(input.units.length / 2);
  const left = await translateUnitsAdaptively({
   ...input,
   units: input.units.slice(0, midpoint),
   chunkLabel: `${input.chunkLabel}.1`,
  });
  if (!left.ok) return left;
  const right = await translateUnitsAdaptively({
   ...input,
   units: input.units.slice(midpoint),
   chunkLabel: `${input.chunkLabel}.2`,
  });
  return right.ok ? { ok: true, data: [...left.data, ...right.data] } : right;
 }

 const unit = input.units[0];
 if (!unit) return result;
 const segments = splitTextAtSentenceBoundaries(
  unit.zh,
  Math.max(300, Math.floor(unit.zh.length / 2)),
 );
 if (segments.length < 2) return result;
 const segmentUnits = segments.map((segment, index) => ({
  paragraphId: `${unit.paragraphId}::repair-${index + 1}`,
  sourceParagraphId: unit.sourceParagraphId,
  zh: segment,
 }));
 const repaired = await translateUnitsAdaptively({
  ...input,
  units: segmentUnits,
  chunkLabel: `${input.chunkLabel}.repair`,
 });
 if (!repaired.ok) return repaired;
 return {
  ok: true,
  data: [
   {
    paragraphId: unit.paragraphId,
    vi: repaired.data.map((paragraph) => paragraph.vi).join(" "),
    roleVi: repaired.data.map((paragraph) => paragraph.roleVi).find(Boolean) ?? "",
   },
  ],
 };
}

export function generateDailyReadingV2TranslationMetadata(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 signal?: AbortSignal;
}) {
 return requestStructured({
  runtime: input.runtime,
  module: "translation",
  prompt: [
   `Translate this Chinese article title into natural Vietnamese for a ${targetLevelLabel(input.reading)} learner and explain briefly why it is worth reading.`,
   "Return JSON with titleVi and whyWorthReadingVi only.",
   `Article title: ${input.reading.article.titleZh}`,
   `Publisher: ${input.reading.source.publisher}`,
  ].join("\n"),
  schema: translationMetadataDraftSchema,
  signal: input.signal,
  validate: (draft) => draft,
 });
}

export function generateDailyReadingV2TranslationGroup(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 units: readonly TranslationUnit[];
 chunkLabel: string;
 signal?: AbortSignal;
}) {
 return translateUnitsAdaptively(input);
}

export function buildDailyReadingV2TranslationResponse(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 metadata: z.output<typeof translationMetadataDraftSchema>;
 translatedParagraphs: TranslationParagraph[];
}): DailyReadingV2EnrichmentResponse {
 const units = translationUnits(input.reading);
 const rebuiltParagraphs = input.reading.article.paragraphs.map((sourceParagraph) => {
  const matchingUnits = units.filter((unit) => unit.sourceParagraphId === sourceParagraph.id);
  const matchingTranslations = matchingUnits.map((unit) => {
   const translated = input.translatedParagraphs.find(
    (paragraph) => paragraph.paragraphId === unit.paragraphId,
   );
   if (!translated) throw new Error(`Bản dịch thiếu segment của ${sourceParagraph.id}.`);
   return translated;
  });
  return {
   paragraphId: sourceParagraph.id,
   vi: matchingTranslations.map((paragraph) => paragraph.vi).join(" "),
   roleVi: matchingTranslations.map((paragraph) => paragraph.roleVi).find(Boolean) ?? "",
  };
 });
 validateTranslationChunk(
  input.reading.article.paragraphs.map((paragraph) => ({
   paragraphId: paragraph.id,
   sourceParagraphId: paragraph.id,
   zh: paragraph.zh,
  })),
  { paragraphs: rebuiltParagraphs },
 );

 const data = dailyReadingV2TranslationDataSchema.parse({
  titleVi: input.metadata.titleVi,
  whyWorthReadingVi: input.metadata.whyWorthReadingVi,
  adaptationNoticeVi:
   "Bản dịch hỗ trợ học tập được tạo từ nguyên văn đã lưu; phần tiếng Trung nguồn không bị AI chỉnh sửa.",
  paragraphs: rebuiltParagraphs,
 });
 return {
  ok: true,
  module: "translation",
  data,
  generatedBy: generatedBy(input.runtime),
 };
}

async function generateTranslation(
 reading: DailyReadingV2EnrichmentArticle,
 runtime: ResolvedUserAiRuntime,
 signal?: AbortSignal,
 onProgress?: (completed: number, total: number) => Promise<void>,
): Promise<DailyReadingV2EnrichmentResponse> {
 const translatedParagraphs: TranslationDraft["paragraphs"] = [];
 const plan = createDailyReadingV2TranslationPlan(reading);
 const metadata = await generateDailyReadingV2TranslationMetadata({ reading, runtime, signal });
 if (!metadata.ok) {
  return {
   ok: false,
   status: "failed",
   module: "translation",
   errorCode: metadata.errorCode,
   errorDetail: metadata.errorDetail,
  };
 }
 await onProgress?.(1, plan.progressTotal);
 let completedUnits = 0;

 for (let index = 0; index < plan.groups.length; index += 1) {
  const group = plan.groups[index] ?? [];
  const result = await generateDailyReadingV2TranslationGroup({
   reading,
   runtime,
   units: group,
   chunkLabel: `${index + 1}/${plan.groups.length}`,
   signal,
  });
  if (!result.ok) {
   return {
    ok: false,
    status: "failed",
    module: "translation",
    errorCode: result.errorCode,
    errorDetail: result.errorDetail,
   };
  }
  translatedParagraphs.push(...result.data);
  completedUnits += group.length;
  await onProgress?.(completedUnits + 1, plan.progressTotal);
 }
 return buildDailyReadingV2TranslationResponse({
  reading,
  runtime,
  metadata: metadata.data,
  translatedParagraphs,
 });
}

function validateVocabulary(
 reading: DailyReadingV2EnrichmentArticle,
 draft: VocabularyDraft,
 targetCount: number,
) {
 if (draft.items.length !== targetCount) {
  throw new Error(`Số từ vựng phải đúng ${targetCount}.`);
 }
 const fullText = reading.article.paragraphs.map((paragraph) => paragraph.zh).join("\n");
 const seen = new Set<string>();
 for (const item of draft.items) {
  if (!fullText.includes(item.hanzi)) {
   throw new Error(`Từ vựng không xuất hiện nguyên văn trong bài: ${item.hanzi}`);
  }
  if (seen.has(item.hanzi)) throw new Error(`Từ vựng bị lặp: ${item.hanzi}`);
  seen.add(item.hanzi);
 }
 return dailyReadingV2VocabularyDataSchema.parse({
  items: draft.items.map((item, index) => ({
   id: `vocab-${index + 1}`,
   order: index + 1,
   ...item,
  })),
 });
}

function normalizeSentence(value: string) {
 return value.replace(/\s+/gu, "").replace(/[“”‘’"'，。！？、；：,.!?;:（）()《》]/gu, "");
}

function articleSentences(reading: DailyReadingV2EnrichmentArticle) {
 return reading.article.paragraphs.flatMap(
  (paragraph) => paragraph.zh.match(/[^。！？!?]+[。！？!?]/gu) ?? [paragraph.zh],
 );
}

function validateGrammar(
 reading: DailyReadingV2EnrichmentArticle,
 draft: GrammarDraft,
 targetCount: number,
) {
 if (draft.items.length !== targetCount) {
  throw new Error(`Số điểm ngữ pháp phải đúng ${targetCount}.`);
 }
 const sentences = articleSentences(reading).map(normalizeSentence);
 for (const item of draft.items) {
  if (!sentences.includes(normalizeSentence(item.evidenceSentenceZh))) {
   throw new Error(`Ví dụ ngữ pháp không khớp câu nguồn: ${item.patternZh}`);
  }
 }
 return dailyReadingV2GrammarDataSchema.parse({
  items: draft.items.map((item, index) => ({ id: `grammar-${index + 1}`, ...item })),
 });
}

function validateQuestions(
 reading: DailyReadingV2EnrichmentArticle,
 draft: QuestionsDraft,
 targetCount: number,
) {
 if (draft.items.length !== targetCount) {
  throw new Error(`Số câu hỏi phải đúng ${targetCount}.`);
 }
 const paragraphIds = new Set(reading.article.paragraphs.map((paragraph) => paragraph.id));
 const fullText = reading.article.paragraphs.map((paragraph) => paragraph.zh).join("\n");
 for (const item of draft.items) {
  if (item.evidenceParagraphIds.some((id) => !paragraphIds.has(id))) {
   throw new Error("Câu hỏi trỏ tới paragraphId không tồn tại trong bài nguồn.");
  }
 }
 const types = new Set(draft.items.map((item) => item.type));
 if (!types.has("main_idea") || !types.has("inference") || !types.has("summary")) {
  throw new Error("Bộ câu hỏi thiếu main idea, inference hoặc summary.");
 }
 if (draft.items.filter((item) => item.type === "detail").length < 2) {
  throw new Error("Bộ câu hỏi cần ít nhất hai câu detail.");
 }
 for (const phrase of draft.sourcePhrasesZh) {
  if (!fullText.includes(phrase)) {
   throw new Error(`Cụm nguồn không xuất hiện nguyên văn trong bài: ${phrase}`);
  }
 }
 return dailyReadingV2QuestionsDataSchema.parse({
  items: draft.items.map((item, index) => ({ id: `question-${index + 1}`, ...item })),
  sourcePhrasesZh: draft.sourcePhrasesZh,
  verificationSummaryVi: draft.verificationSummaryVi,
 });
}

function learningPrompt(
 reading: DailyReadingV2EnrichmentArticle,
 module: Exclude<DailyReadingV2EnrichmentModule, "translation">,
 targetCount: number,
) {
 const common = [
  `Target learner level: ${targetLevelLabel(reading)}.`,
  "Use only the ORIGINAL Chinese article below as evidence.",
  "Do not rewrite the Chinese article and do not generate pinyin.",
  `Article title: ${reading.article.titleZh}`,
  `Publisher: ${reading.source.publisher}`,
  "LOCKED ARTICLE EVIDENCE:",
  articleEvidence(reading),
 ];
 if (module === "vocabulary") {
  return [
   `Select exactly ${targetCount} useful words/phrases that occur verbatim in the article.`,
   "Return JSON: items[{hanzi,meaningVi,meaningInContextVi,categoryVi}].",
   "Explain the meaning in this exact article context; do not invent words not present in the text.",
   ...common,
  ].join("\n");
 }
 if (module === "grammar") {
  return [
   `Select exactly ${targetCount} useful grammar patterns genuinely evidenced by complete sentences in the article.`,
   "Return JSON: items[{patternZh,explanationVi,evidenceSentenceZh}].",
   "evidenceSentenceZh must be one complete sentence copied exactly from the article.",
   ...common,
  ].join("\n");
 }
 return [
  `Create exactly ${targetCount} reading-comprehension questions grounded only in the article.`,
  "Return JSON: items[{type,promptZh,promptVi,answerZh,answerVi,evidenceParagraphIds}], sourcePhrasesZh, verificationSummaryVi.",
  "Include main_idea, at least two detail questions, inference, and summary.",
  "Every evidenceParagraphIds value must be one of the supplied paragraph IDs. sourcePhrasesZh must be short exact phrases from the article.",
  ...common,
 ].join("\n");
}

async function generateLearningModule(
 reading: DailyReadingV2EnrichmentArticle,
 runtime: ResolvedUserAiRuntime,
 module: Exclude<DailyReadingV2EnrichmentModule, "translation">,
 targetCount: number,
 signal?: AbortSignal,
): Promise<DailyReadingV2EnrichmentResponse> {
 if (module === "vocabulary") {
  const result = await requestStructured({
   runtime,
   module,
   prompt: learningPrompt(reading, module, targetCount),
   schema: vocabularyDraftSchema.extend({
    items: vocabularyDraftSchema.shape.items.length(targetCount),
   }),
   signal,
   validate: (draft) => validateVocabulary(reading, draft, targetCount),
  });
  return result.ok
   ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
   : { ...result, ok: false, status: "failed", module };
 }
 if (module === "grammar") {
  const result = await requestStructured({
   runtime,
   module,
   prompt: learningPrompt(reading, module, targetCount),
   schema: grammarDraftSchema.extend({
    items: grammarDraftSchema.shape.items.length(targetCount),
   }),
   signal,
   validate: (draft) => validateGrammar(reading, draft, targetCount),
  });
  return result.ok
   ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
   : { ...result, ok: false, status: "failed", module };
 }
 const result = await requestStructured({
  runtime,
  module,
  prompt: learningPrompt(reading, module, targetCount),
  schema: questionsDraftSchema.extend({
   items: questionsDraftSchema.shape.items.length(targetCount),
  }),
  signal,
  validate: (draft) => validateQuestions(reading, draft, targetCount),
 });
 return result.ok
  ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
  : { ...result, ok: false, status: "failed", module };
}

function generatedBy(runtime: ResolvedUserAiRuntime): DailyReadingV2GeneratedBy {
 return {
  provider: runtime.providerLabel,
  model: runtime.model,
  ...(runtime.taskId && runtime.resolutionSource
   ? {
      receipt: {
       taskId: runtime.taskId,
       provider: runtime.provider,
       model: runtime.model,
       keyId: runtime.keyId,
       keyLabel: runtime.label,
       resolutionSource: runtime.resolutionSource,
      },
     }
   : {}),
 };
}

export function generateDailyReadingV2Enrichment(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 module: DailyReadingV2EnrichmentModule;
 targetCount?: number | null;
 signal?: AbortSignal;
 onProgress?: (completed: number, total: number) => Promise<void>;
}) {
 if (input.module === "translation") {
  return generateTranslation(input.reading, input.runtime, input.signal, input.onProgress);
 }
 const targetCount =
  input.targetCount ?? (input.module === "vocabulary" ? 12 : input.module === "grammar" ? 4 : 6);
 return generateLearningModule(
  input.reading,
  input.runtime,
  input.module,
  targetCount,
  input.signal,
 );
}
