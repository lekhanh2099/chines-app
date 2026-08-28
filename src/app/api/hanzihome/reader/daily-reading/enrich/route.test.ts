import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReading } from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";

const mocks = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 recordUserAiRuntimeActivity: vi.fn(),
 recordUserAiTaskBlockedActivity: vi.fn(),
 resolveUserAiTaskRuntime: vi.fn(),
 generateDailyReadingEnrichment: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));
vi.mock("@/services/ai-runtime.service", () => ({
 recordUserAiRuntimeActivity: mocks.recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity: mocks.recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime: mocks.resolveUserAiTaskRuntime,
}));
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-enrichment.server", () => ({
 generateDailyReadingEnrichment: mocks.generateDailyReadingEnrichment,
}));

import { POST } from "./route";

const reading: DailyReading = {
 schemaVersion: "2.0.0",
 id: "daily:2026-08-19:1234abcd",
 publishedDate: "2026-08-19",
 capturedAt: "2026-08-19T06:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 source: {
  titleZh: "城市博物馆推出传统文化专题展览",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-19/123.shtml",
  publishedAt: "2026-08-19T02:00:00.000Z",
  capturedAt: "2026-08-19T06:00:00.000Z",
 },
 article: {
  titleZh: "城市博物馆推出传统文化专题展览",
  paragraphs: [
   { id: "source-p1", order: 1, zh: "城市博物馆最近推出传统文化专题展览，吸引了很多年轻观众。" },
   {
    id: "source-p2",
    order: 2,
    zh: "策展团队利用器物照片和互动资料，帮助观众理解不同历史时期的日常生活。",
   },
   {
    id: "source-p3",
    order: 3,
    zh: "博物馆还与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。",
   },
  ],
  hanCharacterCount: 94,
  fingerprint: "1234abcd",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
 estimatedMinutes: 2,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
};

const evidence = {
 id: reading.id,
 source: reading.source,
 article: reading.article,
 classification: reading.classification,
};

const runtime = {
 taskId: "daily-reading.translation",
 resolutionSource: "auto",
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq chính",
 maskedKey: "gsk_****1234",
 model: "openai/gpt-oss-20b",
 priority: 0,
 apiKey: "user-secret-key",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
 ],
};

function request(body: object) {
 return new Request("http://localhost/api/hanzihome/reader/daily-reading/enrich", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("Daily Reading enrichment route", () => {
 beforeEach(() => {
  mocks.requireAuthenticatedRoute.mockReset();
  mocks.recordUserAiRuntimeActivity.mockReset();
  mocks.recordUserAiTaskBlockedActivity.mockReset();
  mocks.resolveUserAiTaskRuntime.mockReset();
  mocks.generateDailyReadingEnrichment.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { marker: "supabase" }, user: { id: "user-1" } },
  });
 });

 it("rejects unauthenticated requests before resolving a provider", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: false });

  const response = await POST(request({ module: "translation", reading: evidence }));

  expect(response.status).toBe(401);
  expect(mocks.resolveUserAiTaskRuntime).not.toHaveBeenCalled();
  expect(mocks.generateDailyReadingEnrichment).not.toHaveBeenCalled();
 });

 it("rejects invalid article payloads at the route boundary", async () => {
  const response = await POST(request({ module: "grammar", reading: { id: "bad" } }));

  expect(response.status).toBe(400);
  expect(mocks.resolveUserAiTaskRuntime).not.toHaveBeenCalled();
 });

 it("rejects overbroad payloads that include enrichment state", async () => {
  const response = await POST(request({ module: "grammar", reading }));

  expect(response.status).toBe(400);
  expect(mocks.resolveUserAiTaskRuntime).not.toHaveBeenCalled();
 });

 it("blocks enrichment without a user key while leaving acquisition outside this route", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await POST(
   request({ module: "translation", reading: evidence, targetCount: null }),
  );
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body).toMatchObject({
   ok: false,
   status: "blocked",
   module: "translation",
   reason: "missing-ai-key",
  });
  expect(mocks.generateDailyReadingEnrichment).not.toHaveBeenCalled();
 });

 it("keeps vault failures distinct from missing-key", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "storage-unavailable",
   reason: "vault-unavailable",
  });

  const response = await POST(request({ module: "grammar", reading: evidence, targetCount: 4 }));
  const body = await response.json();

  expect(response.status).toBe(503);
  expect(body).toMatchObject({
   ok: false,
   status: "failed",
   module: "grammar",
   errorCode: "storage-unavailable",
  });
 });

 it("uses the shared BYOK runtime and returns safe module data without the raw key", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
  mocks.generateDailyReadingEnrichment.mockResolvedValue({
   ok: true,
   module: "translation",
   data: {
    titleVi: "Bảo tàng thành phố mở triển lãm văn hóa truyền thống",
    whyWorthReadingVi: "Bài viết nói về cách bảo tàng kết nối người trẻ với văn hóa công cộng.",
    adaptationNoticeVi: "Bản dịch hỗ trợ học tập.",
    paragraphs: reading.article.paragraphs.map((paragraph) => ({
     paragraphId: paragraph.id,
     vi: `Nghĩa của ${paragraph.id}`,
     roleVi: "Nội dung chính",
    })),
   },
   generatedBy: { provider: "Groq", model: "openai/gpt-oss-20b" },
  });

  const response = await POST(
   request({ module: "translation", reading: evidence, targetCount: null }),
  );
  const body = await response.json();
  const serialized = JSON.stringify(body);

  expect(response.status).toBe(200);
  expect(body).toMatchObject({ ok: true, module: "translation" });
  expect(mocks.resolveUserAiTaskRuntime).toHaveBeenCalledWith(
   expect.objectContaining({ taskId: "daily-reading.translation", userId: "user-1" }),
  );
  expect(mocks.generateDailyReadingEnrichment).toHaveBeenCalledWith(
   expect.objectContaining({ reading: evidence, module: "translation" }),
  );
  expect(serialized).not.toContain("user-secret-key");
  expect(serialized).not.toContain("apiKey");
 });

 it("maps exhausted account quota to a retryable blocked module", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
  mocks.generateDailyReadingEnrichment.mockResolvedValue({
   ok: false,
   status: "failed",
   module: "questions",
   errorCode: "quota-exhausted",
   errorDetail: "Groq báo quota tài khoản không còn đủ cho yêu cầu này.",
  });

  const response = await POST(request({ module: "questions", reading: evidence, targetCount: 6 }));
  const body = await response.json();

  expect(response.status).toBe(429);
  expect(body).toMatchObject({
   ok: false,
   status: "blocked",
   module: "questions",
   reason: "quota-exhausted",
  });
 });

 it("maps a temporary provider limit to service unavailable instead of account quota", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
  mocks.generateDailyReadingEnrichment.mockResolvedValue({
   ok: false,
   status: "failed",
   module: "translation",
   errorCode: "provider-unavailable",
   errorDetail: "Groq đang giới hạn tần suất hoặc token (HTTP 429).",
  });

  const response = await POST(
   request({ module: "translation", reading: evidence, targetCount: null }),
  );
  const body = await response.json();

  expect(response.status).toBe(503);
  expect(body).toMatchObject({
   ok: false,
   status: "blocked",
   module: "translation",
   reason: "provider-unavailable",
  });
  expect(JSON.stringify(body)).not.toContain("user-secret-key");
 });
});
