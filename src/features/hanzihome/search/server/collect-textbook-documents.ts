import {
 businessChineseContentSections,
 isCanonicalVocabularyTable,
 pairedTextbookTranslations,
 splitBusinessChineseExercise,
} from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import {
 buildTextbookHref,
 stripLeadingEmoji,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 getTextbookCatalog,
 getTextbookLesson,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import type { HanziHomeSearchKind } from "../types";
import type { SearchDocument } from "./search-engine";

type TextbookSection = TextbookLesson["sections"][number];
type TextbookBlock = TextbookSection["blocks"][number];
type TextbookBookSummary = ReturnType<typeof getTextbookCatalog>[number];

/** Injectable for tests; defaults to the checked-in corpus so new lessons are indexed automatically. */
export type TextbookSearchSource = {
 catalog: readonly TextbookBookSummary[];
 getLesson: typeof getTextbookLesson;
};

const MAX_TITLE_LENGTH = 120;

/** Result kind per textbook section category; the category is also the lesson tab key. */
const blockKindByCategory: Record<TextbookSection["category"], HanziHomeSearchKind> = {
 overview: "section",
 core: "section",
 text: "lesson_text",
 vocab: "vocab",
 grammar: "grammar",
 practice: "exercise",
};

export function textbookTabHref(lesson: TextbookLesson, tab: string, anchorId?: string) {
 const anchor = anchorId ? `#${encodeURIComponent(anchorId)}` : "";
 return `${buildTextbookHref(lesson.bookKey, lesson.number)}&tab=${encodeURIComponent(tab)}${anchor}`;
}

function displayTitle(value: string) {
 const title = stripLeadingEmoji(value).replace(/\s+/g, " ").trim();
 return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH)}…` : title;
}

function lessonLabel(lesson: TextbookLesson) {
 return /^BÀI\s+\d+/iu.exec(lesson.title)?.[0] ?? lesson.title;
}

/**
 * Learner-visible block text. Exercise answers (after "→") and answer table
 * columns stay out of the index, as they stay collapsed in Study Mode.
 */
function blockSearchText(
 block: TextbookBlock,
 category: TextbookSection["category"],
 pairedTranslation: string,
) {
 const text =
  category === "practice" && block.text.includes("→")
   ? splitBusinessChineseExercise(block.text).prompt
   : block.text;
 const hiddenColumns = new Set(block.answerColumnIndexes ?? []);
 const rows = block.rows.map((row) =>
  row.filter((_cell, index) => !hiddenColumns.has(index)).join(" "),
 );
 return [text, block.translation, pairedTranslation, block.image?.alt, ...rows]
  .filter(Boolean)
  .join("\n");
}

function metadata(lesson: TextbookLesson, tab: string, targetId: string) {
 return { source: "textbook", bookKey: lesson.bookKey, lessonNumber: lesson.number, tab, targetId };
}

function lessonDocuments(book: TextbookBookSummary, lesson: TextbookLesson): SearchDocument[] {
 const context = `${book.label} · ${displayTitle(lesson.title)}`;
 const documents: SearchDocument[] = [
  {
   item: {
    id: `textbook-lesson:${lesson.id}`,
    kind: "navigation",
    title: displayTitle(lesson.title),
    subtitle: book.label,
    href: buildTextbookHref(lesson.bookKey, lesson.number),
    metadata: metadata(lesson, "all", lesson.id),
   },
   title: `${lesson.title} ${lesson.rawTitle}`,
   pinyin: "",
   subtitle: book.label,
   body: lesson.intro.join("\n"),
  },
 ];

 for (const entry of lesson.vocab) {
  documents.push({
   item: {
    id: `textbook-vocab:${entry.id}`,
    kind: "vocab",
    title: entry.hanzi,
    subtitle: [entry.pinyin, entry.meaning, `${book.label} · ${lessonLabel(lesson)}`]
     .filter(Boolean)
     .join(" · "),
    pinyin: entry.pinyin,
    href: textbookTabHref(lesson, "vocab"),
    metadata: metadata(lesson, "vocab", entry.id),
   },
   title: [entry.hanzi, entry.traditional].filter(Boolean).join(" "),
   pinyin: entry.pinyin,
   subtitle: "",
   body: [entry.meaning, entry.hanviet, entry.pos].filter(Boolean).join("\n"),
  });
 }

 const translations = pairedTextbookTranslations(lesson.sections);
 for (const section of businessChineseContentSections(lesson.sections)) {
  const tab = section.category;
  documents.push({
   item: {
    id: `textbook-section:${section.id}`,
    kind: "section",
    title: displayTitle(section.title),
    subtitle: context,
    href: textbookTabHref(lesson, tab, section.id),
    metadata: metadata(lesson, tab, section.id),
   },
   title: section.title,
   pinyin: "",
   subtitle: "",
   body: "",
  });

  let heading = section.title;
  for (const block of section.blocks) {
   if (isCanonicalVocabularyTable(block, lesson.vocab)) continue;
   if (block.type === "subheading") heading = block.text;
   if (block.type === "subheading" && block.text === section.title) continue;

   documents.push({
    item: {
     id: `textbook-block:${block.id}`,
     kind: blockKindByCategory[section.category],
     title: displayTitle(heading),
     subtitle: context,
     href: textbookTabHref(lesson, tab, block.id),
     metadata: metadata(lesson, tab, block.id),
    },
    title: block.type === "subheading" ? block.text : "",
    pinyin: "",
    subtitle: "",
    body: blockSearchText(block, section.category, translations.get(block.id) ?? ""),
   });
  }
 }
 return documents;
}

/** Every lesson of every static extended textbook, derived from the catalog at build time. */
export function collectTextbookDocuments(source?: TextbookSearchSource) {
 const catalog = source?.catalog ?? getTextbookCatalog();
 const getLesson = source?.getLesson ?? getTextbookLesson;
 return catalog.flatMap((book) =>
  book.lessons.flatMap((summary) => {
   const lesson = getLesson(summary.bookKey, summary.number);
   return lesson ? lessonDocuments(book, lesson) : [];
  }),
 );
}
