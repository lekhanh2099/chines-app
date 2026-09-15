import { normalizeSearchText } from "./normalize";
import type {
 HanziHomeSearchIndexItem,
 HanziHomeSearchOptions,
 HanziHomeSearchResult,
} from "./types";

type NormalizedCacheEntry = {
 title: string;
 subtitle: string;
};

const normalizedCache = new WeakMap<HanziHomeSearchIndexItem, NormalizedCacheEntry>();

function getNormalized(item: HanziHomeSearchIndexItem): NormalizedCacheEntry {
 const cached = normalizedCache.get(item);
 if (cached) return cached;

 const entry: NormalizedCacheEntry = {
  title: normalizeSearchText(item.title),
  subtitle: normalizeSearchText(item.subtitle ?? ""),
 };
 normalizedCache.set(item, entry);
 return entry;
}

function extractMatchedSnippet(originalText: string, query: string): string | undefined {
 if (!originalText || !query) return undefined;
 const lowerText = originalText.toLowerCase();
 const lowerQuery = query.toLowerCase();
 const idx = lowerText.indexOf(lowerQuery);
 if (idx === -1) return undefined;

 const start = Math.max(0, idx - 25);
 const end = Math.min(originalText.length, idx + query.length + 45);

 let snippet = originalText.slice(start, end).replace(/\s+/g, " ").trim();
 if (start > 0) snippet = "..." + snippet;
 if (end < originalText.length) snippet = snippet + "...";

 return snippet;
}

function scoreItem(
 item: HanziHomeSearchIndexItem,
 query: string,
 rawQuery: string,
 options: HanziHomeSearchOptions,
): { score: number; matchedSnippet?: string } {
 const { title, subtitle } = getNormalized(item);
 const searchText = item.searchText;
 let score = 0;
 let matchedSnippet: string | undefined;

 if (title === query) {
  score += 2_000;
  if (item.kind === "vocab") score += 1_000;
  if (item.kind === "grammar") score += 800;
 } else if (title.startsWith(query)) {
  score += 1_200;
  if (item.kind === "vocab") score += 600;
  if (item.kind === "grammar") score += 500;
 } else if (title.includes(query)) {
  score += 750;
  if (item.kind === "vocab") score += 350;
  if (item.kind === "grammar") score += 250;
 }

 if (subtitle.includes(query)) {
  score += 250;
 }

 if (searchText.includes(query)) {
  score += 150;
  const shouldShowSnippet =
   item.kind === "exercise" || item.kind === "lesson_text" || item.kind === "note";
  if (!title.includes(query) && shouldShowSnippet) {
   matchedSnippet =
    extractMatchedSnippet(item.searchText, rawQuery) ||
    extractMatchedSnippet(item.searchText, query);
  }
 }

 if (options.lessonId && item.lessonId === options.lessonId) score += 120;
 if (options.courseId && item.courseId === options.courseId) score += 40;

 return { score, matchedSnippet };
}

export function searchHanziHomeIndex(
 index: HanziHomeSearchIndexItem[],
 rawQuery: string,
 options: HanziHomeSearchOptions = {},
): HanziHomeSearchResult[] {
 const query = normalizeSearchText(rawQuery);
 const trimmedRaw = rawQuery.trim();
 if (!query) return [];

 const kindFilter = options.kinds ? new Set(options.kinds) : null;
 const limit = options.limit ?? 40;
 const results: HanziHomeSearchResult[] = [];

 for (const item of index) {
  if (kindFilter && !kindFilter.has(item.kind)) continue;
  if (options.lessonId && !options.includeGlobal && item.lessonId !== options.lessonId) continue;
  if (options.courseId && !options.includeGlobal && item.courseId !== options.courseId) continue;

  const { score, matchedSnippet } = scoreItem(item, query, trimmedRaw, options);
  if (score > 0) results.push({ item, score, matchedSnippet });
 }

 return results
  .sort(
   (left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title),
  )
  .slice(0, limit);
}
