import "server-only";

import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";

import { DEFAULT_GEMINI_QUICK_MODEL } from "@/lib/gemini-models";
import { throwIfAborted } from "@/lib/request-utils";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

import {
 requestDailyReadingProvider,
 type DailyReadingProviderPhase,
} from "./daily-reading-provider.server";
import {
 dailyReadingCoreDraftSchema,
 dailyReadingLearningDraftSchema,
 dailyReadingSchema,
 type DailyReading,
 type DailyReadingCoreDraft,
 type DailyReadingGenerationCheckpoint,
 type DailyReadingGenerationKind,
 type DailyReadingGenerationStage,
 type DailyReadingLevel,
 type DailyReadingLearningDraft,
 type DailyReadingSourceCandidate,
} from "./daily-reading.schemas";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";

const dailyReadingPromptMaximumCharacters = 20_000;

function parseStructured<T>(raw: string, schema: z.ZodType<T>): T | null {
 try {
  const cleaned = raw
   .trim()
   .replace(/^```(?:json)?\s*/u, "")
   .replace(/\s*```$/u, "");
  const parsed = schema.safeParse(JSON.parse(cleaned));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

function createSchemaRepairPrompt(prompt: string, phase: DailyReadingProviderPhase) {
 const contract =
  phase === "core"
   ? "Return exactly one core object with titleZh, titleVi, whyWorthReadingVi, topic, level, estimatedMinutes, and paragraphs[{zh,vi,roleVi}]. Use complete paragraphs and include every required field."
   : "Return exactly one learning object with vocabulary[{hanzi,meaningVi,meaningInContextVi,categoryVi}], grammarPoints[{patternZh,explanationVi,evidenceSentenceZh}], questions[{type,promptZh,promptVi,answerZh,answerVi,evidenceParagraphNumbers}], sourcePhrasesZh, and verificationSummaryVi. Use 8-18 vocabulary items, 3-6 grammar points, and 5-8 questions.";
 return `${prompt}\n\nSCHEMA REPAIR: the previous JSON did not satisfy the required shape. ${contract} Include every required field, use no markdown, and do not add commentary.`;
}

async function requestStructured<T>({
 prompt,
 schema,
 phase,
 credentials,
 signal,
 onProgress,
}: {
 prompt: string;
 schema: z.ZodType<T>;
 phase: DailyReadingProviderPhase;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}): Promise<{ data: T; provider: string; model: string }> {
 const boundedPrompt = prompt.normalize("NFC").trim();
 if (boundedPrompt.length === 0 || boundedPrompt.length > dailyReadingPromptMaximumCharacters) {
  throw new Error("Daily Reading prompt vượt giới hạn an toàn.");
 }
 if (credentials.length === 0) {
  throw new Error("Daily Reading học tập cần API key cá nhân đang hoạt động.");
 }

 const providerErrors: string[] = [];
 for (const credential of credentials) {
  throwIfAborted(signal);
  const schemaRepairPrompt = createSchemaRepairPrompt(boundedPrompt, phase);
  const attempts =
   schemaRepairPrompt.length <= dailyReadingPromptMaximumCharacters
    ? [boundedPrompt, schemaRepairPrompt]
    : [boundedPrompt];

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
   const attemptPrompt = attempts[attemptIndex];
   if (!attemptPrompt) continue;
   const personal = await requestDailyReadingProvider({
    credential,
    prompt: attemptPrompt,
    phase,
    signal,
   });
   if (!personal.content) {
    providerErrors.push(
     `${credential.label}: ${personal.error || "provider không trả về nội dung."}`,
    );
    break;
   }

   const parsed = parseStructured(personal.content, schema);
   if (parsed !== null) {
    return {
     data: parsed,
     provider: credential.provider,
     model: personal.model,
    };
   }

   if (attemptIndex < attempts.length - 1) {
    onProgress?.(phase === "core" ? "repairing_core" : "repairing_learning");
   }

   if (attemptIndex === attempts.length - 1) {
    providerErrors.push(
     `${credential.label}: nội dung JSON không khớp schema Daily Reading sau lần sửa tự động.`,
    );
   }
  }
 }

 throw new Error(
  `Không có API key cá nhân nào tạo được dữ liệu Daily Reading hợp lệ. ${providerErrors.join(" ")}`.trim(),
 );
}

function compactSourceEvidence(extractedTextZh: string, maxChars: number) {
 const normalized = extractedTextZh.replace(/\s+/gu, " ").trim();
 if (normalized.length <= maxChars) return normalized;
 const headLength = Math.floor(maxChars * 0.72);
 const tailLength = Math.floor(maxChars * 0.28);
 return `${normalized.slice(0, headLength)}\n…\n${normalized.slice(-tailLength)}`;
}

function createCorePrompt(source: DailyReadingSourceCandidate, level: DailyReadingLevel) {
 return [
  `Requested level: ${level}`,
  "Write a new 学习版 rather than copying the publisher's paragraph structure.",
  "Produce as many complete paragraphs as the source and learning goal require. Do not pad, truncate, or optimize for an arbitrary character count.",
  "Each Vietnamese paragraph must closely translate its Chinese paragraph.",
  "Return exactly one JSON object with fields: titleZh, titleVi, whyWorthReadingVi, topic, level, estimatedMinutes, paragraphs[{zh,vi,roleVi}]. Do not omit required fields or add commentary.",
  `Source title: ${source.titleZh}`,
  `Publisher: ${source.publisher}`,
  `Published at: ${source.publishedAt}`,
  "SOURCE ARTICLE EVIDENCE:",
  compactSourceEvidence(source.extractedTextZh, 3800),
 ].join("\n");
}

function createCoreRepairPrompt(
 source: DailyReadingSourceCandidate,
 level: DailyReadingLevel,
 diagnostic: string,
) {
 return [
  createCorePrompt(source, level),
  "",
  "The previous reading-core attempt failed validation.",
  `Validation diagnostic: ${diagnostic.slice(0, 500)}`,
  "Regenerate the complete object. Do not return a patch.",
  "Keep every factual claim source-bound.",
 ].join("\n");
}

function validateCore(source: DailyReadingSourceCandidate, core: DailyReadingCoreDraft) {
 const sourceCompact = source.extractedTextZh.replace(/\s+/gu, "");
 const readingCompact = core.paragraphs
  .map((paragraph) => paragraph.zh)
  .join("")
  .replace(/\s+/gu, "");
 if (readingCompact.length > 180 && sourceCompact.includes(readingCompact.slice(0, 180))) {
  throw new Error("AI đã sao chép một đoạn nguồn quá dài thay vì biên soạn 学习版.");
 }
 return core;
}

function createLearningPrompt(
 sourceTitle: string,
 publisher: string,
 sourceEvidence: string,
 core: DailyReadingCoreDraft,
) {
 const readingText = core.paragraphs
  .map((paragraph, index) => `P${index + 1}: ${paragraph.zh}`)
  .join("\n");
 return [
  "Prepare learning material for the LOCKED READING TEXT. Do not change the reading.",
  "Return exactly one JSON object containing vocabulary (10-14), grammarPoints (3-5), questions (5-6), sourcePhrasesZh, verificationSummaryVi.",
  "Vocabulary items require hanzi, meaningVi, meaningInContextVi, categoryVi; hanzi must occur verbatim in the locked reading.",
  "Grammar items require patternZh, explanationVi, evidenceSentenceZh; evidenceSentenceZh must be a complete sentence copied from the locked reading.",
  "Questions require type, promptZh, promptVi, answerZh, answerVi, evidenceParagraphNumbers; include main_idea, at least two detail, inference, summary; answer only from the reading.",
  "sourcePhrasesZh must be short exact phrases from source evidence and may be empty.",
  `Source title: ${sourceTitle}`,
  `Publisher: ${publisher}`,
  "LOCKED READING TEXT:",
  readingText,
  ...(sourceEvidence.length > 0
   ? ["SOURCE EVIDENCE:", compactSourceEvidence(sourceEvidence, 2100)]
   : ["SOURCE EVIDENCE: unavailable on this retry; sourcePhrasesZh may be empty."]),
 ].join("\n");
}

function createLearningRepairPrompt(
 sourceTitle: string,
 publisher: string,
 sourceEvidence: string,
 core: DailyReadingCoreDraft,
 diagnostic: string,
) {
 return [
  createLearningPrompt(sourceTitle, publisher, sourceEvidence, core),
  "",
  "The previous learning-apparatus attempt failed validation.",
  `Validation diagnostic: ${diagnostic.slice(0, 500)}`,
  "Regenerate the complete object, not a patch. Preserve the locked reading exactly.",
 ].join("\n");
}

function normalizeSentence(value: string) {
 return value.replace(/\s+/gu, "").replace(/[“”‘’"'，。！？、；：,.!?;:（）()《》]/gu, "");
}

function validateLearning(core: DailyReadingCoreDraft, learning: DailyReadingLearningDraft) {
 const readingText = core.paragraphs.map((paragraph) => paragraph.zh).join("\n");
 for (const item of learning.vocabulary) {
  if (!readingText.includes(item.hanzi))
   throw new Error(`Từ vựng không có trong bài: ${item.hanzi}`);
 }
 const readingSentences = core.paragraphs.flatMap(
  (paragraph) => paragraph.zh.match(/[^。！？!?]+[。！？!?]/gu) ?? [paragraph.zh],
 );
 for (const grammar of learning.grammarPoints) {
  const normalizedEvidence = normalizeSentence(grammar.evidenceSentenceZh);
  const exists = readingSentences.some(
   (sentence) => normalizeSentence(sentence) === normalizedEvidence,
  );
  if (!exists) throw new Error(`Ví dụ ngữ pháp không khớp bài đọc: ${grammar.patternZh}`);
 }
 const questionTypes = new Set(learning.questions.map((question) => question.type));
 if (
  !questionTypes.has("main_idea") ||
  !questionTypes.has("inference") ||
  !questionTypes.has("summary")
 ) {
  throw new Error("Bộ câu hỏi thiếu main idea, inference hoặc summary.");
 }
 const detailCount = learning.questions.filter((question) => question.type === "detail").length;
 if (detailCount < 2) throw new Error("Bộ câu hỏi cần ít nhất hai câu detail.");
 for (const question of learning.questions) {
  if (question.evidenceParagraphNumbers.some((number) => number > core.paragraphs.length)) {
   throw new Error("Câu hỏi trỏ tới đoạn không tồn tại.");
  }
 }
 return learning;
}

async function generateCore({
 source,
 preferredLevel,
 credentials,
 signal,
 onProgress,
}: {
 source: DailyReadingSourceCandidate;
 preferredLevel: DailyReadingLevel;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}) {
 onProgress?.("drafting");
 let prompt = createCorePrompt(source, preferredLevel);
 for (let attempt = 0; attempt < 3; attempt += 1) {
  const candidate = await requestStructured({
   prompt,
   schema: dailyReadingCoreDraftSchema,
   phase: "core",
   credentials,
   signal,
   onProgress,
  });
  try {
   return { ...candidate, data: validateCore(source, candidate.data) };
  } catch (error) {
   if (attempt === 2) throw error;
   const diagnostic = error instanceof Error ? error.message : "Reading core validation failed.";
   onProgress?.("repairing_core");
   prompt = createCoreRepairPrompt(source, preferredLevel, diagnostic);
  }
 }
 throw new Error("Reading core generation did not produce a valid result.");
}

async function generateLearning({
 sourceTitle,
 publisher,
 sourceEvidence,
 core,
 credentials,
 signal,
 onProgress,
}: {
 sourceTitle: string;
 publisher: string;
 sourceEvidence: string;
 core: DailyReadingCoreDraft;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}) {
 onProgress?.("enriching");
 let prompt = createLearningPrompt(sourceTitle, publisher, sourceEvidence, core);
 for (let attempt = 0; attempt < 3; attempt += 1) {
  try {
   const result = await requestStructured({
    prompt,
    schema: dailyReadingLearningDraftSchema,
    phase: "learning",
    credentials,
    signal,
    onProgress,
   });
   return { ...result, data: validateLearning(core, result.data) };
  } catch (error) {
   if (attempt === 2) throw error;
   const diagnostic =
    error instanceof Error ? error.message : "Learning apparatus validation failed.";
   onProgress?.("repairing_learning");
   prompt = createLearningRepairPrompt(sourceTitle, publisher, sourceEvidence, core, diagnostic);
  }
 }
 throw new Error("Learning apparatus generation did not produce a valid result.");
}

function finalizeDailyReading({
 source,
 sourceEvidence,
 core,
 learning,
 mode,
 coreProvider,
 coreModel,
 learningProvider,
 learningModel,
}: {
 source: DailyReading["source"];
 sourceEvidence: string;
 core: DailyReadingCoreDraft;
 learning: DailyReadingLearningDraft;
 mode: DailyReadingGenerationKind;
 coreProvider: string;
 coreModel: string;
 learningProvider: string;
 learningModel: string;
}): DailyReading {
 const now = new Date();
 const paragraphIds = core.paragraphs.map((_paragraph, index) => `p${index + 1}`);
 return dailyReadingSchema.parse({
  schemaVersion: "1.0.0",
  id: `daily-${vietnamDailyReadingDateKey(now)}-${crypto.randomUUID()}`,
  publishedDate: vietnamDailyReadingDateKey(now),
  createdAt: now.toISOString(),
  releaseKind: mode,
  titleZh: core.titleZh,
  titlePinyin: getPinyin(core.titleZh),
  titleVi: core.titleVi,
  whyWorthReadingVi: core.whyWorthReadingVi,
  adaptationNoticeVi:
   "Đây là bản học tập được biên soạn lại từ bài nguồn, không phải nguyên văn báo chí. Pinyin được tạo tự động và cần đối chiếu lại khi luyện phát âm.",
  topic: core.topic,
  level: core.level,
  estimatedMinutes: core.estimatedMinutes,
  paragraphs: core.paragraphs.map((paragraph, index) => ({
   id: paragraphIds[index] ?? `p${index + 1}`,
   order: index + 1,
   zh: paragraph.zh,
   pinyin: getPinyin(paragraph.zh),
   vi: paragraph.vi,
   roleVi: paragraph.roleVi,
  })),
  vocabulary: learning.vocabulary.map((item, index) => ({
   id: `v${index + 1}`,
   order: index + 1,
   hanzi: item.hanzi,
   pinyin: getPinyin(item.hanzi),
   meaningVi: item.meaningVi,
   meaningInContextVi: item.meaningInContextVi,
   categoryVi: item.categoryVi,
  })),
  grammarPoints: learning.grammarPoints.map((item, index) => ({ id: `g${index + 1}`, ...item })),
  questions: learning.questions.map((item, index) => ({
   id: `q${index + 1}`,
   type: item.type,
   promptZh: item.promptZh,
   promptVi: item.promptVi,
   answerZh: item.answerZh,
   answerVi: item.answerVi,
   evidenceParagraphIds: item.evidenceParagraphNumbers.map(
    (number) => paragraphIds[number - 1] ?? paragraphIds[0] ?? "p1",
   ),
  })),
  sourcePhrasesZh:
   sourceEvidence.length > 0
    ? learning.sourcePhrasesZh.filter((phrase) => sourceEvidence.includes(phrase)).slice(0, 6)
    : [],
  verificationSummaryVi: learning.verificationSummaryVi,
  source,
  generatedByProvider: learningProvider || coreProvider,
  generatedByModel: learningModel || coreModel || DEFAULT_GEMINI_QUICK_MODEL,
  pinyinReviewStatus: "auto-generated",
 });
}

export async function generateValidatedDailyReading({
 source,
 preferredLevel,
 mode,
 credentials,
 signal,
 onProgress,
 onCheckpoint,
}: {
 source: DailyReadingSourceCandidate;
 preferredLevel: DailyReadingLevel;
 mode: DailyReadingGenerationKind;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
 onCheckpoint?: (checkpoint: DailyReadingGenerationCheckpoint) => void;
}): Promise<DailyReading> {
 const coreResult = await generateCore({
  source,
  preferredLevel,
  credentials,
  signal,
  onProgress,
 });
 const core = coreResult.data;
 const sourceMetadata = {
  titleZh: source.titleZh,
  publisher: source.publisher,
  url: source.url,
  publishedAt: source.publishedAt,
  capturedAt: new Date().toISOString(),
 } satisfies DailyReading["source"];
 onCheckpoint?.({ source: sourceMetadata, core });
 const learningResult = await generateLearning({
  sourceTitle: source.titleZh,
  publisher: source.publisher,
  sourceEvidence: source.extractedTextZh,
  core,
  credentials,
  signal,
  onProgress,
 });
 onProgress?.("validating");
 const reading = finalizeDailyReading({
  source: sourceMetadata,
  sourceEvidence: source.extractedTextZh,
  core,
  learning: learningResult.data,
  mode,
  coreProvider: coreResult.provider,
  coreModel: coreResult.model,
  learningProvider: learningResult.provider,
  learningModel: learningResult.model,
 });
 onProgress?.("finalizing");
 return reading;
}

export async function generateValidatedDailyReadingFromCheckpoint({
 checkpoint,
 mode,
 credentials,
 signal,
 onProgress,
}: {
 checkpoint: DailyReadingGenerationCheckpoint;
 mode: DailyReadingGenerationKind;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}): Promise<DailyReading> {
 const learningResult = await generateLearning({
  sourceTitle: checkpoint.source.titleZh,
  publisher: checkpoint.source.publisher,
  sourceEvidence: "",
  core: checkpoint.core,
  credentials,
  signal,
  onProgress,
 });
 onProgress?.("validating");
 const reading = finalizeDailyReading({
  source: checkpoint.source,
  sourceEvidence: "",
  core: checkpoint.core,
  learning: learningResult.data,
  mode,
  coreProvider: learningResult.provider,
  coreModel: learningResult.model,
  learningProvider: learningResult.provider,
  learningModel: learningResult.model,
 });
 onProgress?.("finalizing");
 return reading;
}
