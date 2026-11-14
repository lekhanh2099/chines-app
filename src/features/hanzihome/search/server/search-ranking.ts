import { normalizeSearchText } from "../normalize";
import { countSearchResultCategories, searchResultCategory } from "../search-results";
import type { HanziHomeSearchRequest, HanziHomeSearchResponse } from "../types";
import {
 searchEngine,
 type PreparedSearchQuery,
 type SearchEngine,
 type SearchHit,
} from "./search-engine";
import { buildSearchSnippet, textContainsNeedle } from "./search-snippet";

/** Kinds whose subtitle already carries the useful context, so a snippet would be noise. */
const SNIPPET_EXCLUDED_KINDS = new Set(["vocab", "radical", "navigation"]);
/** Hits re-checked for an adjacent multi-word phrase; the tail keeps its BM25 order. */
const PHRASE_RERANK_WINDOW = 300;
const PHRASE_MULTIPLIER = 3;

function byScore(left: SearchHit, right: SearchHit) {
 return (
  right.score - left.score || left.document.item.title.localeCompare(right.document.item.title)
 );
}

/** AND matching ignores word order; a multi-word query found verbatim ranks above scattered words. */
function boostPhraseHits(hits: SearchHit[], query: PreparedSearchQuery) {
 const [phrase] = query.needles.phrase;
 if (!phrase) return hits;
 const head = hits.slice(0, PHRASE_RERANK_WINDOW).map((hit) => {
  const { title, body } = hit.document;
  const text = normalizeSearchText(`${hit.document.item.title}\n${title}\n${body}`);
  return text.includes(phrase) ? { ...hit, score: hit.score * PHRASE_MULTIPLIER } : hit;
 });
 return [...head.sort(byScore), ...hits.slice(PHRASE_RERANK_WINDOW)];
}

function rankMultiplier(
 hit: SearchHit,
 query: PreparedSearchQuery,
 request: HanziHomeSearchRequest,
) {
 const { item } = hit.document;
 const prefersKind = item.kind === "vocab" || item.kind === "grammar";
 let multiplier = 1;
 const exactPinyin = hit.compactPinyin !== "" && hit.compactPinyin === query.terms.join("");
 if (hit.normalizedTitle === query.normalized || exactPinyin) multiplier *= prefersKind ? 6 : 4;
 else if (hit.normalizedTitle.startsWith(query.normalized)) multiplier *= prefersKind ? 2 : 1.6;
 if (request.lessonId && item.lessonId === request.lessonId) multiplier *= 1.3;
 else if (request.courseId && item.courseId === request.courseId) multiplier *= 1.1;
 return multiplier;
}

function toResult(hit: SearchHit, query: PreparedSearchQuery) {
 const { item, body } = hit.document;
 const needleTiers = [query.needles.phrase, query.needles.primary, query.needles.fallback];
 const showSnippet =
  !SNIPPET_EXCLUDED_KINDS.has(item.kind) && !textContainsNeedle(item.title, query.needles.primary);
 const snippet = showSnippet ? buildSearchSnippet(body, needleTiers) : undefined;
 return {
  item,
  score: Math.round(hit.score * 1000) / 1000,
  matchedSnippet: snippet?.snippet,
  matchedText: snippet?.matchedText,
 };
}

export function rankSearchHits(
 engines: readonly SearchEngine[],
 query: PreparedSearchQuery,
 request: HanziHomeSearchRequest,
): HanziHomeSearchResponse {
 const hits = boostPhraseHits(
  engines
   .flatMap((engine) => searchEngine(engine, query))
   .map((hit) => ({ ...hit, score: hit.score * rankMultiplier(hit, query, request) }))
   .sort(byScore),
  query,
 );
 const visible =
  request.category === "all"
   ? hits
   : hits.filter((hit) => searchResultCategory(hit.document.item.kind) === request.category);

 return {
  query: query.raw,
  category: request.category,
  results: visible.slice(0, request.limit).map((hit) => toResult(hit, query)),
  counts: countSearchResultCategories(hits.map((hit) => hit.document.item.kind)),
 };
}
