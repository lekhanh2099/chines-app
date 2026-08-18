import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
 extractDailyReadingSourceDocument,
 parseDailyReadingListing,
 parseDailyReadingRss,
} from "./daily-reading-source-parsers.server";

describe("Daily Reading source parsers", () => {
 beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-18T04:00:00.000Z"));
 });

 afterEach(() => {
  vi.useRealTimers();
 });

 it("parses a recent allowed RSS item into source metadata", () => {
  const items = parseDailyReadingRss(
   `<rss><channel><item>
      <title><![CDATA[博物馆推出传统文化暑期新展览]]></title>
      <link>https://www.chinanews.com.cn/cul/2026/08-18/123.shtml</link>
      <pubDate>Tue, 18 Aug 2026 02:00:00 GMT</pubDate>
    </item></channel></rss>`,
   [],
  );

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({
   titleZh: "博物馆推出传统文化暑期新展览",
   publisher: "中国新闻网",
   topic: "culture",
  });
 });

 it("derives the publication date from a ChinaNews listing path", () => {
  const items = parseDailyReadingListing(
   `<a href="/cul/2026/08-18/123.shtml">博物馆推出传统文化暑期新展览</a>`,
   "https://www.chinanews.com.cn/cul/",
   [],
  );

  expect(items).toHaveLength(1);
  expect(items[0]?.url).toBe("https://www.chinanews.com.cn/cul/2026/08-18/123.shtml");
  expect(items[0]?.publishedAt).toBe("2026-08-18T04:00:00.000Z");
 });

 it("extracts article paragraphs while dropping boilerplate and stopping before recommendations", () => {
  const paragraphA =
   "近日城市博物馆推出暑期传统文化展览，展览通过文物、图片和互动装置介绍古代生活，让年轻观众能够从具体细节理解历史背景和传统手艺的发展。";
  const paragraphB =
   "馆方还安排了面向学生的讲解和体验活动，参与者可以观察展品的制作方法，比较不同地区的文化特点，并在阅读资料后完成自己的观察记录。";
  const paragraphC =
   "工作人员表示，希望这次活动不仅让参观者获得知识，也鼓励大家主动提问、查找资料和讨论文化保护，让一次参观变成更完整的学习过程。";
  const html = `
    <html><head><meta property="article:published_time" content="2026-08-18T10:30:00+08:00"></head>
    <body>
      <p>${paragraphA}</p>
      <p>${paragraphB}</p>
      <p>${paragraphC}</p>
      <p>推荐阅读：更多精彩内容请点击这里继续浏览相关报道和客户端专题。</p>
      <p>这一段位于推荐阅读之后，不应该进入正文抽取结果，即使这里还有很多中文字符用于干扰测试。</p>
    </body></html>`;

  const result = extractDailyReadingSourceDocument(html);

  expect(result).not.toBeNull();
  expect(result?.extractedTextZh).toContain(paragraphA);
  expect(result?.extractedTextZh).toContain(paragraphC);
  expect(result?.extractedTextZh).not.toContain("这一段位于推荐阅读之后");
  expect(result?.pagePublishedAt).toBe("2026-08-18T02:30:00.000Z");
 });
});
