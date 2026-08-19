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

const translationChunkMaximumCharacters = 6_000;
const translationChunkMaximumParagraphs = 20;
const maximumPromptCharacters = 48_000;
const maximumRepairAttempts = 2;

const translationDraftSchema = z.strictObject({
 titleVi: z.string().trim().min(1).max(320),
 whyWorthReadingVi: z.string().max(2_000),
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
type VocabularyDraft = z.output<typeof vocabularyDraftSchema>;
type GrammarDraft = z.output<typeof grammarDraftSchema>;
type QuestionsDraft = z.output<typeof questionsDraftSchema>;

type ProviderFailure = Extract<DailyReadingV2EnrichmentResponse, { ok: false }>;

type StructuredResult<T> =
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
 return reading.classification.targetLevel ?? reading.classification.estimatedLevel ?? "unspecified";
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

async function requestStructured<T>(input: {
 runtime: ResolvedUserAiRuntime;
 module: DailyReadingV2ProviderModule;
 prompt: string;
 schema: z.ZodType<T>;
 signal?: AbortSignal;
 validate(data: T): T;
}): Promise<StructuredResult<T>> {
 let currentPrompt = boundedPrompt(input.prompt);
 for (let attempt = 0; attempt < maximumRepairAttempts; attempt += 1) {
  const response = await requestDailyReadingV2EnrichmentProvider({
   runtime: input.runtime,
   prompt: currentPrompt,
   module: input.module,
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
    throw new Error(`JSON không khớp schema ${input.module}.`);
   }
   return { ok: true, data: input.validate(parsed.data) };
  } catch (error) {
   if (attempt === maximumRepairAttempts - 1) {
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

function translationChunks(reading: DailyReadingV2EnrichmentArticle) {
 const groups: DailyReadingV2EnrichmentArticle["article"]["paragraphs"][number][][] = [];
 let current: DailyReadingV2EnrichmentArticle["article"]["paragraphs"][number][] = [];
 let currentCharacters = 0;

 for (const paragraph of reading.article.paragraphs) {
  if (
   current.length > 0 &&
   (current.length >= translationChunkMaximumParagraphs ||
    currentCharacters + paragraph.zh.length > translationChunkMaximumCharacters)
  ) {
   groups.push(current);
   current = [];
   currentCharacters = 0;
  }
  current.push(paragraph);
  currentCharacters += paragraph.zh.length;
 }
 if (current.length > 0) groups.push(current);
 return groups;
}

function validateTranslationChunk(
 expectedParagraphs: DailyReadingV2EnrichmentArticle["article"]["paragraphs"],
 draft: TranslationDraft,
) {
 if (draft.paragraphs.length !== expectedParagraphs.length) {
  throw new Error("Bản dịch không giữ đủ số đoạn nguồn.");
 }
 for (let index = 0; index < expectedParagraphs.length; index += 1) {
  if (draft.paragraphs[index]?.paragraphId !== expectedParagraphs[index]?.id) {
   throw new Error("Bản dịch đổi hoặc làm lệch paragraphId nguồn.");
  }
 }
 return draft;
}

async function generateTranslation(
 reading: DailyReadingV2EnrichmentArticle,
 runtime: ResolvedUserAiRuntime,
 signal?: AbortSignal,
): Promise<DailyReadingV2EnrichmentResponse> {
 const translatedParagraphs: TranslationDraft["paragraphs"] = [];
 let titleVi = "";
 let whyWorthReadingVi = "";
 const groups = translationChunks(reading);

 for (let index = 0; index < groups.length; index += 1) {
  const group = groups[index] ?? [];
  const prompt = [
   `Translate the following ORIGINAL Chinese article paragraphs into natural Vietnamese for a ${targetLevelLabel(reading)} learner.`,
   "Do not simplify, rewrite, summarize, merge, split, or omit Chinese source content.",
   "Do not generate pinyin.",
   "Return JSON with titleVi, whyWorthReadingVi, paragraphs[{paragraphId,vi,roleVi}].",
   "paragraphId values and order must exactly match the supplied chunk.",
   `Article title: ${reading.article.titleZh}`,
   `Publisher: ${reading.source.publisher}`,
   `Chunk: ${index + 1}/${groups.length}`,
   "SOURCE PARAGRAPHS:",
   ...group.map((paragraph) => `[${paragraph.id}] ${paragraph.zh}`),
  ].join("\n");
  const result = await requestStructured({
   runtime,
   module: "translation",
   prompt,
   schema: translationDraftSchema,
   signal,
   validate: (draft) => validateTranslationChunk(group, draft),
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
  if (!titleVi) titleVi = result.data.titleVi;
  if (!whyWorthReadingVi) whyWorthReadingVi = result.data.whyWorthReadingVi;
  translatedParagraphs.push(...result.data.paragraphs);
 }

 const data = dailyReadingV2TranslationDataSchema.parse({
  titleVi,
  whyWorthReadingVi,
  adaptationNoticeVi:
   "Bản dịch hỗ trợ học tập được tạo từ nguyên văn đã lưu; phần tiếng Trung nguồn không bị AI chỉnh sửa.",
  paragraphs: translatedParagraphs,
 });
 return {
  ok: true,
  module: "translation",
  data,
  generatedBy: generatedBy(runtime),
 };
}

function validateVocabulary(reading: DailyReadingV2EnrichmentArticle, draft: VocabularyDraft) {
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

function validateGrammar(reading: DailyReadingV2EnrichmentArticle, draft: GrammarDraft) {
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

function validateQuestions(reading: DailyReadingV2EnrichmentArticle, draft: QuestionsDraft) {
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
   "Select 10-14 useful words/phrases that occur verbatim in the article.",
   "Return JSON: items[{hanzi,meaningVi,meaningInContextVi,categoryVi}].",
   "Explain the meaning in this exact article context; do not invent words not present in the text.",
   ...common,
  ].join("\n");
 }
 if (module === "grammar") {
  return [
   "Select 3-5 useful grammar patterns genuinely evidenced by complete sentences in the article.",
   "Return JSON: items[{patternZh,explanationVi,evidenceSentenceZh}].",
   "evidenceSentenceZh must be one complete sentence copied exactly from the article.",
   ...common,
  ].join("\n");
 }
 return [
  "Create 5-6 reading-comprehension questions grounded only in the article.",
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
 signal?: AbortSignal,
): Promise<DailyReadingV2EnrichmentResponse> {
 if (module === "vocabulary") {
  const result = await requestStructured({
   runtime,
   module,
   prompt: learningPrompt(reading, module),
   schema: vocabularyDraftSchema,
   signal,
   validate: (draft) => validateVocabulary(reading, draft),
  });
  return result.ok
   ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
   : { ok: false, status: "failed", module, ...result };
 }
 if (module === "grammar") {
  const result = await requestStructured({
   runtime,
   module,
   prompt: learningPrompt(reading, module),
   schema: grammarDraftSchema,
   signal,
   validate: (draft) => validateGrammar(reading, draft),
  });
  return result.ok
   ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
   : { ok: false, status: "failed", module, ...result };
 }
 const result = await requestStructured({
  runtime,
  module,
  prompt: learningPrompt(reading, module),
  schema: questionsDraftSchema,
  signal,
  validate: (draft) => validateQuestions(reading, draft),
 });
 return result.ok
  ? { ok: true, module, data: result.data, generatedBy: generatedBy(runtime) }
  : { ok: false, status: "failed", module, ...result };
}

function generatedBy(runtime: ResolvedUserAiRuntime): DailyReadingV2GeneratedBy {
 return { provider: runtime.providerLabel, model: runtime.model };
}

export function generateDailyReadingV2Enrichment(input: {
 reading: DailyReadingV2EnrichmentArticle;
 runtime: ResolvedUserAiRuntime;
 module: DailyReadingV2EnrichmentModule;
 signal?: AbortSignal;
}) {
 if (input.module === "translation") {
  return generateTranslation(input.reading, input.runtime, input.signal);
 }
 return generateLearningModule(input.reading, input.runtime, input.module, input.signal);
}
