import "server-only";

import { z } from "zod";

import {
 dailyReadingSourceCandidateSchema,
 type DailyReadingSourceCandidate,
 type DailyReadingTopic,
} from "./daily-reading.schemas";
import type { ResolvedDailyReadingCollectionPolicy } from "./daily-reading-collection-policy";
import {
 defaultDailyReadingSourceIds,
 domainsForDailyReadingSources,
 findDailyReadingSourceByHostname,
} from "./daily-reading-source-catalog";
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
 type DailyReadingExtractionMethod,
} from "./daily-reading-source-parsers.server";
import {
 assessDailyReadingSourceQuality,
 dailyReadingFinalSelectionScore,
 type DailyReadingSourceQuality,
 type DailyReadingSourceQualityRejection,
} from "./daily-reading-source-quality";

const maximumHtmlBytes = 2_000_000;
const officialTimeoutMilliseconds = 6_000;
const articleTimeoutMilliseconds = 7_000;
const gdeltTimeoutMilliseconds = 7_000;
const maximumExtractionCandidatesPerWindow = 24;
const extractionBatchSize = 4;
const minimumSuccessfulCandidatesBeforeStop = 3;
const legacyEvidenceCharacterLimit = 15_500;

const allTopics: readonly DailyReadingTopic[] = [
 "culture",
 "education",
 "history",
 "language",
 "science",
 "society",
 "travel",
 "environment",
 "health",
];

const gdeltTerms: Readonly<Record<DailyReadingTopic, readonly string[]>> = {
 culture: ["博物馆", "文化", "艺术", "非遗", "文物"],
 education: ["教育", "学校", "学生", "课堂", "学习"],
 history: ["历史", "古代", "遗址", "传统", "古籍"],
 language: ["语言", "汉语", "文字", "方言", "阅读"],
 science: ["科技", "科学", "研究", "实验", "航天"],
 society: ["生活", "青年", "城市", "社区"],
 travel: ["旅游", "景区", "公园", "乡村"],
 environment: ["生态", "环保", "自然", "森林", "湿地"],
 health: ["健康", "运动", "营养", "睡眠"],
};

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
type ExtractionFailure = SourceFetchFailure | "parse" | "domain" | "quality";
type DiscoveryAttempt = { metadata: DailyReadingSourceMetadata[]; note: string; ok: boolean };
type TextFetchResult =
 | {
    failure: null;
    contentType: string;
    finalUrl: string;
    text: string;
   }
 | { failure: SourceFetchFailure };
export type DailyReadingSourceAcquisitionPolicy = Pick<
 ResolvedDailyReadingCollectionPolicy,
 | "freshness"
 | "selectedTopics"
 | "selectedSources"
 | "allowedDomains"
 | "preferredLength"
 | "recentTopics"
 | "excludedSourceUrls"
>;
type SuccessfulExtraction = {
 source: DailyReadingSourceCandidate;
 paragraphsZh: readonly string[];
 extractionMethod: DailyReadingExtractionMethod;
 quality: DailyReadingSourceQuality;
 metadataScore: number;
 finalScore: number;
};
type ExtractionResult =
 | { selection: SuccessfulExtraction; failure: null; qualityRejection: null }
 | {
    selection: null;
    failure: ExtractionFailure;
    qualityRejection: DailyReadingSourceQualityRejection | null;
   };

export type DailyReadingSelectedSource = SuccessfulExtraction;

export type DailyReadingSourceDiscoveryReport = {
 discoveryEndpoints: number;
 discoveryResponses: number;
 metadataCandidates: number;
 policyCandidates: number;
 attemptedExtractions: number;
 extractionFailures: Readonly<Record<ExtractionFailure, number>>;
 qualityRejections: Readonly<Record<DailyReadingSourceQualityRejection, number>>;
 selectedFinalScore: number | null;
 usedFreshnessDays: number | null;
 notes: readonly string[];
};

function createDecoder(contentType: string) {
 const charset =
  /charset\s*=\s*["']?([^;"'\s]+)/iu.exec(contentType)?.[1]?.toLowerCase() ?? "utf-8";
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
   error instanceof Error &&
   (error.name === "TimeoutError" || /timeout|aborted/iu.test(error.message));
  return { failure: timeoutFailure ? "timeout" : "unreadable" };
 }
}

function chinaNewsRollingListingUrls(now = new Date()) {
 return Array.from({ length: 3 }, (_value, offset) => {
  const date = new Date(now.getTime() - offset * 86_400_000);
  const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric" }).format(
   date,
  );
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

function maximumDiscoveryFreshnessDays(policy: DailyReadingSourceAcquisitionPolicy) {
 return policy.freshness.fallbackDays ?? policy.freshness.primaryDays;
}

async function discoverOfficialSources(policy: DailyReadingSourceAcquisitionPolicy) {
 const selectedSources = new Set(policy.selectedSources);
 const registry = dailyReadingSourceRegistry.filter((entry) => selectedSources.has(entry.id));
 const rssRequests = registry.flatMap((entry) =>
  entry.rssUrls.map(async (url): Promise<DiscoveryAttempt> => {
   const fetched = await fetchText(
    url,
    officialTimeoutMilliseconds,
    "application/rss+xml,application/xml,text/xml,*/*",
   );
   if (fetched.failure !== null)
    return { metadata: [], note: `rss:${entry.id}:${fetched.failure}`, ok: false };
   return {
    metadata: parseDailyReadingRss(fetched.text, policy.recentTopics),
    note: `rss:${entry.id}:ok`,
    ok: true,
   };
  }),
 );
 const listings = [
  ...registry.flatMap((entry) => entry.listingUrls.map((url) => ({ id: entry.id, url }))),
  ...(selectedSources.has("chinanews")
   ? chinaNewsRollingListingUrls().map((url) => ({ id: "chinanews-daily", url }))
   : []),
 ];
 const listingRequests = listings.map(async ({ id, url }): Promise<DiscoveryAttempt> => {
  const fetched = await fetchText(
   url,
   officialTimeoutMilliseconds,
   "text/html,application/xhtml+xml",
  );
  if (fetched.failure !== null)
   return { metadata: [], note: `listing:${id}:${fetched.failure}`, ok: false };
  return {
   metadata: parseDailyReadingListing(fetched.text, fetched.finalUrl || url, policy.recentTopics),
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

function gdeltQueryForTopics(topics: readonly DailyReadingTopic[]) {
 const terms: string[] = [];
 for (const topic of topics) {
  for (const term of gdeltTerms[topic]) {
   if (!terms.includes(term)) terms.push(term);
  }
 }
 return `(${terms.map((term) => `"${term}"`).join(" OR ")}) sourcelang:Chinese`;
}

async function discoverGdelt(
 policy: DailyReadingSourceAcquisitionPolicy,
): Promise<DiscoveryAttempt> {
 const endpoint = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
 endpoint.searchParams.set("query", gdeltQueryForTopics(policy.selectedTopics));
 endpoint.searchParams.set("mode", "artlist");
 endpoint.searchParams.set("format", "json");
 endpoint.searchParams.set("maxrecords", "75");
 endpoint.searchParams.set("sort", "hybridrel");
 endpoint.searchParams.set("timespan", `${maximumDiscoveryFreshnessDays(policy)}d`);
 const fetched = await fetchText(endpoint.toString(), gdeltTimeoutMilliseconds, "application/json");
 if (fetched.failure !== null) return { metadata: [], note: `gdelt:${fetched.failure}`, ok: false };
 const payload = parseGdeltPayload(fetched.text);
 if (payload === null) return { metadata: [], note: "gdelt:invalid-json", ok: false };
 const maximumFreshness = maximumDiscoveryFreshnessDays(policy);
 const metadata = payload.articles.flatMap((article): DailyReadingSourceMetadata[] => {
  const titleZh = article.title.replace(/\s+/gu, " ").trim();
  if (!isEligibleDailyReadingTitle(titleZh)) return [];
  const url = canonicalDailyReadingUrl(article.url);
  const publishedAt = parseGdeltDate(article.seendate);
  if (url === null || publishedAt === null) return [];
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (ageDays < -1 || ageDays > maximumFreshness) return [];
  const topic = resolveDailyReadingTopic(titleZh);
  return [
   {
    discoveryKind: "gdelt",
    titleZh,
    publisher: publisherForDailyReadingDomain(new URL(url).hostname),
    url,
    publishedAt,
    topic,
    score: scoreDailyReadingMetadata(titleZh, topic, publishedAt, policy.recentTopics, "gdelt"),
   },
  ];
 });
 return { metadata, note: "gdelt:ok", ok: true };
}

function canonicalExcludedUrls(urls: readonly string[]) {
 return new Set(
  urls.flatMap((url) => {
   const canonical = canonicalDailyReadingUrl(url);
   return canonical === null ? [] : [canonical];
  }),
 );
}

function isDomainAllowedForPolicy(hostname: string, allowedDomains: readonly string[]) {
 const normalized = hostname.toLowerCase();
 return allowedDomains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

function metadataMatchesPolicy(
 candidate: DailyReadingSourceMetadata,
 policy: DailyReadingSourceAcquisitionPolicy,
 freshnessDays: number,
) {
 const url = new URL(candidate.url);
 const source = findDailyReadingSourceByHostname(url.hostname);
 if (source === null || !policy.selectedSources.includes(source.id)) return false;
 if (!isDomainAllowedForPolicy(url.hostname, policy.allowedDomains)) return false;
 if (!policy.selectedTopics.includes(candidate.topic)) return false;
 const ageDays = (Date.now() - new Date(candidate.publishedAt).getTime()) / 86_400_000;
 return ageDays >= -1 && ageDays <= freshnessDays;
}

function deduplicateMetadata(
 candidates: readonly DailyReadingSourceMetadata[],
 excludedUrls: ReadonlySet<string>,
) {
 const byUrl = new Map<string, DailyReadingSourceMetadata>();
 for (const candidate of candidates) {
  if (excludedUrls.has(candidate.url)) continue;
  const previous = byUrl.get(candidate.url);
  if (previous === undefined || candidate.score > previous.score)
   byUrl.set(candidate.url, candidate);
 }
 return [...byUrl.values()].sort((left, right) => right.score - left.score);
}

function emptyFailureCounts(): Record<ExtractionFailure, number> {
 return {
  timeout: 0,
  http: 0,
  "content-type": 0,
  "too-large": 0,
  unreadable: 0,
  parse: 0,
  domain: 0,
  quality: 0,
 };
}

function emptyQualityRejections(): Record<DailyReadingSourceQualityRejection, number> {
 return {
  "too-short": 0,
  "too-few-paragraphs": 0,
  "low-chinese-density": 0,
  "incoherent-paragraphs": 0,
  truncated: 0,
  "title-body-mismatch": 0,
  "date-mismatch": 0,
  stale: 0,
  "future-date": 0,
 };
}

async function extractCandidate(
 metadata: DailyReadingSourceMetadata,
 policy: DailyReadingSourceAcquisitionPolicy,
 freshnessDays: number,
): Promise<ExtractionResult> {
 const fetched = await fetchText(
  metadata.url,
  articleTimeoutMilliseconds,
  "text/html,application/xhtml+xml",
 );
 if (fetched.failure !== null)
  return { selection: null, failure: fetched.failure, qualityRejection: null };
 if (!fetched.contentType.includes("text/html"))
  return { selection: null, failure: "content-type", qualityRejection: null };
 const finalUrl = canonicalDailyReadingUrl(fetched.finalUrl || metadata.url);
 if (finalUrl === null || !isAllowedDailyReadingDomain(new URL(finalUrl).hostname)) {
  return { selection: null, failure: "domain", qualityRejection: null };
 }
 if (!isDomainAllowedForPolicy(new URL(finalUrl).hostname, policy.allowedDomains)) {
  return { selection: null, failure: "domain", qualityRejection: null };
 }
 const document = extractDailyReadingSourceDocument(fetched.text);
 if (document === null) return { selection: null, failure: "parse", qualityRejection: null };
 const publishedAt = document.pagePublishedAt || metadata.publishedAt;
 const quality = assessDailyReadingSourceQuality({
  document,
  metadataTitleZh: metadata.titleZh,
  metadataPublishedAt: metadata.publishedAt,
  preferredLength: policy.preferredLength,
  maximumFreshnessDays: freshnessDays,
 });
 if (!quality.accepted) {
  return {
   selection: null,
   failure: "quality",
   qualityRejection: quality.rejection,
  };
 }
 const legacyEvidence = document.extractedTextZh.slice(0, legacyEvidenceCharacterLimit).trim();
 const source = dailyReadingSourceCandidateSchema.parse({
  titleZh: metadata.titleZh,
  publisher: metadata.publisher,
  url: finalUrl,
  publishedAt,
  topic: metadata.topic,
  extractedTextZh: legacyEvidence,
 });
 return {
  selection: {
   source,
   paragraphsZh: document.paragraphsZh,
   extractionMethod: document.extractionMethod,
   quality,
   metadataScore: metadata.score,
   finalScore: dailyReadingFinalSelectionScore(metadata.score, quality.score),
  },
  failure: null,
  qualityRejection: null,
 };
}

async function extractAndRankCandidates(input: {
 candidates: readonly DailyReadingSourceMetadata[];
 policy: DailyReadingSourceAcquisitionPolicy;
 freshnessDays: number;
 failures: Record<ExtractionFailure, number>;
 qualityRejections: Record<DailyReadingSourceQualityRejection, number>;
 attemptedUrls: Set<string>;
}) {
 const candidates = input.candidates
  .filter((candidate) => !input.attemptedUrls.has(candidate.url))
  .slice(0, maximumExtractionCandidatesPerWindow);
 const selections: SuccessfulExtraction[] = [];
 let attemptedExtractions = 0;

 for (let index = 0; index < candidates.length; index += extractionBatchSize) {
  const batch = candidates.slice(index, index + extractionBatchSize);
  for (const candidate of batch) input.attemptedUrls.add(candidate.url);
  const results = await Promise.all(
   batch.map((candidate) => extractCandidate(candidate, input.policy, input.freshnessDays)),
  );
  attemptedExtractions += results.length;
  for (const result of results) {
   if (result.failure !== null) input.failures[result.failure] += 1;
   if (result.qualityRejection !== null) input.qualityRejections[result.qualityRejection] += 1;
   if (result.selection !== null) selections.push(result.selection);
  }
  if (selections.length >= minimumSuccessfulCandidatesBeforeStop) break;
 }

 selections.sort((left, right) => {
  if (right.finalScore !== left.finalScore) return right.finalScore - left.finalScore;
  const dateOrder = right.source.publishedAt.localeCompare(left.source.publishedAt);
  if (dateOrder !== 0) return dateOrder;
  return left.source.url.localeCompare(right.source.url);
 });
 return { selected: selections[0] ?? null, attemptedExtractions };
}

function legacySourcePolicy(
 excludedUrls: readonly string[],
 recentTopics: readonly DailyReadingTopic[],
): DailyReadingSourceAcquisitionPolicy {
 return {
  freshness: {
   primaryDays: 14,
   fallbackDays: null,
   noMatchBehavior: "skip-day",
  },
  selectedTopics: allTopics,
  selectedSources: defaultDailyReadingSourceIds,
  allowedDomains: domainsForDailyReadingSources(defaultDailyReadingSourceIds),
  preferredLength: "any",
  recentTopics,
  excludedSourceUrls: excludedUrls,
 };
}

export async function discoverDailyReadingSourceWithPolicy(
 policy: DailyReadingSourceAcquisitionPolicy,
 onProgress?: (stage: "discovering" | "extracting") => void,
): Promise<{
 source: DailyReadingSourceCandidate | null;
 selection: DailyReadingSelectedSource | null;
 report: DailyReadingSourceDiscoveryReport;
}> {
 onProgress?.("discovering");
 const [official, gdelt] = await Promise.all([
  discoverOfficialSources(policy),
  discoverGdelt(policy),
 ]);
 const attempts = [...official, gdelt];
 const excludedUrls = canonicalExcludedUrls(policy.excludedSourceUrls);
 const metadata = deduplicateMetadata(
  attempts.flatMap((attempt) => attempt.metadata),
  excludedUrls,
 );
 const failures = emptyFailureCounts();
 const qualityRejections = emptyQualityRejections();
 const attemptedUrls = new Set<string>();
 let attemptedExtractions = 0;
 let policyCandidates = 0;
 let selected: SuccessfulExtraction | null = null;
 let usedFreshnessDays: number | null = null;

 onProgress?.("extracting");
 const windows = [
  policy.freshness.primaryDays,
  ...(policy.freshness.fallbackDays === null ? [] : [policy.freshness.fallbackDays]),
 ];
 for (const freshnessDays of windows) {
  const candidates = metadata.filter((candidate) =>
   metadataMatchesPolicy(candidate, policy, freshnessDays),
  );
  policyCandidates += candidates.filter((candidate) => !attemptedUrls.has(candidate.url)).length;
  const extracted = await extractAndRankCandidates({
   candidates,
   policy,
   freshnessDays,
   failures,
   qualityRejections,
   attemptedUrls,
  });
  attemptedExtractions += extracted.attemptedExtractions;
  if (extracted.selected !== null) {
   selected = extracted.selected;
   usedFreshnessDays = freshnessDays;
   break;
  }
 }

 return {
  source: selected?.source ?? null,
  selection: selected,
  report: {
   discoveryEndpoints: attempts.length,
   discoveryResponses: attempts.filter((attempt) => attempt.ok).length,
   metadataCandidates: metadata.length,
   policyCandidates,
   attemptedExtractions,
   extractionFailures: failures,
   qualityRejections,
   selectedFinalScore: selected?.finalScore ?? null,
   usedFreshnessDays,
   notes: attempts.map((attempt) => attempt.note),
  },
 };
}

export async function discoverDailyReadingSource(
 excludedUrls: readonly string[],
 recentTopics: readonly DailyReadingTopic[],
 onProgress?: (stage: "discovering" | "extracting") => void,
) {
 return discoverDailyReadingSourceWithPolicy(
  legacySourcePolicy(excludedUrls, recentTopics),
  onProgress,
 );
}

export function formatDailyReadingSourceReport(report: DailyReadingSourceDiscoveryReport) {
 const failures = Object.entries(report.extractionFailures)
  .filter(([, count]) => count > 0)
  .map(([key, count]) => `${key}:${count}`)
  .join(",");
 const quality = Object.entries(report.qualityRejections)
  .filter(([, count]) => count > 0)
  .map(([key, count]) => `${key}:${count}`)
  .join(",");
 return [
  `discovery ${report.discoveryResponses}/${report.discoveryEndpoints}`,
  `candidates ${report.metadataCandidates}`,
  `policy ${report.policyCandidates}`,
  `extracted ${report.attemptedExtractions}`,
  report.usedFreshnessDays === null ? "" : `window ${report.usedFreshnessDays}d`,
  failures ? `failures ${failures}` : "",
  quality ? `quality ${quality}` : "",
 ]
  .filter(Boolean)
  .join("; ");
}
