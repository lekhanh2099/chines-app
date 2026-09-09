import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildCapturedDailyReading } from "@/features/daily-reading/daily-reading-capture.server";
import type { DailyReadingSelectedSource } from "@/features/daily-reading/daily-reading-source.server";
import { defaultDailyReadingSettings } from "@/features/daily-reading/daily-reading.settings";

const paragraphs: readonly string[] = [
 "城市博物馆最近推出传统文化专题展览，展览以普通人的日常生活为线索，通过器物、照片和互动资料介绍不同历史时期的生活方式，也让年轻观众更容易理解文化变化背后的社会背景。",
 "策展团队把来自不同地区和年代的展品放在一起比较，观众可以观察材料、用途和审美差异，再根据说明文字思考这些差异为什么出现，以及它们和当时的城市生活有什么关系。",
 "馆方还为学生安排讲解和体验活动，希望大家不是只记住几个年代和名称，而是从具体展品出发提出问题、查找资料并和同伴讨论，让参观过程变成一次主动学习。",
 "博物馆工作人员说，后续还会根据观众的停留时间、提问内容和活动反馈调整讲解方式，并继续与学校和社区合作，让展览不只是一次性的参观活动，而能成为持续理解地方历史和公共文化的入口。",
];
const extractedTextZh = paragraphs.join("\n");
const hanCharacters = extractedTextZh.match(/[\u3400-\u9fff]/gu)?.length ?? 0;

const selection: DailyReadingSelectedSource = {
 source: {
  titleZh: "城市博物馆推出传统文化专题展览",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-19/123.shtml",
  publishedAt: "2026-08-19T02:00:00.000Z",
  topic: "culture",
  extractedTextZh,
 },
 paragraphsZh: paragraphs,
 extractionMethod: "article",
 metadataScore: 82,
 finalScore: 91,
 quality: {
  accepted: true,
  rejection: null,
  score: 98,
  hanCharacters,
  paragraphCount: paragraphs.length,
  chineseDensity: 0.91,
  coherentParagraphRatio: 1,
  titleBodyCoverage: 0.78,
  pageTitleSimilarity: 1,
  ageDays: 0.2,
  extractionMethod: "article",
 },
};

describe("Daily Reading article capture", () => {
 it("preserves the exact source paragraphs and leaves every enrichment idle", () => {
  const reading = buildCapturedDailyReading({
   selection,
   settings: defaultDailyReadingSettings,
   mode: "scheduled",
   now: new Date("2026-08-19T06:00:00.000Z"),
  });

  expect(reading.provenance).toBe("source-captured");
  expect(reading.publishedDate).toBe("2026-08-19");
  expect(reading.article.paragraphs.map((paragraph) => paragraph.zh)).toEqual(paragraphs);
  expect(reading.source.url).toBe(selection.source.url);
  expect(reading.enrichment.translation.status).toBe("idle");
  expect(reading.enrichment.vocabulary.status).toBe("idle");
  expect(reading.enrichment.grammar.status).toBe("idle");
  expect(reading.enrichment.questions.status).toBe("idle");
  expect(JSON.stringify(reading)).not.toMatch(/pinyin/iu);
 });

 it("creates a stable article identity from date and source fingerprint", () => {
  const first = buildCapturedDailyReading({
   selection,
   settings: defaultDailyReadingSettings,
   mode: "manual",
   now: new Date("2026-08-19T06:00:00.000Z"),
  });
  const second = buildCapturedDailyReading({
   selection,
   settings: defaultDailyReadingSettings,
   mode: "manual",
   now: new Date("2026-08-19T08:00:00.000Z"),
  });

  expect(first.id).toBe(second.id);
  expect(first.article.fingerprint).toBe(second.article.fingerprint);
 });
});
