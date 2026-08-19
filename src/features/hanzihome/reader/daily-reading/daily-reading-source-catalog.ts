import { z } from "zod";

export const dailyReadingSourceIdSchema = z.enum([
 "chinanews",
 "xinhua",
 "people",
 "china",
 "cctv",
 "gmw",
 "ce",
 "youth",
 "cnr",
 "gov",
]);

export type DailyReadingSourceId = z.output<typeof dailyReadingSourceIdSchema>;

export type DailyReadingSourceCatalogEntry = {
 id: DailyReadingSourceId;
 publisherLabelZh: string;
 domains: readonly string[];
};

export const dailyReadingSourceCatalog: readonly DailyReadingSourceCatalogEntry[] = [
 {
  id: "chinanews",
  publisherLabelZh: "中国新闻网",
  domains: ["chinanews.com.cn"],
 },
 {
  id: "xinhua",
  publisherLabelZh: "新华网",
  domains: ["xinhuanet.com", "news.cn"],
 },
 {
  id: "people",
  publisherLabelZh: "人民网",
  domains: ["people.com.cn"],
 },
 {
  id: "china",
  publisherLabelZh: "中国网",
  domains: ["china.com.cn"],
 },
 {
  id: "cctv",
  publisherLabelZh: "央视网",
  domains: ["cctv.com"],
 },
 {
  id: "gmw",
  publisherLabelZh: "光明网",
  domains: ["gmw.cn"],
 },
 {
  id: "ce",
  publisherLabelZh: "中国经济网",
  domains: ["ce.cn"],
 },
 {
  id: "youth",
  publisherLabelZh: "中国青年网",
  domains: ["youth.cn"],
 },
 {
  id: "cnr",
  publisherLabelZh: "央广网",
  domains: ["cnr.cn"],
 },
 {
  id: "gov",
  publisherLabelZh: "中国政府网",
  domains: ["gov.cn"],
 },
];

export const defaultDailyReadingSourceIds: readonly DailyReadingSourceId[] =
 dailyReadingSourceCatalog.map((source) => source.id);

export function findDailyReadingSourceByHostname(
 hostname: string,
): DailyReadingSourceCatalogEntry | null {
 const normalized = hostname.toLowerCase();
 return (
  dailyReadingSourceCatalog.find((source) =>
   source.domains.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`),
   ),
  ) ?? null
 );
}

export function domainsForDailyReadingSources(sourceIds: readonly DailyReadingSourceId[]) {
 const selected = new Set(sourceIds);
 return dailyReadingSourceCatalog.flatMap((source) =>
  selected.has(source.id) ? source.domains : [],
 );
}
