import {
 findDailyReadingSourceByHostname,
 type DailyReadingSourceId,
} from "@/features/daily-reading/daily-reading-source-catalog";
import type { DailyReadingTopic } from "@/features/daily-reading/daily-reading.schemas";

export type DailyReadingDiscoveryKind = "official-rss" | "official-listing" | "gdelt";
export type DailyReadingSourceMetadata = {
 discoveryKind: DailyReadingDiscoveryKind;
 titleZh: string;
 publisher: string;
 url: string;
 publishedAt: string;
 topic: DailyReadingTopic;
 score: number;
};

type SourceRegistryEntry = {
 id: DailyReadingSourceId;
 rssUrls: readonly string[];
 listingUrls: readonly string[];
};

export const dailyReadingSourceRegistry: readonly SourceRegistryEntry[] = [
 {
  id: "chinanews",
  rssUrls: [
   "https://www.chinanews.com.cn/rss/culture.xml",
   "https://www.chinanews.com.cn/rss/edu.xml",
   "https://www.chinanews.com.cn/rss/life.xml",
   "https://www.chinanews.com.cn/rss/jk.xml",
  ],
  listingUrls: [
   "https://www.chinanews.com.cn/",
   "https://www.chinanews.com.cn/scroll-news/news1.html",
   "https://www.chinanews.com.cn/cul/",
   "https://www.chinanews.com.cn/edu/",
   "https://www.chinanews.com.cn/life/",
  ],
 },
 {
  id: "xinhua",
  rssUrls: [
   "https://www.xinhuanet.com/local/news_province.xml",
   "https://www.xinhuanet.com/politics/news_politics.xml",
  ],
  listingUrls: [],
 },
];

const excludedTitlePattern =
 /(会议|领导|选举|战争|伤亡|死亡|事故|地震|暴雨|台风|疫情|彩票开奖|股票|证券|通报|被查|遇难|坠毁|洪水|军事|关税|特朗普|袭击|爆炸)/u;
const preferredTitlePattern =
 /(博物馆|文化|艺术|非遗|文物|考古|展览|阅读|教育|学校|学生|青年|课堂|学习|历史|古代|遗址|传统|古籍|语言|汉语|文字|方言|翻译|书店|图书|科技|科学|研究|实验|航天|人工智能|生态|环保|自然|森林|湿地|动物|植物|健康|运动|营养|睡眠|旅游|城市|乡村|景区|公园|生活|手艺|匠心|遗产|研学)/u;
const topicRules: readonly { pattern: RegExp; topic: DailyReadingTopic }[] = [
 { pattern: /(博物馆|文化|艺术|非遗|文物|考古|展览|手艺|匠心|遗产)/u, topic: "culture" },
 { pattern: /(教育|学校|学生|青年|课堂|学习|教师|研学)/u, topic: "education" },
 { pattern: /(历史|古代|遗址|传统|古籍)/u, topic: "history" },
 { pattern: /(语言|汉语|文字|方言|翻译|书店|图书|阅读)/u, topic: "language" },
 { pattern: /(科技|科学|研究|实验|航天|人工智能)/u, topic: "science" },
 { pattern: /(生态|环保|自然|森林|湿地|动物|植物)/u, topic: "environment" },
 { pattern: /(健康|医疗|运动|营养|睡眠)/u, topic: "health" },
 { pattern: /(旅游|城市|乡村|景区|公园|交通)/u, topic: "travel" },
];

export function isAllowedDailyReadingDomain(hostname: string) {
 return findDailyReadingSourceByHostname(hostname) !== null;
}

export function publisherForDailyReadingDomain(hostname: string) {
 const normalized = hostname.toLowerCase();
 return findDailyReadingSourceByHostname(normalized)?.publisherLabelZh ?? normalized;
}

export function resolveDailyReadingTopic(title: string): DailyReadingTopic {
 return topicRules.find((rule) => rule.pattern.test(title))?.topic ?? "society";
}

export function isEligibleDailyReadingTitle(title: string) {
 const normalized = title.replace(/\s+/gu, " ").trim();
 return (
  normalized.length >= 8 &&
  !excludedTitlePattern.test(normalized) &&
  preferredTitlePattern.test(normalized)
 );
}

export function canonicalDailyReadingUrl(value: string): string | null {
 try {
  const url = new URL(value);
  if (!isAllowedDailyReadingDomain(url.hostname)) return null;
  if (url.protocol === "http:") url.protocol = "https:";
  url.hash = "";
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "spm", "from"]) {
   url.searchParams.delete(key);
  }
  if ([...url.searchParams.keys()].length === 0) url.search = "";
  return url.toString();
 } catch {
  return null;
 }
}

export function scoreDailyReadingMetadata(
 title: string,
 topic: DailyReadingTopic,
 publishedAt: string,
 recentTopics: readonly DailyReadingTopic[],
 discoveryKind: DailyReadingDiscoveryKind,
) {
 const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
 const freshness = Math.max(0, 45 - ageHours / 6);
 const diversity = recentTopics.includes(topic) ? 0 : 25;
 const titleScore = Math.min(18, Math.max(0, title.length - 8));
 const sourceScore =
  discoveryKind === "official-rss" ? 20 : discoveryKind === "official-listing" ? 16 : 8;
 return freshness + diversity + titleScore + sourceScore;
}
