import { describe, expect, it } from "vitest";

import type { ParsedDailyReadingSourceDocument } from "./daily-reading-source-parsers.server";
import {
 assessDailyReadingSourceQuality,
 dailyReadingFinalSelectionScore,
} from "./daily-reading-source-quality";

const paragraphs: readonly string[] = [
 "城市博物馆最近推出传统文化专题展览，展览以普通人的日常生活为线索，通过器物、照片和互动资料介绍不同历史时期的生活方式，也让年轻观众更容易理解文化变化背后的社会背景。",
 "策展团队把来自不同地区和年代的展品放在一起比较，观众可以观察材料、用途和审美差异，再根据说明文字思考这些差异为什么出现，以及它们和当时的城市生活有什么关系。",
 "馆方还为学生安排讲解和体验活动，希望大家不是只记住几个年代和名称，而是从具体展品出发提出问题、查找资料并和同伴讨论，让参观过程变成一次主动学习。",
 "博物馆工作人员说，后续还会根据观众的停留时间、提问内容和活动反馈调整讲解方式，并继续与学校和社区合作，让展览不只是一次性的参观活动，而能成为持续理解地方历史和公共文化的入口。",
];

function document(overrides: Partial<ParsedDailyReadingSourceDocument> = {}): ParsedDailyReadingSourceDocument {
 const extractedTextZh = paragraphs.join("\n");
 const hanCharacters = extractedTextZh.match(/[\u3400-\u9fff]/gu)?.length ?? 0;
 return {
  extractedTextZh,
  paragraphsZh: paragraphs,
  pagePublishedAt: "2026-08-19T02:00:00.000Z",
  pageTitleZh: "城市博物馆推出传统文化专题展览",
  extractionMethod: "article",
  hanCharacters,
  textCharacters: extractedTextZh.length,
  chineseDensity: 0.86,
  truncated: false,
  ...overrides,
 };
}

describe("Daily Reading source quality", () => {
 it("accepts a coherent recent Chinese article and scores semantic extraction", () => {
  const result = assessDailyReadingSourceQuality({
   document: document(),
   metadataTitleZh: "城市博物馆推出传统文化专题展览",
   metadataPublishedAt: "2026-08-19T02:00:00.000Z",
   preferredLength: "medium",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });

  expect(result.accepted).toBe(true);
  expect(result.rejection).toBeNull();
  expect(result.titleBodyCoverage).toBeGreaterThan(0.5);
  expect(result.score).toBeGreaterThan(50);
 });

 it("rejects truncated, stale and unrelated extracted content at the quality boundary", () => {
  const truncated = assessDailyReadingSourceQuality({
   document: document({ truncated: true }),
   metadataTitleZh: "城市博物馆推出传统文化专题展览",
   metadataPublishedAt: "2026-08-19T02:00:00.000Z",
   preferredLength: "medium",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });
  const stale = assessDailyReadingSourceQuality({
   document: document({ pagePublishedAt: "2026-08-10T02:00:00.000Z" }),
   metadataTitleZh: "城市博物馆推出传统文化专题展览",
   metadataPublishedAt: "2026-08-10T02:00:00.000Z",
   preferredLength: "medium",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });
  const unrelatedParagraphs = [
   "天气逐渐转凉，农业生产进入新的阶段，各地正在安排秋季田间管理工作，技术人员提醒农户根据作物生长情况及时调整灌溉和田间管理计划。",
   "工作人员还提醒农户关注气象变化并提前准备防护措施，在降温、大风或者持续降雨到来之前检查设施，尽量减少极端天气可能带来的影响。",
   "相关部门表示将继续发布农业技术信息和气象提示，并根据不同地区的生产特点提供更有针对性的建议，帮助农户合理安排秋季生产。",
   "一些地区还组织技术人员深入田间介绍土壤管理和病虫害防治方法，帮助种植户根据今年的温度、降水和作物长势选择更合适的管理方案。",
   "农业服务部门表示，后续会继续汇总基层生产情况，通过线上平台和现场指导及时发布技术建议，让农户在天气变化较大的阶段获得更稳定的信息支持。",
  ];
  const unrelatedText = unrelatedParagraphs.join("\n");
  const unrelated = assessDailyReadingSourceQuality({
   document: document({
    extractedTextZh: unrelatedText,
    paragraphsZh: unrelatedParagraphs,
    pageTitleZh: "农业生产进入秋季管理阶段",
    hanCharacters: unrelatedText.match(/[\u3400-\u9fff]/gu)?.length ?? 0,
    textCharacters: unrelatedText.length,
   }),
   metadataTitleZh: "城市博物馆推出传统文化专题展览",
   metadataPublishedAt: "2026-08-19T02:00:00.000Z",
   preferredLength: "medium",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });

  expect(truncated.rejection).toBe("truncated");
  expect(stale.rejection).toBe("stale");
  expect(unrelated.rejection).toBe("title-body-mismatch");
 });

 it("lets post-extraction quality outrank the first metadata success", () => {
  const firstSuccessScore = dailyReadingFinalSelectionScore(94, 28);
  const betterArticleScore = dailyReadingFinalSelectionScore(78, 88);

  expect(betterArticleScore).toBeGreaterThan(firstSuccessScore);
 });
});
