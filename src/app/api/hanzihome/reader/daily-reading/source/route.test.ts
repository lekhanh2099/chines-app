import { beforeEach, describe, expect, it, vi } from "vitest";

import {
 dailyReadingErrorResponseSchema,
 dailyReadingSourcePreviewResponseSchema,
} from "@/features/daily-reading/daily-reading.schemas";
import type { JsonFieldValue } from "@/types/json";

const { discoverDailyReadingSource, requireAuthenticatedRoute } = vi.hoisted(() => ({
 discoverDailyReadingSource: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 privateNoStoreJson: (body: JsonFieldValue, init?: ResponseInit) =>
  Response.json(body, {
   ...init,
   headers: { "Cache-Control": "private, no-store" },
  }),
}));
vi.mock("@/features/daily-reading/daily-reading-source.server", () => ({
 discoverDailyReadingSource,
 formatDailyReadingSourceReport: () => "discovery 0/2; candidates 0; extracted 0",
}));

import { POST } from "./route";

const request = (body: JsonFieldValue) =>
 new Request("http://localhost/api/hanzihome/reader/daily-reading/source", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });

describe("Daily Reading source route", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" }, supabase: {} },
  });
 });

 it("rejects unauthenticated source tests with the feature error contract", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({}),
  });

  const response = await POST(request({ excludedUrls: [], recentTopics: [] }));
  const payload = dailyReadingErrorResponseSchema.parse(await response.json());

  expect(response.status).toBe(401);
  expect(payload).toEqual({
   code: "unauthorized",
   detail: "Cần đăng nhập trước khi kiểm tra nguồn Daily Reading.",
  });
  expect(discoverDailyReadingSource).not.toHaveBeenCalled();
 });

 it("returns a bounded preview without exposing extracted article text", async () => {
  discoverDailyReadingSource.mockResolvedValue({
   source: {
    titleZh: "博物馆推出传统文化暑期新展览",
    publisher: "中国新闻网",
    url: "https://www.chinanews.com.cn/cul/2026/08-18/123.shtml",
    publishedAt: "2026-08-18T02:00:00.000Z",
    topic: "culture",
    extractedTextZh: "文化".repeat(130),
   },
   report: {
    discoveryEndpoints: 3,
    discoveryResponses: 2,
    metadataCandidates: 5,
    attemptedExtractions: 1,
    extractionFailures: {},
    notes: [],
   },
  });

  const response = await POST(request({ excludedUrls: [], recentTopics: ["science"] }));
  const payload = dailyReadingSourcePreviewResponseSchema.parse(await response.json());

  expect(response.status).toBe(200);
  expect(payload.source).toMatchObject({
   publisher: "中国新闻网",
   topic: "culture",
   hanCharacters: 260,
  });
  expect(payload.report).toEqual({
   discoveryEndpoints: 3,
   discoveryResponses: 2,
   metadataCandidates: 5,
   attemptedExtractions: 1,
  });
 });

 it("reports source-unavailable distinctly from request validation", async () => {
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

  const response = await POST(request({ excludedUrls: [], recentTopics: [] }));
  const payload = dailyReadingErrorResponseSchema.parse(await response.json());

  expect(response.status).toBe(503);
  expect(payload.code).toBe("source-unavailable");
 });
});
