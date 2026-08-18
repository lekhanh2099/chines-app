import "server-only";

import { z } from "zod";

import {
 dailyReadingSourceCandidateSchema,
 type DailyReadingSourceCandidate,
 type DailyReadingTopic,
} from "./daily-reading.schemas";
import {
 canonicalDailyReadingUrl,
 dailyReadingSourceRegistry,
 isAllowedDailyReadingDomain,
 isEligibleDailyReadingTitle,
 publisherForDailyReadingDomain,
 resolveDailyReadingTopic,
 scoreDailyReadingMetadata,
 type DailyReadingSourceMetadata,
} from "./daily-reading-source-policy.server";
import {
 extractDailyReadingSourceDocument,
 parseDailyReadingListing,
 parseDailyReadingRss,
} from "./daily-reading-source-parsers.server";

const maximumHtmlBytes = 2_000_000;
const officialTimeoutMilliseconds = 6_000;
const articleTimeoutMilliseconds = 7_000;
const gdeltTimeoutMilliseconds = 7_000;
const maximumExtractionCandidates = 8;
const extractionBatchSize = 4;

const gdeltResponseSchema = z.looseObject({
 articles: z
  .array(
   z.looseObject({
    title: z.string().default(""),
    url: z.string().default(""),
    seendate: z.string().default(""),
   }),
  )
  .default([]),
});

type SourceFetchFailure = "timeout" | "http" | "content-type" | "too-large" | "unreadable";
type ExtractionFailure = SourceFetchFailure | "parse" | "domain";
type DiscoveryAttempt = { metadata: DailyReadingSourceMetadata[]; note: string; ok: boolean };
type TextFetchResult =
 | {
    failure: null;
    contentType: string;
    finalUrl: string;
    text: string;
   }
 | { failure: SourceFetchFailure };
type ExtractionResult =
 | { source: DailyReadingSourceCandidate; failure: null }
 | { source: null; failure: ExtractionFailure };

export type DailyReadingSourceDiscoveryReport = {
 discoveryEndpoints: number;
 discoveryResponses: number;
 metadataCandidates: number;
 attemptedExtractions: number;
 extractionFailures: Readonly<Record<ExtractionFailure, number>>;
 notes: readonly string[];
};

function createDecoder(contentType: string) {
 const charset = /charset\s*=\s*["']?([^;"'\s]+)/iu.exec(contentType)?.[1]?.toLowerCase() ?? "utf-8";
 try {
  return new TextDecoder(charset === "gbk" || charset === "gb2312" ? "gb18030" : charset);
 } catch {
  return new TextDecoder("utf-8");
 }
}

async function readLimitedText(response: Response) {
 const declared = Number(response.headers.get("content-length") ?? "0");
 if (declared > maximumHtmlBytes || response.body === null) return null;
 const reader = response.body.getReader();
 const decoder = createDecoder(response.headers.get("content-type") ?? "");
 let bytes = 0;
 let text = "";
 while (true) {
  const result = await reader.read();
  if (result.done) break;
  bytes += result.value.byteLength;
  if (bytes > maximumHtmlBytes) {
   await reader.cancel();
   return null;
  }
  text += decoder.decode(result.value, { stream: true });
 }
 return text + decoder.decode();
}

async function fetchText(url: string, timeout: number, accept: string): Promise<TextFetchResult> {
 try {
  const response = await fetch(url, {
   cache: "no-store",
   headers: {
    Accept: accept,
    "User-Agent": "Mozilla/5.0 (compatible; HanziStudio/2.29; Chinese learning reader)",
   },
   redirect: "follow",
   signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) return { failure: "http" };
  const text = await readLimitedText(response);
  if (text === null) return { failure: "too-large" };
  return {
   failure: null,
   contentType: response.headers.get("content-type") ?? "",
   finalUrl: response.url,
   text,
  };
 } catch (error) {
  const timeoutFailure =
   error instanceof Error && (error.name === "TimeoutError" || /timeout|aborted/iu.test(error.message));
  return { failure: timeoutFailure ? "timeout" : "unreadable" };
 }
}

function chinaNewsRollingListingUrls(now = new Date()) {
 return Array.from({ length: 3 }, (_value, offset) => {
  const date = new Date(now.getTime() - offset * 86_400_000);
  const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric" }).format(date);
  const monthDay = new Intl.DateTimeFormat("en", {
   timeZone: "Asia/Shanghai",
   month: "2-digit",
   day: "2-digit",
  })
   .format(date)
   .replace("/", "");
  return `https://www.chinanews.com.cn/scroll-news/${year}/${monthDay}/news.shtml`;
 });
}

async function discoverOfficialSources(recentTopics: readonly DailyReadingTopic[]) {
 const rssRequests = dailyReadingSourceRegistry.flatMap((entry) =>
  entry.rssUrls.map(async (url): Promise<DiscoveryAttempt> => {
   const fetched = await fetchText(url, officialTimeoutMilliseconds, "application/rss+xml,application/xml,text/xml,*/*");
   if (fetched.failure !== null) return { metadata: [], note: `rss:${entry.id}:${fetched.failure}`, ok: false };
   return { metadata: parseDailyReadingRss(fetched.text, recentTopics), note: `rss:${entry.id}:ok`, ok: true };
  }),
 );
 const listings = [
  ...dailyReadingSourceRegistry.flatMap((entry) => entry.listingUrls.map((url) => ({ id: entry.id, url }))),
  ...chinaNewsRollingListingUrls().map((url) => ({ id: "chinanews-daily", url })),
 ];
 const listingRequests = listings.map(async ({ id, url }): Promise<DiscoveryAttempt> => {
  const fetched = await fetchText(url, officialTimeoutMilliseconds, "text/html,application/xhtml+xml");
  if (fetched.failure !== null) return { metadata: [], note: `listing:${id}:${fetched.failure}`, ok: false };
  return {
   metadata: parseDailyReadingListing(fetched.text, fetched.finalUrl || url, recentTopics),
   note: `listing:${id}:ok`,
   ok: true,
  };
 });
 return Promise.all([...rssRequests, ...listingRequests]);
}

function parseGdeltDate(value: string) {
 const compact = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/u.exec(value);
 if (compact !== null) {
  const [, year = "", month = "", day = "", hour = "", minute = "", second = ""] = compact;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
 }
 const date = new Date(value);
 return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseGdeltPayload(text: string) {
 try {
  const result = gdeltResponseSchema.safeParse(JSON.parse(text));
  return result.success ? result.data : null;
 } catch {
  return null;
 }
}

async function discoverGdelt(recentTopics: readonly DailyReadingTopic[]): Promise<DiscoveryAttempt> {
 const endpoint = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
 endpoint.searchParams.set(
  "query",
  '("博物馆" OR "文化" OR "教育" OR "历史" OR "科学" OR "生态" OR "旅游" OR "语言" OR "阅读") sourcelang:Chinese',
 );
 endpoint.searchParams.set("mode", "artlist");
 endpoint.searchParams.set("format", "json");
 endpoint.searchParams.set("maxrecords", "75");
 endpoint.searchParams.set("sort", "hybridrel");
 endpoint.searchParams.set("timespan", "7d");
 const fetched = await fetchText(endpoint.toString(), gdeltTimeoutMilliseconds, "application/json");
 if (fetched.failure !== null) return { metadata: [], note: `gdelt:${fetched.failure}`, ok: false };
 const payload = parseGdeltPayload(fetched.text);
 if (payload === null) return { metadata: [], note: "gdelt:invalid-json", ok: false };
 const metadata = payload.articles.flatMap((article): DailyReadingSourceMetadata[] => {
  const titleZh = article.title.replace(/\s+/gu, " ").trim();
  if (!isEligibleDailyReadingTitle(titleZh)) return [];
  const url = canonicalDailyReadingUrl(article.url);
  const publishedAt = parseGdeltDate(article.seendate);
  if (url === null || publishedAt === null) return [];
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (ageDays < -1 || ageDays > 14) return [];
  const topic = resolveDailyReadingTopic(titleZh);
  return [
   {
    discoveryKind: "gdelt",
    titleZh,
    publisher: publisherForDailyReadingDomain(new URL(url).hostname),
    url,
    publishedAt,
    topic,
    score: scoreDailyReadingMetadata(titleZh, topic, publishedAt, recentTopics, "gdelt"),
   },
  ];
 });
 return { metadata, note: "gdelt:ok", ok: true };
}

function deduplicateMetadata(candidates: readonly DailyReadingSourceMetadata[], excludedUrls: readonly string[]) {
 const excluded = new Set(
  excludedUrls.flatMap((url) => {
   const canonical = canonicalDailyReadingUrl(url);
   return canonical === null ? [] : [canonical];
  }),
 );
 const byUrl = new Map<string, DailyReadingSourceMetadata>();
 for (const candidate of candidates) {
  if (excluded.has(candidate.url)) continue;
  const previous = byUrl.get(candidate.url);
  if (previous === undefined || candidate.score > previous.score) byUrl.set(candidate.url, candidate);
 }
 return [...byUrl.values()].sort((left, right) => right.score - left.score).slice(0, maximumExtractionCandidates);
}

function emptyFailureCounts(): Record<ExtractionFailure, number> {
 return { timeout: 0, http: 0, "content-type": 0, "too-large": 0, unreadable: 0, parse: 0, domain: 0 };
}

async function extractCandidate(metadata: DailyReadingSourceMetadata): Promise<ExtractionResult> {
 const fetched = await fetchText(metadata.url, articleTimeoutMilliseconds, "text/html,application/xhtml+xml");
 if (fetched.failure !== null) return { source: null, failure: fetched.failure };
 if (!fetched.contentType.includes("text/html")) return { source: null, failure: "content-type" };
 const finalUrl = canonicalDailyReadingUrl(fetched.finalUrl || metadata.url);
 if (finalUrl === null || !isAllowedDailyReadingDomain(new URL(finalUrl).hostname)) {
  return { source: null, failure: "domain" };
 }
 const document = extractDailyReadingSourceDocument(fetched.text);
 if (document === null) return { source: null, failure: "parse" };
 return {
  source: dailyReadingSourceCandidateSchema.parse({
   titleZh: metadata.titleZh,
   publisher: metadata.publisher,
   url: finalUrl,
   publishedAt: document.pagePublishedAt || metadata.publishedAt,
   topic: metadata.topic,
   extractedTextZh: document.extractedTextZh,
  }),
  failure: null,
 };
}

export async function discoverDailyReadingSource(
 excludedUrls: readonly string[],
 recentTopics: readonly DailyReadingTopic[],
 onProgress?: (stage: "discovering" | "extracting") => void,
): Promise<{ source: DailyReadingSourceCandidate | null; report: DailyReadingSourceDiscoveryReport }> {
 onProgress?.("discovering");
 const [official, gdelt] = await Promise.all([discoverOfficialSources(recentTopics), discoverGdelt(recentTopics)]);
 const attempts = [...official, gdelt];
 const candidates = deduplicateMetadata(attempts.flatMap((attempt) => attempt.metadata), excludedUrls);
 const failures = emptyFailureCounts();
 let attemptedExtractions = 0;
 onProgress?.("extracting");
 for (let index = 0; index < candidates.length; index += extractionBatchSize) {
  const batch = candidates.slice(index, index + extractionBatchSize);
  const results = await Promise.all(batch.map(extractCandidate));
  attemptedExtractions += results.length;
  for (const result of results) {
   if (result.failure !== null) failures[result.failure] += 1;
  }
  const success = results.find((result) => result.source !== null)?.source ?? null;
  if (success !== null) {
   return {
    source: success,
    report: {
     discoveryEndpoints: attempts.length,
     discoveryResponses: attempts.filter((attempt) => attempt.ok).length,
     metadataCandidates: candidates.length,
     attemptedExtractions,
     extractionFailures: failures,
     notes: attempts.map((attempt) => attempt.note),
    },
   };
  }
 }
 return {
  source: null,
  report: {
   discoveryEndpoints: attempts.length,
   discoveryResponses: attempts.filter((attempt) => attempt.ok).length,
   metadataCandidates: candidates.length,
   attemptedExtractions,
   extractionFailures: failures,
   notes: attempts.map((attempt) => attempt.note),
  },
 };
}

export function formatDailyReadingSourceReport(report: DailyReadingSourceDiscoveryReport) {
 const failures = Object.entries(report.extractionFailures)
  .filter(([, count]) => count > 0)
  .map(([key, count]) => `${key}:${count}`)
  .join(",");
 return [
  `discovery ${report.discoveryResponses}/${report.discoveryEndpoints}`,
  `candidates ${report.metadataCandidates}`,
  `extracted ${report.attemptedExtractions}`,
  failures ? `failures ${failures}` : "",
 ]
  .filter(Boolean)
  .join("; ");
}
