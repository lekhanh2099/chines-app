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

 it("prefers a semantic article body and preserves paragraph boundaries", () => {
  const outsideNoise =
   "页面顶部还有一段很长的中文导航说明，它满足普通段落的长度条件，但不属于文章正文，所以语义容器抽取时不应该把它带进最终结果。";
  const paragraphA =
   "近日城市博物馆推出暑期传统文化展览，展览通过文物、图片和互动装置介绍古代生活，让年轻观众能够从具体细节理解历史背景和传统手艺的发展。";
  const paragraphB =
   "馆方还安排了面向学生的讲解和体验活动，参与者可以观察展品的制作方法，比较不同地区的文化特点，并在阅读资料后完成自己的观察记录。";
  const paragraphC =
   "工作人员表示，希望这次活动不仅让参观者获得知识，也鼓励大家主动提问、查找资料和讨论文化保护，让一次参观变成更完整的学习过程。";
  const paragraphD =
   "博物馆之后还计划根据观众反馈调整讲解内容，并继续与学校和社区合作开发适合不同年龄学习者的公共教育活动，让展览资源在参观结束之后仍然能够进入课堂和日常学习。";
  const html = `
    <html><head>
      <meta property="article:published_time" content="2026-08-18T10:30:00+08:00">
      <meta property="og:title" content="城市博物馆推出暑期传统文化展览">
    </head>
    <body>
      <p>${outsideNoise}</p>
      <article>
        <p>${paragraphA}</p>
        <p>${paragraphB}</p>
        <p>${paragraphC}</p>
        <p>${paragraphD}</p>
        <p>推荐阅读：更多精彩内容请点击这里继续浏览相关报道和客户端专题。</p>
      </article>
      <p>这一段位于正文之后，也不应该进入语义文章正文。</p>
    </body></html>`;

  const result = extractDailyReadingSourceDocument(html);

  expect(result).not.toBeNull();
  expect(result?.extractionMethod).toBe("article");
  expect(result?.paragraphsZh).toEqual([paragraphA, paragraphB, paragraphC, paragraphD]);
  expect(result?.extractedTextZh).not.toContain(outsideNoise);
  expect(result?.pageTitleZh).toBe("城市博物馆推出暑期传统文化展览");
  expect(result?.pagePublishedAt).toBe("2026-08-18T02:30:00.000Z");
 });

 it("uses structured articleBody before generic page paragraphs when it carries real paragraphs", () => {
  const paragraphA =
   "城市公共图书馆今年增加了夜间阅读空间，希望为下班后的年轻人提供更安静、更稳定的学习环境，也让公共文化服务覆盖更多日常生活场景。";
  const paragraphB =
   "不少读者表示，晚上开放之后，他们不需要赶在下班前借书，还可以参加小型分享会、主题阅读活动以及面向普通读者的知识讲座。";
  const paragraphC =
   "图书馆方面计划继续观察使用情况，根据读者反馈调整开放时间和活动安排，并和社区合作探索更多适合不同年龄人群的公共阅读服务。";
  const paragraphD =
   "为了避免夜间开放只解决场地问题，工作人员还会记录读者最常使用的资源类型，并尝试增加适合晚间参加的阅读活动，让延长开放时间真正转化为更完整的公共文化服务。";
  const articleBody = `${paragraphA}\n${paragraphB}\n${paragraphC}\n${paragraphD}`;
  const structured = JSON.stringify({ "@type": "NewsArticle", articleBody });
  const html = `
    <html><head><script type="application/ld+json">${structured}</script></head>
    <body>
      <p>页面模板中的中文介绍很长很长，但它不是新闻正文，只用于测试结构化正文应该比通用段落更优先。</p>
      <p>另一个模板段落也有足够多的中文字符，用来证明抽取器不会因为普通段落先出现就错误选择页面噪声内容。</p>
      <p>最后一个模板段落继续补足长度，使通用抽取理论上也能成功，但结果仍然应该来自结构化的 articleBody 字段。</p>
    </body></html>`;

  const result = extractDailyReadingSourceDocument(html);

  expect(result?.extractionMethod).toBe("json-ld");
  expect(result?.paragraphsZh).toEqual([paragraphA, paragraphB, paragraphC, paragraphD]);
 });

 it("stops ChinaNews extraction at the end of the article body", () => {
  const paragraphs = [
   "景德镇举办文化遗产保护研讨会，来自多个领域的专家围绕陶瓷文化传承、城市发展和国际传播展开交流，并介绍最新保护成果。",
   "与会学者表示，世界遗产保护需要长期稳定的管理体系，也需要通过教育、研究和公共文化活动让更多人理解遗产价值。",
   "当地计划继续整理陶瓷工业遗存资料，推动博物馆、学校和社区共同参与，让保护成果更好地服务城市居民和来访者。",
   "研讨会最后提出，应当用准确、易懂的语言介绍中国文化遗产，在尊重历史事实的基础上加强不同文明之间的交流互鉴。",
   "专家还建议建立长期开放的资料平台，持续公布保护进展、研究成果和公众教育项目，帮助不同年龄的学习者理解陶瓷文化的历史脉络。",
  ];
  const related =
   "从到此一游转向深度体验，暑期这些玩法受到游客欢迎并成为页面下方的相关新闻推荐标题";
  const html = `<html><body>
   <div class="content_maincontent_content">
    <div class="left_zw">
     ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    </div>
    <!--正文end-->
    <div class="related"><p>${related}</p></div>
   </div>
  </body></html>`;

  const result = extractDailyReadingSourceDocument(html);

  expect(result?.extractionMethod).toBe("content-container");
  expect(result?.paragraphsZh).toEqual(paragraphs);
  expect(result?.extractedTextZh).not.toContain(related);
 });
});
