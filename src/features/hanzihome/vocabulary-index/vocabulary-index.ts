import { z } from "zod";

import { normalizeSearchText } from "@/features/hanzihome/search/normalize";
import { wordPinyinKey } from "./word-key";

const vocabularyStoreTabSchema = z.enum(["store", "lookup"]);
export type VocabularyStoreTab = z.output<typeof vocabularyStoreTabSchema>;

export type VocabularySource = { label: string; href: string };

/** One occurrence of a word in one content source. */
export type VocabularyRecord = {
 hanzi: string;
 pinyin: string;
 hanViet: string;
 meaning: string;
 source: VocabularySource;
};

/** The meaning a word carries in one lesson or note. */
export type VocabularyOccurrence = { meaning: string; source: VocabularySource };

/** One word of the unified store: occurrences sharing its written form and reading. */
export type VocabularyEntry = {
 hanzi: string;
 pinyin: string;
 hanViet: string;
 occurrences: VocabularyOccurrence[];
};

export const VOCABULARY_PAGE_SIZE = 60;

/** A record names one reading; an empty pinyin or a list ("chuán / zhuàn") names none. */
function readingKeys(hanzi: string, pinyin: string): string[] {
 return pinyin
  .split("/")
  .map((reading) => wordPinyinKey(hanzi, reading))
  .filter(Boolean);
}

/**
 * Merges occurrences by written form and reading (see `wordPinyinKey`).
 * A record without a single reading joins the first reading it lists, else the
 * first reading of its written form. The first single reading and the first
 * non-empty Hán-Việt win; each source keeps the meaning the word has there,
 * in first-seen order.
 */
export function mergeVocabularyRecords(records: readonly VocabularyRecord[]): VocabularyEntry[] {
 const readingsByHanzi = new Map<string, string[]>();
 for (const record of records) {
  const hanzi = record.hanzi.trim();
  const [reading = "", ...others] = readingKeys(hanzi, record.pinyin);
  if (!reading || others.length > 0) continue;
  const readings = readingsByHanzi.get(hanzi) ?? [];
  readingsByHanzi.set(hanzi, readings);
  if (!readings.includes(reading)) readings.push(reading);
 }
 const entries = new Map<string, VocabularyEntry>();
 const namedEntries = new Set<string>();
 const seenOccurrences = new Set<string>();
 for (const record of records) {
  const hanzi = record.hanzi.trim();
  if (!hanzi) continue;
  const keys = readingKeys(hanzi, record.pinyin);
  const readings = readingsByHanzi.get(hanzi) ?? [];
  const [firstKey = ""] = keys;
  const namesOneReading = keys.length === 1;
  const pinyinKey = namesOneReading
   ? firstKey
   : (keys.find((reading) => readings.includes(reading)) ?? readings[0] ?? "");
  const key = [hanzi, pinyinKey].join("\u0000");
  const entry = entries.get(key) ?? { hanzi, pinyin: "", hanViet: "", occurrences: [] };
  entries.set(key, entry);
  if (namesOneReading && !namedEntries.has(key)) {
   namedEntries.add(key);
   entry.pinyin = record.pinyin.trim();
  }
  entry.pinyin ||= record.pinyin.trim();
  entry.hanViet ||= record.hanViet.trim();
  const meaning = record.meaning.trim();
  const occurrenceKey = [key, record.source.href, normalizeSearchText(meaning)].join("\u0000");
  if (!seenOccurrences.has(occurrenceKey)) {
   seenOccurrences.add(occurrenceKey);
   entry.occurrences.push({ meaning, source: record.source });
  }
 }
 return [...entries.values()];
}

/**
 * Joins two already-merged stores using the same word/reading identity.
 * Words of `primary` come first; source meanings remain attached to their reading.
 */
export function combineVocabularyEntries(
 primary: readonly VocabularyEntry[],
 secondary: readonly VocabularyEntry[],
): VocabularyEntry[] {
 return mergeVocabularyRecords(
  [...primary, ...secondary].flatMap((entry) =>
   entry.occurrences.map((occurrence) => ({
    hanzi: entry.hanzi,
    pinyin: entry.pinyin,
    hanViet: entry.hanViet,
    meaning: occurrence.meaning,
    source: occurrence.source,
   })),
  ),
 );
}

/** A store prepared for searching: every field is normalized once, not per query. */
export type VocabularySearchIndex = {
 entry: VocabularyEntry;
 hanzi: string;
 pinyin: string;
 compactPinyin: string;
 hanViet: string;
 meanings: string[];
}[];

export function buildVocabularySearchIndex(
 entries: readonly VocabularyEntry[],
): VocabularySearchIndex {
 return entries.map((entry) => {
  const pinyin = normalizeSearchText(entry.pinyin);
  return {
   entry,
   hanzi: entry.hanzi.toLocaleLowerCase(),
   pinyin,
   compactPinyin: pinyin.replaceAll(" ", ""),
   hanViet: normalizeSearchText(entry.hanViet),
   meanings: entry.occurrences.map((occurrence) => normalizeSearchText(occurrence.meaning)),
  };
 });
}

/** Lower is better; `-1` means the entry does not match. */
function matchRank(item: VocabularySearchIndex[number], query: string, compactQuery: string) {
 if (item.hanzi === query) return 0;
 if (item.hanzi.startsWith(query)) return 1;
 if (item.hanzi.includes(query)) return 2;
 if (item.pinyin.includes(query) || item.compactPinyin.includes(compactQuery)) return 3;
 if (item.hanViet.includes(query)) return 4;
 if (item.meanings.some((meaning) => meaning.includes(query))) return 5;
 return -1;
}

/** Entries matching `query` by word, toneless pinyin, Hán-Việt or meaning, best match first. */
export function searchVocabularyIndex(
 index: VocabularySearchIndex,
 query: string,
): VocabularyEntry[] {
 const normalizedQuery = normalizeSearchText(query);
 if (!normalizedQuery) return index.map((item) => item.entry);
 const compactQuery = normalizedQuery.replaceAll(" ", "");
 return index
  .map((item, order) => ({ item, order, rank: matchRank(item, normalizedQuery, compactQuery) }))
  .filter((match) => match.rank >= 0)
  .sort((left, right) => left.rank - right.rank || left.order - right.order)
  .map((match) => match.item.entry);
}

export function paginateVocabularyEntries(entries: readonly VocabularyEntry[], page: number) {
 const pageCount = Math.max(1, Math.ceil(entries.length / VOCABULARY_PAGE_SIZE));
 const currentPage = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
 const start = (currentPage - 1) * VOCABULARY_PAGE_SIZE;
 return {
  items: entries.slice(start, start + VOCABULARY_PAGE_SIZE),
  total: entries.length,
  page: currentPage,
  pageCount,
 };
}

/** Detail page of one word of the store. */
export function vocabularyWordHref(hanzi: string): string {
 return `/inspector/${encodeURIComponent(hanzi)}`;
}
