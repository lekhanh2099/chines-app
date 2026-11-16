import "server-only";

import { radicalCharacterHref } from "@/features/hanzihome/radical-characters/radical-character-forms";
import { radicalCharactersContentSchema } from "@/features/hanzihome/radical-characters/radical-characters.schemas";
import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import type { AggregateResourceItem } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { listSpeakingDrillVocabulary } from "@/features/hanzihome/speaking-drills/speaking-drills-content.server";
import { speakingDrillsHref } from "@/features/hanzihome/speaking-drills/speaking-drills-utils";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { getItWebVocabCorpus } from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import radicalCharacters from "@/features/hanzihome/static-json/radical-characters.json";
import { getPublishedStudioAggregateItems } from "@/features/hanzihome/static-json/studio-published-content.server";

import {
 buildVocabularySearchIndex,
 combineVocabularyEntries,
 mergeVocabularyRecords,
 paginateVocabularyEntries,
 searchVocabularyIndex,
 type VocabularyEntry,
 type VocabularyRecord,
 type VocabularySearchIndex,
} from "./vocabulary-index";

const allLessons = { courseId: "", bookId: "", lessonId: "", q: "" };

function courseRecords(items: readonly AggregateResourceItem[]): VocabularyRecord[] {
 return items.flatMap((item) =>
  "word" in item
   ? [
      {
       hanzi: item.word,
       pinyin: item.pinyin,
       hanViet: item.hanViet,
       meaning: item.meaning,
       source: {
        label: item.lessonTitle,
        href: buildHanziHomeLessonHref({
         courseId: item.courseId,
         bookId: item.bookId,
         lessonNumber: item.lessonNumber,
         module: "vocab",
        }),
       },
      },
     ]
   : [],
 );
}

function bundledRecords(): VocabularyRecord[] {
 const textbooks = getTextbookCatalog().flatMap((book) =>
  book.lessons.flatMap((summary) =>
   (getTextbookLesson(summary.bookKey, summary.number)?.vocab ?? []).map((word) => ({
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    hanViet: word.hanviet,
    meaning: word.meaning,
    source: {
     label: `${book.label} · ${summary.title}`,
     href: buildTextbookHref(summary.bookKey, summary.number),
    },
   })),
  ),
 );
 const itCorpus = getItWebVocabCorpus();
 const itVocabulary = itCorpus.groups.flatMap((group) =>
  group.items.map((word) => ({
   hanzi: word.hanzi,
   pinyin: word.pinyin,
   hanViet: "",
   meaning: word.meaning,
   source: { label: `${itCorpus.meta.title} · ${group.label}`, href: "/" },
  })),
 );
 const speakingDrills = listSpeakingDrillVocabulary().map((word) => ({
  hanzi: word.hanzi,
  pinyin: word.pinyin,
  hanViet: "",
  meaning: word.vi,
  source: {
   label: `${word.bookName} · 第${word.lessonNo}课`,
   href: speakingDrillsHref(word.topicId),
  },
 }));
 const explainedCharacters = radicalCharactersContentSchema
  .parse(radicalCharacters)
  .radicals.flatMap((set) =>
   set.groups.flatMap((group) =>
    group.characters.map((character) => ({
     hanzi: character.hanzi,
     pinyin: character.pinyin,
     hanViet: character.hanViet,
     meaning: character.explanation,
     source: {
      label: `${set.radical} · ${set.hanViet}`,
      href: radicalCharacterHref(character.hanzi),
     },
    })),
   ),
  );
 return [
  ...textbooks,
  ...courseRecords(getPublishedStudioAggregateItems({ kind: "vocab", filters: allLessons })),
  ...itVocabulary,
  ...speakingDrills,
  ...explainedCharacters,
 ];
}

const bundledEntries: VocabularyEntry[][] = [];
const bundledIndexes: VocabularySearchIndex[] = [];
const courseIndexes = new Map<string, { revision: string; index: VocabularySearchIndex }>();
const maxCachedOwners = 20;

/**
 * Course vocabulary is editable, so the store must show an edit as soon as the
 * lesson does. Each request asks only for the content revision; the full
 * vocabulary is read and indexed again when that revision changes.
 */
async function searchIndexFor(ownerId: string): Promise<VocabularySearchIndex> {
 if (bundledEntries.length === 0) bundledEntries.push(mergeVocabularyRecords(bundledRecords()));
 const [bundled] = bundledEntries;
 if (!ownerId) {
  if (bundledIndexes.length === 0) bundledIndexes.push(buildVocabularySearchIndex(bundled));
  const [index] = bundledIndexes;
  return index;
 }
 const revision = await hanzihomeContentRepository.getAggregateVocabRevision();
 const cached = courseIndexes.get(ownerId);
 if (cached?.revision === revision) return cached.index;
 const courseEntries = mergeVocabularyRecords(
  courseRecords(
   await hanzihomeContentRepository.getAggregateItems({ kind: "vocab", filters: allLessons }),
  ),
 );
 const index = buildVocabularySearchIndex(combineVocabularyEntries(courseEntries, bundled));
 if (courseIndexes.size >= maxCachedOwners) courseIndexes.clear();
 courseIndexes.set(ownerId, { revision, index });
 return index;
}

/**
 * One page of the unified vocabulary store. `ownerId` adds the signed-in learner's
 * course vocabulary; an empty owner searches bundled content only.
 */
export async function getVocabularyPage({
 ownerId,
 query,
 page,
}: {
 ownerId: string;
 query: string;
 page: number;
}) {
 const index = await searchIndexFor(ownerId);
 return {
  ...paginateVocabularyEntries(searchVocabularyIndex(index, query), page),
  storeTotal: index.length,
 };
}

/** Written forms the learner meets in more than one place across the whole store. */
export async function getReusedVocabularyWords({ ownerId }: { ownerId: string }) {
 const occurrenceCounts = new Map<string, number>();
 for (const { entry } of await searchIndexFor(ownerId)) {
  occurrenceCounts.set(
   entry.hanzi,
   (occurrenceCounts.get(entry.hanzi) ?? 0) + entry.occurrences.length,
  );
 }
 return [...occurrenceCounts].filter(([, count]) => count > 1).map(([hanzi]) => hanzi);
}

/** The store entry for one written form; empty when the word is not in the store. */
export async function getVocabularyEntries({ ownerId, hanzi }: { ownerId: string; hanzi: string }) {
 const index = await searchIndexFor(ownerId);
 return index.filter((item) => item.entry.hanzi === hanzi).map((item) => item.entry);
}
