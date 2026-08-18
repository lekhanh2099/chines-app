import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 discoverDailyReadingSource,
 generateValidatedDailyReading,
 getActiveUserApiKeyCredentials,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 discoverDailyReadingSource: vi.fn(),
 generateValidatedDailyReading: vi.fn(),
 getActiveUserApiKeyCredentials: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 privateNoStoreJson: (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
   ...init,
   headers: { "Cache-Control": "private, no-store" },
  }),
}));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-source.server", () => ({
 discoverDailyReadingSource,
 formatDailyReadingSourceReport: () => "discovery 0/2; candidates 0; extracted 0",
}));
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-generation.server", () => ({
 generateValidatedDailyReading,
}));

import { POST } from "./route";

const source = {
 titleZh: "博物馆推出传统文化暑期新展览",
 publisher: "中国新闻网",
 url: "https://www.chinanews.com.cn/cul/2026/08-18/123.shtml",
 publishedAt: "2026-08-18T02:00:00.000Z",
 topic: "culture" as const,
 extractedTextZh: "文化".repeat(180),
};

const reading = {
 schemaVersion: "1.0.0" as const,
 id: "daily-2026-08-18-test",
 publishedDate: "2026-08-18",
 createdAt: "2026-08-18T03:00:00.000Z",
 releaseKind: "manual" as const,
 titleZh: "城市博物馆的新展览",
 titlePinyin: "chéng shì bó wù guǎn de xīn zhǎn lǎn",
 titleVi: "Triển lãm mới của bảo tàng thành phố",
 whyWorthReadingVi: "Bài đọc giúp luyện cách mô tả một hoạt động văn hóa.",
 adaptationNoticeVi: "Bản học tập được biên soạn từ nguồn báo chí.",
 topic: "culture" as const,
 level: "HSK5" as const,
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
  type: index === 0 ? ("main_idea" as const) : ("detail" as const),
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
 generatedByProvider: "Google Gemini",
 generatedByModel: "gemini-test",
 pinyinReviewStatus: "auto-generated" as const,
};

const request = (body: unknown) =>
 new Request("http://localhost/api/hanzihome/reader/daily-reading/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });

describe("Daily Reading generate route", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" }, supabase: {} },
  });
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  discoverDailyReadingSource.mockImplementation(
   async (_excluded: string[], _topics: string[], onProgress?: (stage: string) => void) => {
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
  generateValidatedDailyReading.mockImplementation(
   async ({ onProgress }: { onProgress?: (stage: string) => void }) => {
    onProgress?.("drafting");
    onProgress?.("validating");
    return reading;
   },
  );
 });

 it("rejects unauthenticated generation before touching providers", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: false, response: Response.json({}) });

  const response = await POST(
   request({ mode: "manual", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
   code: "unauthorized",
   detail: "Cần đăng nhập trước khi tạo Daily Reading.",
  });
  expect(getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("streams progress and a validated result", async () => {
  const response = await POST(
   request({ mode: "manual", preferredLevel: "HSK5", excludedUrls: [], recentTopics: [] }),
  );
  const events = (await response.text())
   .trim()
   .split("\n")
   .map((line) => JSON.parse(line));

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/x-ndjson");
  expect(events.filter((event) => event.type === "progress").map((event) => event.stage)).toEqual(
   expect.arrayContaining(["discovering", "extracting", "drafting", "validating", "completed"]),
  );
  expect(events.at(-1)).toMatchObject({
   type: "result",
   payload: { reading: { id: reading.id, titleZh: reading.titleZh } },
  });
 });

 it("emits source-unavailable without calling the AI generator", async () => {
  discoverDailyReadingSource.mockResolvedValue({
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
  const events = (await response.text())
   .trim()
   .split("\n")
   .map((line) => JSON.parse(line));

  expect(events.at(-1)).toMatchObject({
   type: "error",
   payload: { code: "source-unavailable" },
  });
  expect(generateValidatedDailyReading).not.toHaveBeenCalled();
 });
});
