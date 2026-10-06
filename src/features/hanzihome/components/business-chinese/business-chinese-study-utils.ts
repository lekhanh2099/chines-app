import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotation } from "@/features/reader/runtime/reader-services";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { DictationSource } from "@/features/hanzihome/practice/translation-practice";

const nonChineseTextPattern = /[^\p{Script=Han}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}]/gu;

export function isChineseOnlyText(value: string) {
 return value.replace(nonChineseTextPattern, "").trim().length === value.trim().length;
}

function tableColumns(block: TextbookLesson["sections"][number]["blocks"][number]) {
 const headers = block.rows[0] ?? [];
 const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
 const hanziColumnIndex = headers.findIndex((header) =>
  /tiếng trung|giản thể|hán tự|từ vựng|^từ$/iu.test(header),
 );
 return { headers, pinyinColumnIndex, hanziColumnIndex };
}

export function businessChineseTableColumns(
 block: TextbookLesson["sections"][number]["blocks"][number],
 displayMode: LessonDisplayMode,
 answerVisible: boolean,
) {
 const columns = tableColumns(block);
 const visibleColumnIndexes = columns.headers
  .map((header, index) => ({ header, index }))
  .filter(({ header }) => displayMode.showMeaning || !/tiếng việt|nghĩa|hán việt/iu.test(header))
  .filter(({ index }) => answerVisible || !block.answerColumnIndexes?.includes(index))
  .map(({ index }) => index);
 return {
  ...columns,
  isVocabularyTable: columns.hanziColumnIndex >= 0 && columns.pinyinColumnIndex >= 0,
  visibleColumnIndexes,
 };
}

export function isCanonicalVocabularyTable(
 block: TextbookLesson["sections"][number]["blocks"][number],
 vocabulary: TextbookLesson["vocab"],
) {
 const { pinyinColumnIndex, hanziColumnIndex } = tableColumns(block);
 const rows = block.rows.slice(1);

 return (
  hanziColumnIndex >= 0 &&
  pinyinColumnIndex >= 0 &&
  rows.length === vocabulary.length &&
  vocabulary.every(
   (item, index) =>
    rows[index]?.[hanziColumnIndex] === item.hanzi &&
    rows[index]?.[pinyinColumnIndex] === item.pinyin,
  )
 );
}

export function pairedTextbookTranslations(sections: TextbookLesson["sections"]) {
 const translations = new Map<string, string>();
 const translationIndex = sections.findIndex((section) => section.title.includes("DỊCH BÀI KHÓA"));
 const sourceSection = translationIndex > 0 ? sections[translationIndex - 1] : undefined;
 const translationSection = translationIndex >= 0 ? sections[translationIndex] : undefined;
 if (!sourceSection || !translationSection) return translations;
 sourceSection.blocks.forEach((block, index) => {
  const translation = translationSection.blocks[index];
  if (translation?.text) translations.set(block.id, translation.text);
 });
 return translations;
}

export function splitBusinessChineseExercise(text: string) {
 const separatorIndex = text.indexOf("→");
 return {
  prompt: text.slice(0, separatorIndex).trim(),
  answer: text.slice(separatorIndex + 1).trim(),
 };
}

export function businessChineseSourceSections(sections: TextbookLesson["sections"]) {
 return sections.filter((section) => !section.title.includes("DỊCH BÀI KHÓA"));
}

export function businessChineseContentSections(sections: TextbookLesson["sections"]) {
 return businessChineseSourceSections(sections).filter((section) => section.blocks.length > 0);
}

export function businessChineseTabAvailable(
 key: string,
 sections: TextbookLesson["sections"],
 dictationCount: number,
 vocabularyCount: number,
) {
 return (
  key === "all" ||
  key === "notes" ||
  key === "translation" ||
  (key === "dictation" && dictationCount > 0) ||
  (key === "vocab" && vocabularyCount > 0) ||
  sections.some((section) => section.category === key)
 );
}

export function businessChineseVocabularyTableIds(
 sections: TextbookLesson["sections"],
 vocabulary: TextbookLesson["vocab"],
) {
 return sections.flatMap((section) =>
  section.blocks
   .filter((block) => isCanonicalVocabularyTable(block, vocabulary))
   .map((block) => block.id),
 );
}

export function businessChineseVisibleBlocks(
 section: TextbookLesson["sections"][number],
 canonicalVocabularyTableIds: readonly string[],
) {
 return section.blocks.filter((block) => !canonicalVocabularyTableIds.includes(block.id));
}

export function businessChineseVisibleSections(
 sections: TextbookLesson["sections"],
 activeView: string,
) {
 return sections.filter((section) => activeView === "all" || section.category === activeView);
}

export function businessChineseReaderVocabulary(vocabulary: TextbookLesson["vocab"]) {
 return vocabulary.map((item) => ({
  id: item.id,
  word: item.hanzi,
  pinyin: item.pinyin,
  meaning: item.meaning,
 }));
}

export function businessChinesePronunciationAnalyses(document: ReaderDocumentModel) {
 return new Map(
  document.segments.map((segment) => [
   segment.id,
   analyzeContextualPronunciation({ text: segment.zh, sourcePinyin: segment.pinyin ?? null }),
  ]),
 );
}

export function businessChineseSectionDocuments(document: ReaderDocumentModel) {
 const documents = new Map<string, ReaderDocumentModel>();
 for (const section of document.sections) {
  documents.set(section.id, {
   ...document,
   id: `${document.id}:${section.id}`,
   title: section.id === document.sections[0]?.id ? document.title : undefined,
   titleVi: section.id === document.sections[0]?.id ? document.titleVi : undefined,
   sections: document.sections.filter((readerSection) => readerSection.id === section.id),
   segments: document.segments.filter((segment) => segment.sectionId === section.id),
  });
 }
 return documents;
}

export function businessChineseReaderAnnotations(
 annotations: readonly ReaderAnnotationRow[],
): ReaderAnnotation[] {
 return annotations.flatMap((annotation) =>
  annotation.paragraph_id !== null &&
  annotation.start_offset !== null &&
  annotation.end_offset !== null &&
  annotation.end_offset > annotation.start_offset &&
  annotation.selected_text.length > 0
   ? [
      {
       id: annotation.id,
       segmentId: annotation.paragraph_id,
       text: annotation.selected_text,
       noteText: annotation.note_text,
       start: annotation.start_offset,
       end: annotation.end_offset,
       color: annotation.color,
      },
     ]
   : [],
 );
}

export function businessChineseDictationCount(sources: readonly DictationSource[]) {
 return sources.reduce((count, source) => count + source.entries.length, 0);
}
