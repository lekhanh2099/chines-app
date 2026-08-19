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

function documentFromParagraphs(
 sourceParagraphs: readonly string[],
 overrides: Partial<ParsedDailyReadingSourceDocument> = {},
): ParsedDailyReadingSourceDocument {
 const extractedTextZh = sourceParagraphs.join("\n");
 const hanCharacters = extractedTextZh.match(/[\u3400-\u9fff]/gu)?.length ?? 0;
 const textCharacters = extractedTextZh.replace(/\s+/gu, "").length;
 return document({
  extractedTextZh,
  paragraphsZh: sourceParagraphs,
  hanCharacters,
  textCharacters,
  chineseDensity: textCharacters === 0 ? 0 : hanCharacters / textCharacters,
  ...overrides,
 });
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

 it("accepts real short news paragraphs when they are sentence-like and Chinese-dense", () => {
  const shortParagraphs = [
   "社区图书馆延长夜间开放时间，方便上班族下班后继续阅读。",
   "馆内新增自习座位和照明设备，也调整了晚间值班安排。",
   "不少年轻读者表示，下班以后终于有稳定的公共阅读空间。",
   "图书馆还准备了主题书架，集中推荐城市文化和生活类图书。",
   "工作人员每天记录座位使用情况，并根据需求调整开放区域。",
   "部分社区志愿者也参与服务，为第一次到馆的读者提供指引。",
   "周末晚间会安排小型分享活动，让读者交流最近阅读的作品。",
   "馆方表示会继续收集意见，观察夜间服务是否真正满足需求。",
   "学校和社区也计划合作，把部分阅读活动延伸到公共文化空间。",
   "一些家长认为延长开放时间，也方便学生完成课后阅读任务。",
   "图书馆提醒读者提前查看活动安排，避免热门时段没有座位。",
   "后续还会根据季节变化调整时间，并持续评估夜间开放效果。",
  ] as const;
  const result = assessDailyReadingSourceQuality({
   document: documentFromParagraphs(shortParagraphs, {
    pageTitleZh: "社区图书馆延长夜间开放时间",
   }),
   metadataTitleZh: "社区图书馆延长夜间开放时间",
   metadataPublishedAt: "2026-08-19T02:00:00.000Z",
   preferredLength: "any",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });

  expect(result.hanCharacters).toBeGreaterThanOrEqual(240);
  expect(result.coherentParagraphRatio).toBeGreaterThan(0.9);
  expect(result.accepted).toBe(true);
  expect(result.rejection).toBeNull();
 });

 it("still rejects heavily fragmented Chinese blocks without sentence structure", () => {
  const fragments = [
   "城市文化公共服务最新活动安排详细介绍内容一二三四五六",
   "社区阅读空间开放通知相关说明信息内容一二三四五六七",
   "夜间服务时间调整公告更多相关信息内容一二三四五六七",
   "公共图书馆活动栏目推荐专题内容信息一二三四五六七八",
   "文化空间便民服务页面介绍相关内容一二三四五六七八九",
   "读者活动报名入口以及相关提示信息一二三四五六七八九",
   "社区文化活动最新列表相关说明内容一二三四五六七八九",
   "公共服务项目页面栏目说明信息内容一二三四五六七八九",
   "城市阅读专题页面推荐内容相关信息一二三四五六七八九",
   "夜间阅读活动页面说明栏目内容一二三四五六七八九十",
   "公共文化服务专题导航相关内容信息一二三四五六七八九",
   "社区图书馆服务项目列表相关内容一二三四五六七八九十",
  ] as const;
  const result = assessDailyReadingSourceQuality({
   document: documentFromParagraphs(fragments, {
    pageTitleZh: "城市文化公共服务最新活动安排",
   }),
   metadataTitleZh: "城市文化公共服务最新活动安排",
   metadataPublishedAt: "2026-08-19T02:00:00.000Z",
   preferredLength: "any",
   maximumFreshnessDays: 3,
   now: new Date("2026-08-19T05:00:00.000Z"),
  });

  expect(result.hanCharacters).toBeGreaterThanOrEqual(240);
  expect(result.coherentParagraphRatio).toBeLessThan(0.35);
  expect(result.rejection).toBe("incoherent-paragraphs");
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
