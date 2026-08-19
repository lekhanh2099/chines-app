import { beforeEach, describe, expect, it, vi } from "vitest";

import {
 dailyReadingGenerateStreamEventSchema,
 type DailyReading,
 type DailyReadingGenerationCheckpoint,
 type DailyReadingGenerationStage,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";
import type { JsonFieldValue } from "@/types/json";

const mocks = vi.hoisted(() => ({
 discoverDailyReadingSource: vi.fn(),
 generateValidatedDailyReading: vi.fn(),
 generateValidatedDailyReadingFromCheckpoint: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 resolveAiCredentialRuntime: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 privateNoStoreJson: (body: JsonFieldValue, init?: ResponseInit) =>
  Response.json(body, {
   ...init,
   headers: { "Cache-Control": "private, no-store" },
  }),
}));
vi.mock("@/services/ai-analysis-runtime.service", () => ({
 resolveAiCredentialRuntime: mocks.resolveAiCredentialRuntime,
}));
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-source.server", () => ({
 discoverDailyReadingSource: mocks.discoverDailyReadingSource,
 formatDailyReadingSourceReport: () => "discovery 0/2; candidates 0; extracted 0",
}));
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-generation.server", () => ({
 generateValidatedDailyReading: mocks.generateValidatedDailyReading,
 generateValidatedDailyReadingFromCheckpoint: mocks.generateValidatedDailyReadingFromCheckpoint,
}));

import { POST } from "./route";

const credential: UserApiKeyCredential = {
 id: "00000000-0000-4000-8000-000000000001",
 userId: "user-1",
 provider: "groq",
 label: "Groq cá nhân",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: null,
 createdAt: "2026-08-18T00:00:00.000Z",
 updatedAt: "2026-08-18T00:00:00.000Z",
 apiKey: "gsk-personal",
};
const source = {
 titleZh: "博物馆推出传统文化暑期新展览",
 publisher: "中国新闻网",
 url: "https://www.chinanews.com.cn/cul/2026/08-18/123.shtml",
 publishedAt: "2026-08-18T02:00:00.000Z",
 topic: "culture",
 extractedTextZh: "文化".repeat(180),
};
const reading = {
 schemaVersion: "1.0.0",
 id: "daily-2026-08-18-test",
 publishedDate: "2026-08-18",
 createdAt: "2026-08-18T03:00:00.000Z",
 releaseKind: "manual",
 titleZh: "城市博物馆的新展览",
 titlePinyin: "chéng shì bó wù guǎn de xīn zhǎn lǎn",
 titleVi: "Triển lãm mới của bảo tàng thành phố",
 whyWorthReadingVi: "Bài đọc giúp luyện cách mô tả một hoạt động văn hóa.",
 adaptationNoticeVi: "Bản học tập được biên soạn từ nguồn báo chí.",
 topic: "culture",
 level: "HSK5",
 estimatedMinutes: 8,
 paragraphs: Array.from({ length: 4 }, (_value, index) => ({
  id: `p${index + 1}`,
  order: index + 1,
  zh: `这是第${index + 1}段用于测试每日阅读生成接口的中文内容。`,
  pinyin: "zhè shì cè shì nèi róng",
  vi: `Đây là đoạn ${index + 1} dùng để kiểm tra API tạo bài.`,
  roleVi: "thân bài",
 })),
 vocabulary: Array.from({ length: 8 }, (_value, index) => ({
  id: `v${index + 1}`,
  order: index + 1,
  hanzi: `词语${index + 1}`,
  pinyin: "cí yǔ",
  meaningVi: `nghĩa ${index + 1}`,
  meaningInContextVi: `nghĩa trong bài ${index + 1}`,
  categoryVi: "danh từ",
 })),
 grammarPoints: Array.from({ length: 3 }, (_value, index) => ({
  id: `g${index + 1}`,
  patternZh: `结构${index + 1}`,
  explanationVi: `Giải thích ${index + 1}`,
  evidenceSentenceZh: `这是第${index + 1}段用于测试每日阅读生成接口的中文内容。`,
 })),
 questions: Array.from({ length: 5 }, (_value, index) => ({
  id: `q${index + 1}`,
  type: index === 0 ? "main_idea" : "detail",
  promptZh: `问题${index + 1}是什么？`,
  promptVi: `Câu hỏi ${index + 1} là gì?`,
  answerZh: `答案${index + 1}。`,
  answerVi: `Đáp án ${index + 1}.`,
  evidenceParagraphIds: ["p1"],
 })),
 sourcePhrasesZh: [],
 verificationSummaryVi: "Nội dung được tạo từ nguồn đã kiểm tra.",
 source: {
  titleZh: source.titleZh,
  publisher: source.publisher,
  url: source.url,
  publishedAt: source.publishedAt,
  capturedAt: "2026-08-18T03:00:00.000Z",
 },
 generatedByProvider: "Groq",
 generatedByModel: "openai/gpt-oss-20b",
 pinyinReviewStatus: "auto-generated",
} satisfies DailyReading;
const checkpoint = {
 source: reading.source,
 core: {
  titleZh: reading.titleZh,
  titleVi: reading.titleVi,
  whyWorthReadingVi: reading.whyWorthReadingVi,
  topic: reading.topic,
  level: reading.level,
  estimatedMinutes: reading.estimatedMinutes,
  paragraphs: reading.paragraphs.map(({ zh, vi, roleVi }) => ({ zh, vi, roleVi })),
 },
} satisfies DailyReadingGenerationCheckpoint;

function request(body: JsonFieldValue) {
 return new Request("http://localhost/api/hanzihome/reader/daily-reading/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

function parseEvents(responseText: string) {
 return responseText
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => dailyReadingGenerateStreamEventSchema.parse(JSON.parse(line)));
}

describe("Daily Reading generate compatibility route", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" }, supabase: { marker: "supabase" } },
  });
  mocks.resolveAiCredentialRuntime.mockResolvedValue({
   ok: true,
   runtime: { keyId: credential.id },
   credential,
  });
  mocks.discoverDailyReadingSource.mockImplementation(
   async (
    _excluded: string[],
    _topics: string[],
    onProgress?: (stage: DailyReadingGenerationStage) => void,
   ) => {
    onProgress?.("discovering");
    onProgress?.("extracting");
    return {
     source,
     report: {
      discoveryEndpoints: 2,
      discoveryResponses: 2,
      metadataCandidates: 1,
      attemptedExtractions: 1,
      extractionFailures: {},
      notes: [],
     },
    };
   },
  );
  mocks.generateValidatedDailyReading.mockImplementation(
   async ({
    onProgress,
    onCheckpoint,
   }: {
    onProgress?: (stage: DailyReadingGenerationStage) => void;
    onCheckpoint?: (value: DailyReadingGenerationCheckpoint) => void;
   }) => {
    onProgress?.("drafting");
    onCheckpoint?.(checkpoint);
    onProgress?.("validating");
    return reading;
   },
  );
  mocks.generateValidatedDailyReadingFromCheckpoint.mockImplementation(
   async ({ onProgress }: { onProgress?: (stage: DailyReadingGenerationStage) => void }) => {
    onProgress?.("enriching");
    return reading;
   },
  );
 });

 it("rejects unauthenticated generation before resolving a runtime", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: false, response: Response.json({}) });

  const response = await POST(
   request({ mode: "manual", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );

  expect(response.status).toBe(401);
  expect(mocks.resolveAiCredentialRuntime).not.toHaveBeenCalled();
 });

 it("blocks legacy learning generation when no personal key exists", async () => {
  mocks.resolveAiCredentialRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(
   request({ mode: "manual", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );

  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "provider-rejected" });
  expect(mocks.discoverDailyReadingSource).not.toHaveBeenCalled();
  expect(mocks.generateValidatedDailyReading).not.toHaveBeenCalled();
 });

 it("resolves the shared Daily Reading capability and streams a validated result", async () => {
  const response = await POST(
   request({ mode: "manual", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );
  const events = parseEvents(await response.text());

  expect(response.status).toBe(200);
  expect(mocks.resolveAiCredentialRuntime).toHaveBeenCalledWith(
   expect.objectContaining({ userId: "user-1", capability: "daily-reading-learning" }),
  );
  expect(mocks.generateValidatedDailyReading).toHaveBeenCalledWith(
   expect.objectContaining({ credentials: [credential] }),
  );
  expect(events.filter((event) => event.type === "progress").map((event) => event.stage)).toEqual(
   expect.arrayContaining(["discovering", "extracting", "drafting", "validating"]),
  );
  expect(events.at(-1)).toMatchObject({ type: "result", payload: { reading: { id: reading.id } } });
 });

 it("emits source-unavailable without calling the AI generator", async () => {
  mocks.discoverDailyReadingSource.mockResolvedValue({
   source: null,
   report: {
    discoveryEndpoints: 2,
    discoveryResponses: 0,
    metadataCandidates: 0,
    attemptedExtractions: 0,
    extractionFailures: {},
    notes: [],
   },
  });

  const response = await POST(
   request({ mode: "scheduled", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );
  const events = parseEvents(await response.text());

  expect(events.at(-1)).toMatchObject({
   type: "error",
   payload: { code: "source-unavailable" },
  });
  expect(mocks.generateValidatedDailyReading).not.toHaveBeenCalled();
 });

 it("resumes learning from a checkpoint without rediscovering the source", async () => {
  const response = await POST(
   request({
    mode: "manual",
    preferredLevel: "HSK5",
    excludedUrls: [],
    recentTopics: [],
    checkpoint,
   }),
  );
  const events = parseEvents(await response.text());

  expect(events.map((event) => (event.type === "progress" ? event.stage : event.type))).toContain(
   "enriching",
  );
  expect(mocks.discoverDailyReadingSource).not.toHaveBeenCalled();
  expect(mocks.generateValidatedDailyReadingFromCheckpoint).toHaveBeenCalledWith(
   expect.objectContaining({ checkpoint, credentials: [credential] }),
  );
 });
});
