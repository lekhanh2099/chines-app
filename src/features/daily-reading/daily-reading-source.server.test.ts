import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { discoverDailyReadingSourceWithPolicy } from "@/features/daily-reading/daily-reading-source.server";

vi.mock("server-only", () => ({}));

const fragmentedParagraphs = [
 "城市文化活动栏目最新推荐内容信息一二三四五",
 "社区阅读空间开放通知相关说明信息一二三四五",
 "夜间服务时间调整公告相关信息内容一二三四五",
 "公共图书馆活动栏目推荐专题内容一二三四五",
 "文化空间便民服务页面介绍内容一二三四五六",
 "读者活动报名入口相关提示信息一二三四五六",
 "社区文化活动最新列表说明内容一二三四五六",
 "公共服务项目页面栏目说明内容一二三四五六",
 "城市阅读专题页面推荐内容信息一二三四五六",
 "夜间阅读活动页面说明栏目内容一二三四五六",
 "公共文化服务专题导航内容信息一二三四五六",
 "社区图书馆服务项目列表内容一二三四五六七",
 "城市文化空间活动栏目推荐信息一二三四五六",
 "公共阅读服务页面最新说明内容一二三四五六",
];

const goodParagraphs = [
 "城市博物馆最近推出传统文化专题展览，展览以普通人的日常生活为线索，通过器物、照片和互动资料介绍不同历史时期的生活方式，也让年轻观众更容易理解文化变化背后的社会背景。",
 "策展团队把来自不同地区和年代的展品放在一起比较，观众可以观察材料、用途和审美差异，再根据说明文字思考这些差异为什么出现，以及它们和当时的城市生活有什么关系。",
 "馆方还为学生安排讲解和体验活动，希望大家不是只记住几个年代和名称，而是从具体展品出发提出问题、查找资料并和同伴讨论，让参观过程变成一次主动学习。",
 "博物馆工作人员说，后续还会根据观众的停留时间、提问内容和活动反馈调整讲解方式，并继续与学校和社区合作，让展览不只是一次性的参观活动，而能成为持续理解地方历史和公共文化的入口。",
];

function articleHtml(title: string, paragraphs: readonly string[]) {
 return `<!doctype html><html><head>
  <meta property="article:published_time" content="2026-08-19T14:00:00+08:00">
  <meta property="og:title" content="${title}">
 </head><body><article>${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</article></body></html>`;
}

describe("Daily Reading source discovery resilience", () => {
 beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T08:00:00.000Z"));
 });

 afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
 });

 it("continues beyond eight quality rejects and selects a later valid article", async () => {
  const articles = Array.from({ length: 12 }, (_value, index) => {
   const sequence = String(index + 1).padStart(2, "0");
   return {
    title: `城市博物馆推出传统文化夜间展览第${sequence}期`,
    url: `https://www.chinanews.com.cn/cul/2026/08-19/article-${sequence}.shtml`,
    seendate: "20260819T060000Z",
   };
  });

  const fetchMock = vi.fn(async (input: string | URL | Request) => {
   const url = String(input);
   if (url.startsWith("https://api.gdeltproject.org/api/v2/doc/doc")) {
    return Response.json({ articles });
   }
   const match = /article-(\d{2})\.shtml$/u.exec(url);
   if (match !== null) {
    const index = Number(match[1]);
    const title = `城市博物馆推出传统文化夜间展览第${match[1]}期`;
    return new Response(articleHtml(title, index <= 8 ? fragmentedParagraphs : goodParagraphs), {
     status: 200,
     headers: { "Content-Type": "text/html; charset=utf-8" },
    });
   }
   return new Response("unavailable", { status: 503 });
  });
  vi.stubGlobal("fetch", fetchMock);

  const result = await discoverDailyReadingSourceWithPolicy({
   freshness: { primaryDays: 3, fallbackDays: null, noMatchBehavior: "skip-day" },
   selectedTopics: ["culture"],
   selectedSources: ["chinanews"],
   allowedDomains: ["chinanews.com.cn"],
   preferredLength: "any",
   recentTopics: [],
   excludedSourceUrls: [],
  });

  expect(result.selection).not.toBeNull();
  expect(result.source?.url).toContain("article-09.shtml");
  expect(result.report.attemptedExtractions).toBe(12);
  expect(result.report.qualityRejections["incoherent-paragraphs"]).toBe(8);
 });
});
