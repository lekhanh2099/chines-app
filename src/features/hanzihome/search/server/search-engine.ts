import MiniSearch, { type SearchOptions } from "minisearch";

import { normalizeSearchText } from "../normalize";
import type { HanziHomeSearchResultItem } from "../types";
import {
 isHanText,
 latinTokens,
 queryNeedles,
 tokenizeForIndex,
 tokenizePinyinForIndex,
 tokenizeQuery,
} from "./search-tokenizer";

/**
 * One searchable unit. `item` is what the dialog renders and navigates to;
 * the remaining fields are the indexed text. `subtitle` is indexed only for
 * container documents (lessons, sections, Reader documents) so leaf rows do
 * not all match their lesson title.
 */
export type SearchDocument = {
 item: HanziHomeSearchResultItem;
 title: string;
 pinyin: string;
 subtitle: string;
 body: string;
};

type IndexedSearchDocument = {
 ref: number;
 title: string;
 pinyin: string;
 subtitle: string;
 body: string;
};

/** Title beats pinyin, pinyin beats context, context beats body text. */
export const SEARCH_FIELD_BOOSTS = { title: 6, pinyin: 3, subtitle: 1.5, body: 1 };
const SEARCH_FIELDS = Object.keys(SEARCH_FIELD_BOOSTS);
const MIN_FUZZY_TERM_LENGTH = 4;
/** Only word-sized pinyin (vocabulary, titles) can equal a whole query. */
const MAX_WORD_PINYIN_LENGTH = 40;
const FUZZY_DISTANCE_RATIO = 0.2;

export type SearchEngine = {
 documents: readonly SearchDocument[];
 normalizedTitles: readonly string[];
 /** Space-free toneless pinyin of word-sized values, "" otherwise. */
 compactPinyins: readonly string[];
 index: MiniSearch<IndexedSearchDocument>;
};

function compactPinyin(pinyin: string) {
 return pinyin.length <= MAX_WORD_PINYIN_LENGTH ? latinTokens(pinyin).join("") : "";
}

export function createSearchEngine(documents: readonly SearchDocument[]): SearchEngine {
 const index = new MiniSearch<IndexedSearchDocument>({
  idField: "ref",
  fields: SEARCH_FIELDS,
  storeFields: [],
  tokenize: (text, fieldName) =>
   fieldName === "pinyin" ? tokenizePinyinForIndex(text) : tokenizeForIndex(text),
  processTerm: (term) => term,
 });
 index.addAll(
  documents.map((document, ref) => ({
   ref,
   title: document.title,
   pinyin: document.pinyin,
   subtitle: document.subtitle,
   body: document.body,
  })),
 );
 return {
  documents,
  normalizedTitles: documents.map((document) => normalizeSearchText(document.item.title)),
  compactPinyins: documents.map((document) => compactPinyin(document.pinyin)),
  index,
 };
}

export type PreparedSearchQuery = {
 raw: string;
 normalized: string;
 terms: readonly string[];
 needles: ReturnType<typeof queryNeedles>;
};

export function prepareSearchQuery(rawQuery: string): PreparedSearchQuery {
 const raw = rawQuery.trim();
 return {
  raw,
  normalized: normalizeSearchText(raw),
  terms: tokenizeQuery(raw),
  needles: queryNeedles(raw),
 };
}

function isLatinTerm(term: string) {
 return !isHanText(term);
}

const searchOptions: SearchOptions = {
 combineWith: "AND",
 boost: SEARCH_FIELD_BOOSTS,
 tokenize: tokenizeQuery,
 processTerm: (term) => term,
 prefix: (term, index, terms) => index === terms.length - 1 && isLatinTerm(term),
 fuzzy: (term) =>
  isLatinTerm(term) && term.length >= MIN_FUZZY_TERM_LENGTH ? FUZZY_DISTANCE_RATIO : false,
};

export type SearchHit = {
 document: SearchDocument;
 normalizedTitle: string;
 compactPinyin: string;
 score: number;
};

export function searchEngine(engine: SearchEngine, query: PreparedSearchQuery) {
 const hits: SearchHit[] = [];
 if (query.terms.length === 0) return hits;

 for (const result of engine.index.search(query.raw, searchOptions)) {
  const ref = result.id;
  if (typeof ref !== "number") continue;
  const document = engine.documents[ref];
  const normalizedTitle = engine.normalizedTitles[ref];
  const compactPinyinValue = engine.compactPinyins[ref];
  if (document === undefined || normalizedTitle === undefined || compactPinyinValue === undefined)
   continue;
  hits.push({ document, normalizedTitle, compactPinyin: compactPinyinValue, score: result.score });
 }
 return hits;
}
