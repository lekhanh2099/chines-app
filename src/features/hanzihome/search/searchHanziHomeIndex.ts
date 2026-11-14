import { normalizeSearchText } from "./normalize";
import type {
 HanziHomeSearchCategory,
 HanziHomeSearchIndexItem,
 HanziHomeSearchOptions,
 HanziHomeSearchResult,
} from "./types";

function resultCategory(item: HanziHomeSearchIndexItem): HanziHomeSearchCategory {
 if (
  item.kind === "vocab" ||
  item.kind === "grammar" ||
  item.kind === "exercise" ||
  item.kind === "radical"
 )
  return item.kind;
 return "lesson";
}

export function countSearchResultCategories(results: readonly HanziHomeSearchResult[]) {
 const counts: Record<HanziHomeSearchCategory, number> = {
  all: results.length,
  vocab: 0,
  grammar: 0,
  exercise: 0,
  lesson: 0,
  radical: 0,
 };
 for (const result of results) counts[resultCategory(result.item)] += 1;
 return counts;
}

export function filterSearchResultCategory(
 results: readonly HanziHomeSearchResult[],
 category: HanziHomeSearchCategory,
) {
 return category === "all"
  ? results
  : results.filter((result) => resultCategory(result.item) === category);
}

export function selectSearchNavigationItems(
 index: readonly HanziHomeSearchIndexItem[],
 options: HanziHomeSearchOptions,
) {
 return index
  .filter(
   (item) =>
    item.kind === "navigation" &&
    (!item.lessonId || item.lessonId === options.lessonId || item.courseId === options.courseId),
  )
  .slice(0, 10);
}

export function splitSearchHighlight(text: string, rawQuery: string) {
 const query = rawQuery.trim();
 const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
 return index < 0
  ? { before: text, match: "", after: "" }
  : {
     before: text.slice(0, index),
     match: text.slice(index, index + query.length),
     after: text.slice(index + query.length),
    };
}

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

 if (score > 0) {
  if (options.lessonId && item.lessonId === options.lessonId) score += 120;
  if (options.courseId && item.courseId === options.courseId) score += 40;
 }

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
