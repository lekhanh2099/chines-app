import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultDailyReadingSettings } from "@/features/hanzihome/reader/daily-reading/daily-reading.settings";

const mocks = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 captureDailyReadingArticle: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));

vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-capture.server", () => ({
 captureDailyReadingArticle: mocks.captureDailyReadingArticle,
}));

vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-source.server", () => ({
 formatDailyReadingSourceReport: () => "source report",
}));

import { POST } from "./route";

const history = [
 {
  topic: "culture",
  sourceUrl: "https://www.chinanews.com.cn/cul/2026/08-18/old.shtml",
  capturedAt: "2026-08-18T03:00:00.000Z",
 },
];

const reading = {
 schemaVersion: "2.0.0",
 id: "daily:2026-08-19:1234abcd",
 publishedDate: "2026-08-19",
 capturedAt: "2026-08-19T06:00:00.000Z",
 releaseKind: "scheduled",
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
   {
    id: "source-p1",
    order: 1,
    zh: "第一段介绍城市博物馆最近推出的传统文化专题展览以及展览面向年轻观众设计的新内容。",
   },
   {
    id: "source-p2",
    order: 2,
    zh: "第二段介绍策展团队如何利用器物照片和互动资料帮助观众理解不同历史时期的日常生活。",
   },
   {
    id: "source-p3",
    order: 3,
    zh: "第三段介绍博物馆与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。",
   },
  ],
  hanCharacterCount: 120,
  fingerprint: "1234abcd",
 },
 classification: {
  topic: "culture",
  targetLevel: "HSK5",
  estimatedLevel: null,
 },
 estimatedMinutes: 2,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
};

function request(body: object) {
 return new Request("http://localhost/api/hanzihome/reader/daily-reading/capture", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("Daily Reading capture route", () => {
 beforeEach(() => {
  mocks.requireAuthenticatedRoute.mockReset();
  mocks.captureDailyReadingArticle.mockReset();
 });

 it("rejects unauthenticated capture requests before discovery", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: false });

  const response = await POST(request({}));

  expect(response.status).toBe(401);
  expect(mocks.captureDailyReadingArticle).not.toHaveBeenCalled();
 });

 it("rejects invalid collection settings/history at the route boundary", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });

  const response = await POST(request({ mode: "scheduled", settings: {}, history: [] }));

  expect(response.status).toBe(400);
  expect(mocks.captureDailyReadingArticle).not.toHaveBeenCalled();
 });

 it("returns source-unavailable without invoking any AI path", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  mocks.captureDailyReadingArticle.mockResolvedValue({
   reading: null,
   report: {
    discoveryEndpoints: 2,
    discoveryResponses: 2,
    metadataCandidates: 3,
    policyCandidates: 1,
    attemptedExtractions: 1,
    extractionFailures: {},
    qualityRejections: {},
    selectedFinalScore: null,
    usedFreshnessDays: null,
    notes: [],
   },
  });

  const response = await POST(
   request({ mode: "scheduled", settings: defaultDailyReadingSettings, history }),
  );

  expect(response.status).toBe(503);
 });

 it("returns a validated captured article for an authenticated request", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  mocks.captureDailyReadingArticle.mockResolvedValue({
   reading,
   report: {
    discoveryEndpoints: 3,
    discoveryResponses: 3,
    metadataCandidates: 7,
    policyCandidates: 4,
    attemptedExtractions: 4,
    extractionFailures: {},
    qualityRejections: {},
    selectedFinalScore: 91,
    usedFreshnessDays: 3,
    notes: [],
   },
  });

  const response = await POST(
   request({ mode: "scheduled", settings: defaultDailyReadingSettings, history }),
  );
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.reading.id).toBe(reading.id);
  expect(body.reading.enrichment.translation.status).toBe("idle");
 });
});
