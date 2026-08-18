import type { DailyReadingTopic } from "./daily-reading.schemas";
import {
 canonicalDailyReadingUrl,
 isEligibleDailyReadingTitle,
 publisherForDailyReadingDomain,
 resolveDailyReadingTopic,
 scoreDailyReadingMetadata,
 type DailyReadingDiscoveryKind,
 type DailyReadingSourceMetadata,
} from "./daily-reading-source-policy.server";

const hanPattern = /[\u3400-\u9fff]/gu;
const boilerplatePattern =
 /(责任编辑|版权所有|未经授权|来源：|编辑：|扫一扫|客户端|点击进入|更多精彩|举报电话|文明上网|评论服务协议|小字体|大字体|分享到)/u;
const articleStopPattern = /(更多精彩内容|推荐阅读|发表评论|新闻精选|换一批|相关阅读)/u;
const datePathPattern = /\/(\d{4})\/(\d{2})-(\d{2})\//u;

export type ParsedDailyReadingSourceDocument = {
 extractedTextZh: string;
 pagePublishedAt: string;
};

function decodeEntities(value: string) {
 const named: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
 };
 return value
  .replace(/&#(\d+);/gu, (_match, code: string) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/giu, (_match, code: string) =>
   String.fromCodePoint(Number.parseInt(code, 16)),
  )
  .replace(/&([a-z]+);/giu, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function textFromFragment(fragment: string) {
 const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/u.exec(fragment)?.[1] ?? fragment;
 return decodeEntities(
  cdata
   .replace(/<br\s*\/?\s*>/giu, "\n")
   .replace(/<[^>]+>/gu, " ")
   .replace(/[\t\r ]+/gu, " ")
   .replace(/\n{3,}/gu, "\n\n")
   .trim(),
 );
}

function elementText(fragment: string, tagName: string) {
 const expression = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "iu");
 return textFromFragment(expression.exec(fragment)?.[1] ?? "");
}

function parseDate(value: string) {
 const parsed = new Date(value.trim());
 return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function publishedAtFromPath(url: URL) {
 const match = datePathPattern.exec(url.pathname);
 if (match === null) return null;
 const [, year = "", month = "", day = ""] = match;
 return parseDate(`${year}-${month}-${day}T12:00:00+08:00`);
}

function metadataFromValues(input: {
 discoveryKind: DailyReadingDiscoveryKind;
 titleZh: string;
 url: string;
 publishedAt: string;
 recentTopics: readonly DailyReadingTopic[];
}): DailyReadingSourceMetadata | null {
 const titleZh = input.titleZh.replace(/\s+/gu, " ").trim();
 if (!isEligibleDailyReadingTitle(titleZh)) return null;
 const url = canonicalDailyReadingUrl(input.url);
 const publishedAt = parseDate(input.publishedAt);
 if (url === null || publishedAt === null) return null;
 const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
 if (ageDays < -1 || ageDays > 14) return null;
 const topic = resolveDailyReadingTopic(titleZh);
 const hostname = new URL(url).hostname;
 return {
  discoveryKind: input.discoveryKind,
  titleZh,
  publisher: publisherForDailyReadingDomain(hostname),
  url,
  publishedAt,
  topic,
  score: scoreDailyReadingMetadata(
   titleZh,
   topic,
   publishedAt,
   input.recentTopics,
   input.discoveryKind,
  ),
 };
}

export function parseDailyReadingRss(xml: string, recentTopics: readonly DailyReadingTopic[]) {
 return Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/giu)).flatMap((match) => {
  const item = match[1] ?? "";
  const metadata = metadataFromValues({
   discoveryKind: "official-rss",
   titleZh: elementText(item, "title"),
   url: elementText(item, "link") || elementText(item, "guid"),
   publishedAt: elementText(item, "pubDate") || elementText(item, "dc:date") || elementText(item, "date"),
   recentTopics,
  });
  return metadata === null ? [] : [metadata];
 });
}

export function parseDailyReadingListing(
 html: string,
 listingUrl: string,
 recentTopics: readonly DailyReadingTopic[],
) {
 return Array.from(
  html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu),
 ).flatMap((match) => {
  let url: URL;
  try {
   url = new URL(match[1] ?? "", listingUrl);
  } catch {
   return [];
  }
  const publishedAt = publishedAtFromPath(url);
  if (publishedAt === null) return [];
  const metadata = metadataFromValues({
   discoveryKind: "official-listing",
   titleZh: textFromFragment(match[2] ?? ""),
   url: url.toString(),
   publishedAt,
   recentTopics,
  });
  return metadata === null ? [] : [metadata];
 });
}

function pagePublishedAt(html: string): string {
 const patterns = [
  /<meta\b[^>]*(?:property|name)=["']article:published_time["'][^>]*content=["']([^"']+)["']/iu,
  /["']datePublished["']\s*:\s*["']([^"']+)["']/iu,
  /(20\d{2})[-年](\d{1,2})[-月](\d{1,2})[日\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/u,
 ];
 for (const pattern of patterns) {
  const match = pattern.exec(html);
  if (match === null) continue;
  if (match[2] !== undefined) {
   const [, year = "", month = "", day = "", hour = "00", minute = "00", second = "00"] = match;
   const parsed = parseDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}+08:00`);
   if (parsed !== null) return parsed;
  }
  const parsed = parseDate(match[1] ?? "");
  if (parsed !== null) return parsed;
 }
 return "";
}

export function extractDailyReadingSourceDocument(html: string): ParsedDailyReadingSourceDocument | null {
 const cleaned = html
  .replace(/<(script|style|svg|noscript|form|nav|footer)[^>]*>[\s\S]*?<\/\1>/giu, " ")
  .replace(/<!--([\s\S]*?)-->/gu, " ");
 const paragraphs = Array.from(cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu))
  .map((match) => textFromFragment(match[1] ?? ""))
  .filter((text) => (text.match(hanPattern)?.length ?? 0) >= 18 && !boilerplatePattern.test(text));
 const unique: string[] = [];
 for (const paragraph of paragraphs) {
  if (articleStopPattern.test(paragraph)) break;
  if (!unique.includes(paragraph)) unique.push(paragraph);
 }
 const extractedTextZh = unique.join("\n").slice(0, 15_500).trim();
 if ((extractedTextZh.match(hanPattern)?.length ?? 0) < 240 || unique.length < 3) return null;
 return { extractedTextZh, pagePublishedAt: pagePublishedAt(html) };
}
