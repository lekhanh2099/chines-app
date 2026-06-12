import { normalizeSearchText } from "./normalize";
import type {
 HanziHomeSearchIndexItem,
 HanziHomeSearchOptions,
 HanziHomeSearchResult,
} from "./types";

function scoreItem(item: HanziHomeSearchIndexItem, query: string, options: HanziHomeSearchOptions) {
 const title = normalizeSearchText(item.title);
 const subtitle = normalizeSearchText(item.subtitle ?? "");
 const searchText = item.searchText;
 let score = 0;

 if (title === query) score += 1_000;
 else if (title.startsWith(query)) score += 650;
 else if (title.includes(query)) score += 420;

 if (subtitle.includes(query)) score += 110;
 if (searchText.includes(query)) score += 180;

 if (item.kind === "vocab" && title === query) score += 300;
 if (item.kind === "grammar" && title === query) score += 250;
 if (options.lessonId && item.lessonId === options.lessonId) score += 90;
 if (options.courseId && item.courseId === options.courseId) score += 35;

 return score;
}

export function searchHanziHomeIndex(
 index: HanziHomeSearchIndexItem[],
 rawQuery: string,
 options: HanziHomeSearchOptions = {},
): HanziHomeSearchResult[] {
 const query = normalizeSearchText(rawQuery);
 if (!query) return [];

 const kindFilter = options.kinds ? new Set(options.kinds) : null;
 const limit = options.limit ?? 40;
 const results: HanziHomeSearchResult[] = [];

 for (const item of index) {
  if (kindFilter && !kindFilter.has(item.kind)) continue;
  if (options.lessonId && !options.includeGlobal && item.lessonId !== options.lessonId) continue;
  if (options.courseId && !options.includeGlobal && item.courseId !== options.courseId) continue;

  const score = scoreItem(item, query, options);
  if (score > 0) results.push({ item, score });
 }

 return results
  .sort(
   (left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title),
  )
  .slice(0, limit);
}
