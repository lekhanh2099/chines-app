import "server-only";

import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";

import { DEFAULT_GEMINI_QUICK_MODEL } from "@/lib/gemini-models";
import { throwIfAborted } from "@/lib/request-utils";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

import {
 requestDailyReadingProvider,
 requestDailyReadingSystemGemini,
 type DailyReadingProviderPhase,
} from "./daily-reading-provider.server";
import {
 dailyReadingCoreDraftSchema,
 dailyReadingLearningDraftSchema,
 dailyReadingSchema,
 type DailyReading,
 type DailyReadingCoreDraft,
 type DailyReadingGenerationKind,
 type DailyReadingGenerationStage,
 type DailyReadingLevel,
 type DailyReadingLearningDraft,
 type DailyReadingSourceCandidate,
} from "./daily-reading.schemas";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";

const hanPattern = /[\u3400-\u9fff]/gu;

function parseStructured<T>(raw: string, schema: z.ZodType<T>): T | null {
 try {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "");
  const parsed = schema.safeParse(JSON.parse(cleaned));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

function createSchemaRepairPrompt(prompt: string, phase: DailyReadingProviderPhase) {
 const contract =
  phase === "core"
   ? "Return exactly one core object with titleZh, titleVi, whyWorthReadingVi, topic, level, estimatedMinutes, and paragraphs[{zh,vi,roleVi}]."
   : "Return exactly one learning object with vocabulary[{hanzi,meaningVi,meaningInContextVi,categoryVi}], grammarPoints[{patternZh,explanationVi,evidenceSentenceZh}], questions[{type,promptZh,promptVi,answerZh,answerVi,evidenceParagraphNumbers}], sourcePhrasesZh, and verificationSummaryVi.";
 return `${prompt}\n\nSCHEMA REPAIR: the previous JSON did not satisfy the required shape. ${contract} Include every required field, use no markdown, and do not add commentary.`;
}

async function requestStructured<T>({
 prompt,
 schema,
 phase,
 credentials,
 signal,
}: {
 prompt: string;
 schema: z.ZodType<T>;
 phase: DailyReadingProviderPhase;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
}): Promise<{ data: T; provider: string; model: string }> {
 const boundedPrompt = prompt.normalize("NFC").trim();
 if (boundedPrompt.length === 0 || boundedPrompt.length > 5900) {
  throw new Error("Daily Reading prompt vượt giới hạn an toàn.");
 }

 const providerErrors: string[] = [];
 for (const credential of credentials) {
  throwIfAborted(signal);
  const schemaRepairPrompt = createSchemaRepairPrompt(boundedPrompt, phase);
  const attempts =
   schemaRepairPrompt.length <= 5900 ? [boundedPrompt, schemaRepairPrompt] : [boundedPrompt];

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
    providerErrors.push(`${credential.label}: ${personal.error || "provider không trả về nội dung."}`);
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

   if (attemptIndex === attempts.length - 1) {
    providerErrors.push(`${credential.label}: nội dung JSON không khớp schema Daily Reading sau lần sửa tự động.`);
   }
  }
 }

 const system = await requestDailyReadingSystemGemini({ prompt: boundedPrompt, phase, signal });
 if (system.content) {
  const parsed = parseStructured(system.content, schema);
  if (parsed !== null) {
   return { data: parsed, provider: "Google Gemini", model: system.model };
  }
  providerErrors.push("Gemini hệ thống: nội dung JSON không khớp schema Daily Reading.");
 } else if (system.error) {
  providerErrors.push(system.error);
 }

 if (credentials.length === 0 && !process.env.GEMINI_API_KEY) {
  throw new Error(
   "Không có AI provider khả dụng: chưa có API key cá nhân đang hoạt động và server chưa cấu hình GEMINI_API_KEY.",
  );
 }
 throw new Error(
  `Không có AI provider nào tạo được dữ liệu Daily Reading hợp lệ. ${providerErrors.join(" ")}`.trim(),
 );
}

function compactSourceEvidence(source: DailyReadingSourceCandidate, maxChars: number) {
 const normalized = source.extractedTextZh.replace(/\s+/gu, " ").trim();
 if (normalized.length <= maxChars) return normalized;
 const headLength = Math.floor(maxChars * 0.72);
 const tailLength = Math.floor(maxChars * 0.28);
 return `${normalized.slice(0, headLength)}\n…\n${normalized.slice(-tailLength)}`;
}

function createCorePrompt(source: DailyReadingSourceCandidate, level: DailyReadingLevel) {
 return [
  `Requested level: ${level}`,
  "Write a new 学习版 rather than copying the publisher's paragraph structure.",
  "Produce 5-7 complete paragraphs totaling about 480-720 Han characters.",
  "Each Vietnamese paragraph must closely translate its Chinese paragraph.",
  "Return exactly one JSON object with fields: titleZh, titleVi, whyWorthReadingVi, topic, level, estimatedMinutes, paragraphs[{zh,vi,roleVi}]. Do not omit required fields or add commentary.",
  `Source title: ${source.titleZh}`,
  `Publisher: ${source.publisher}`,
  `Published at: ${source.publishedAt}`,
  "SOURCE ARTICLE EVIDENCE:",
  compactSourceEvidence(source, 3800),
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
  "Count Han characters before returning. Keep every factual claim source-bound.",
 ].join("\n");
}

function validateCore(source: DailyReadingSourceCandidate, core: DailyReadingCoreDraft) {
 const hanCount = core.paragraphs.map((paragraph) => paragraph.zh).join("").match(hanPattern)?.length ?? 0;
 if (hanCount < 420) throw new Error(`Bài đọc AI quá ngắn (${hanCount} Hán tự).`);
 const sourceCompact = source.extractedTextZh.replace(/\s+/gu, "");
 const readingCompact = core.paragraphs.map((paragraph) => paragraph.zh).join("").replace(/\s+/gu, "");
 if (readingCompact.length > 180 && sourceCompact.includes(readingCompact.slice(0, 180))) {
  throw new Error("AI đã sao chép một đoạn nguồn quá dài thay vì biên soạn 学习版.");
 }
 return core;
}

function createLearningPrompt(source: DailyReadingSourceCandidate, core: DailyReadingCoreDraft) {
 const readingText = core.paragraphs.map((paragraph, index) => `P${index + 1}: ${paragraph.zh}`).join("\n");
 return [
  "Prepare learning material for the LOCKED READING TEXT. Do not change the reading.",
  "Return exactly one JSON object containing vocabulary (10-14), grammarPoints (3-5), questions (5-6), sourcePhrasesZh, verificationSummaryVi.",
  "Vocabulary items require hanzi, meaningVi, meaningInContextVi, categoryVi; hanzi must occur verbatim in the locked reading.",
  "Grammar items require patternZh, explanationVi, evidenceSentenceZh; evidenceSentenceZh must be a complete sentence copied from the locked reading.",
  "Questions require type, promptZh, promptVi, answerZh, answerVi, evidenceParagraphNumbers; include main_idea, at least two detail, inference, summary; answer only from the reading.",
  "sourcePhrasesZh must be short exact phrases from source evidence and may be empty.",
  "LOCKED READING TEXT:",
  readingText,
  "SOURCE EVIDENCE:",
  compactSourceEvidence(source, 2100),
 ].join("\n");
}

function createLearningRepairPrompt(
 source: DailyReadingSourceCandidate,
 core: DailyReadingCoreDraft,
 diagnostic: string,
) {
 return [
  createLearningPrompt(source, core),
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
  if (!readingText.includes(item.hanzi)) throw new Error(`Từ vựng không có trong bài: ${item.hanzi}`);
 }
 const readingSentences = core.paragraphs.flatMap(
  (paragraph) => paragraph.zh.match(/[^。！？!?]+[。！？!?]/gu) ?? [paragraph.zh],
 );
 for (const grammar of learning.grammarPoints) {
  const normalizedEvidence = normalizeSentence(grammar.evidenceSentenceZh);
  const exists = readingSentences.some((sentence) => normalizeSentence(sentence) === normalizedEvidence);
  if (!exists) throw new Error(`Ví dụ ngữ pháp không khớp bài đọc: ${grammar.patternZh}`);
 }
 const questionTypes = new Set(learning.questions.map((question) => question.type));
 if (!questionTypes.has("main_idea") || !questionTypes.has("inference") || !questionTypes.has("summary")) {
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
 const primary = await requestStructured({
  prompt: createCorePrompt(source, preferredLevel),
  schema: dailyReadingCoreDraftSchema,
  phase: "core",
  credentials,
  signal,
 });
 try {
  return { ...primary, data: validateCore(source, primary.data) };
 } catch (error) {
  const diagnostic = error instanceof Error ? error.message : "Reading core validation failed.";
  onProgress?.("repairing_core");
  const repaired = await requestStructured({
   prompt: createCoreRepairPrompt(source, preferredLevel, diagnostic),
   schema: dailyReadingCoreDraftSchema,
   phase: "core",
   credentials,
   signal,
  });
  return { ...repaired, data: validateCore(source, repaired.data) };
 }
}

async function generateLearning({
 source,
 core,
 credentials,
 signal,
 onProgress,
}: {
 source: DailyReadingSourceCandidate;
 core: DailyReadingCoreDraft;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}) {
 onProgress?.("enriching");
 const primary = await requestStructured({
  prompt: createLearningPrompt(source, core),
  schema: dailyReadingLearningDraftSchema,
  phase: "learning",
  credentials,
  signal,
 });
 try {
  return { ...primary, data: validateLearning(core, primary.data) };
 } catch (error) {
  const diagnostic = error instanceof Error ? error.message : "Learning apparatus validation failed.";
  onProgress?.("repairing_learning");
  const repaired = await requestStructured({
   prompt: createLearningRepairPrompt(source, core, diagnostic),
   schema: dailyReadingLearningDraftSchema,
   phase: "learning",
   credentials,
   signal,
  });
  return { ...repaired, data: validateLearning(core, repaired.data) };
 }
}

export async function generateValidatedDailyReading({
 source,
 preferredLevel,
 mode,
 credentials,
 signal,
 onProgress,
}: {
 source: DailyReadingSourceCandidate;
 preferredLevel: DailyReadingLevel;
 mode: DailyReadingGenerationKind;
 credentials: UserApiKeyCredential[];
 signal?: AbortSignal;
 onProgress?: (stage: DailyReadingGenerationStage) => void;
}): Promise<DailyReading> {
 const coreResult = await generateCore({
  source,
  preferredLevel,
  credentials,
  signal,
  onProgress,
 });
 const core = coreResult.data;
 const learningResult = await generateLearning({
  source,
  core,
  credentials,
  signal,
  onProgress,
 });
 const learning = learningResult.data;
 onProgress?.("validating");
 const now = new Date();
 const paragraphIds = core.paragraphs.map((_paragraph, index) => `p${index + 1}`);
 onProgress?.("finalizing");
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
  sourcePhrasesZh: learning.sourcePhrasesZh
   .filter((phrase) => source.extractedTextZh.includes(phrase))
   .slice(0, 6),
  verificationSummaryVi: learning.verificationSummaryVi,
  source: {
   titleZh: source.titleZh,
   publisher: source.publisher,
   url: source.url,
   publishedAt: source.publishedAt,
   capturedAt: now.toISOString(),
  },
  generatedByProvider: learningResult.provider || coreResult.provider,
  generatedByModel: learningResult.model || coreResult.model || DEFAULT_GEMINI_QUICK_MODEL,
  pinyinReviewStatus: "auto-generated",
 });
}
