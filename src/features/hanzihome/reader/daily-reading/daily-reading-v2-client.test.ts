import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReadingV2CaptureResponse } from "./daily-reading-v2.schemas";

vi.mock("./daily-reading-lock.client", () => ({
 DailyReadingGenerationBusyError: class extends Error {},
 withDailyReadingGenerationLock: <Result>(task: () => Promise<Result>) => task(),
}));

import { previewDailyReadingV2Source } from "./daily-reading-v2-client";

const values = new Map<string, string>();

const responsePayload: DailyReadingV2CaptureResponse = {
 reading: {
  schemaVersion: "2.0.0",
  id: "daily-v2:2026-08-19:1234abcd",
  publishedDate: "2026-08-19",
  capturedAt: "2026-08-19T07:00:00.000Z",
  releaseKind: "manual",
  provenance: "source-captured",
  source: {
   titleZh: "城市博物馆推出传统文化专题展览",
   publisher: "中国新闻网",
   url: "https://www.chinanews.com.cn/cul/2026/08-19/123.shtml",
   publishedAt: "2026-08-19T02:00:00.000Z",
   capturedAt: "2026-08-19T07:00:00.000Z",
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
 },
 report: {
  discoveryEndpoints: 5,
  discoveryResponses: 4,
  metadataCandidates: 17,
  policyCandidates: 9,
  attemptedExtractions: 4,
  selectedFinalScore: 82,
  usedFreshnessDays: 3,
 },
};

describe("Daily Reading V2 source preview", () => {
 beforeEach(() => {
  values.clear();
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", {
   localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
   },
   dispatchEvent: vi.fn(),
   addEventListener: vi.fn(),
   removeEventListener: vi.fn(),
   setTimeout,
   clearTimeout,
  });
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("uses the V2 capture contract without persisting a preview article or capture run", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(responsePayload));
  vi.stubGlobal("fetch", fetchMock);

  const result = await previewDailyReadingV2Source();

  expect(result).toEqual(responsePayload);
  expect(values.has("chines-app:daily-reading:v2")).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const requestInit = fetchMock.mock.calls[0]?.[1];
  const body = typeof requestInit?.body === "string" ? JSON.parse(requestInit.body) : null;
  expect(body).toMatchObject({
   mode: "manual",
   settings: { schemaVersion: "2.1.0", targetLevel: "HSK5" },
   history: [],
  });
  expect(JSON.stringify(body)).not.toMatch(/apiKey|GEMINI_API_KEY|DEEPSEEK_API_KEY/u);
 });
});
