import { generateSmartPinyin } from "@/lib/pronunciation/pinyin-engine";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { DictationAttempt } from "./dictation-session";
import type { PracticeAttemptPayload } from "@/features/hanzihome/practice/practice-attempt-api";
import type { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";

export const READER_DICTATION_BOOK_ID = "hanzihome-reader-course";

export function dictationPracticePayload(attempt: DictationAttempt): PracticeAttemptPayload {
 return {
  surface: "dictation",
  contentId: attempt.entryId,
  direction: null,
  answer: {
   expectedText: attempt.expectedText,
   answer: attempt.answer,
   mistakeCount: attempt.mistakeCount,
  },
  scorePercent: attempt.score,
  responseMs: attempt.responseMs,
 };
}

export function dictationMistakeItem(
 attempt: DictationAttempt,
 dueAt: string,
): Parameters<typeof upsertLearningLoopItem>[0] {
 return {
  id: `dictation:${attempt.entryId}`,
  stable_key: `dictation:${attempt.entryId}`,
  kind: "dictation_mistake",
  source_id: attempt.entryId,
  source_href: "/dictation",
  title_zh: "Dictation mistake",
  title_vi: "Ôn lại lỗi chính tả",
  prompt_zh: attempt.expectedText,
  pinyin: "",
  meaning_vi: "",
  user_answer: attempt.answer,
  error_key: `mistakes:${attempt.mistakeCount}`,
  state: "new",
  due_at: dueAt,
  interval_days: 0,
  correct_streak: 0,
  lapse_count: 0,
  revision: 0,
 };
}

export function dictationEntryText(entry: ListeningTranscriptEntry) {
 const spokenLines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return spokenLines.length > 0 ? spokenLines.join("\n") : entry.transcript.full.zh;
}

export function dictationEntryPinyin(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.pinyin.trim()).filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : entry.transcript.full.pinyin;
}

export function dictationEntryMeaning(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.vi?.trim() ?? "").filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : (entry.transcript.full.vi ?? "");
}

export function dictationLessonLabel(lesson: HanziHomeLesson) {
 const textMatch = lesson.id.match(/-text-(\d+)$/u);
 if (textMatch !== null) {
  return `第${lesson.lessonNumber}课 · 课文 ${textMatch[1]} · ${lesson.titleZh}`;
 }
 return `第${lesson.lessonNumber}课 · ${lesson.titleZh}`;
}

export function externalDictationEntry(
 id: string,
 text: string,
 title: string,
 pinyin = generateSmartPinyin(text).pinyin,
): ListeningTranscriptEntry {
 return {
  id,
  title,
  transcript: {
   mode: "monologue",
   speakers: [{ id: "learner-source", labelZh: "练习", labelVi: "Bài luyện", voice: "neutral" }],
   lines: [{ order: 1, speakerId: "learner-source", zh: text, pinyin }],
   full: { zh: text, pinyin },
  },
 };
}

export function dictationBookOptions(initialDictationLessons: readonly HanziHomeLesson[]) {
 const books = new Map<
  string,
  { id: string; title: string; volumes: Array<{ id: string; title: string }> }
 >();
 for (const lesson of initialDictationLessons) {
  if (!lesson.bookId || !lesson.bookTitle) continue;
  const id = lesson.bookId.replace(/-volume-\d+$/u, "");
  const current = books.get(id) ?? {
   id,
   title: lesson.bookTitle.replace(/（[上下]）$/u, ""),
   volumes: [],
  };
  if (!current.volumes.some((volume) => volume.id === lesson.bookId)) {
   current.volumes.push({ id: lesson.bookId, title: lesson.bookTitle });
  }
  books.set(id, current);
 }
 return [
  ...books.values(),
  { id: READER_DICTATION_BOOK_ID, title: "Bài đọc giáo trình", volumes: [] },
 ]
  .map((book) => {
   const hskLevel = book.id.match(/:book:hsk([3-6])$/u)?.[1];
   return {
    ...book,
    title: hskLevel === undefined ? book.title : `HSK ${hskLevel}`,
    volumes: book.volumes.sort((left, right) => left.title.localeCompare(right.title)),
   };
  })
  .sort((left, right) => {
   const leftLevel = Number.parseInt(left.id.match(/:book:hsk([3-6])$/u)?.[1] ?? "99", 10);
   const rightLevel = Number.parseInt(right.id.match(/:book:hsk([3-6])$/u)?.[1] ?? "99", 10);
   return leftLevel - rightLevel || left.title.localeCompare(right.title);
  });
}

export function dictationLessonSelection(
 lessons: readonly HanziHomeLesson[],
 books: ReturnType<typeof dictationBookOptions>,
 bookId: string,
 volumeId: string,
 lessonId: HanziHomeLesson["id"],
) {
 const selectedBookId = bookId || books[0]?.id || "";
 const selectedBook = books.find((book) => book.id === selectedBookId);
 const isReaderCoursePack = selectedBookId === READER_DICTATION_BOOK_ID;
 const selectedVolumeId = isReaderCoursePack ? "" : volumeId || selectedBook?.volumes[0]?.id || "";
 const visibleLessons = lessons.filter((lesson) => lesson.bookId === selectedVolumeId);
 const selectedLessonId = visibleLessons.some((lesson) => lesson.id === lessonId)
  ? lessonId
  : (visibleLessons[0]?.id ?? "");
 return {
  selectedBookId,
  selectedBook,
  isReaderCoursePack,
  selectedVolumeId,
  visibleLessons,
  selectedLessonId,
 };
}

export function dictationReaderDocumentId(
 documents: readonly ReaderDocumentRow[],
 selectedId: ReaderDocumentRow["id"],
 requestedId: ReaderDocumentRow["id"],
) {
 return documents.some((document) => document.id === selectedId)
  ? selectedId
  : documents.some((document) => document.id === requestedId)
    ? requestedId
    : (documents[0]?.id ?? "");
}

export function readerDictationEntries(
 paragraphs: ReaderDocumentResource["paragraphs"],
 paragraphTitle: (order: number) => string,
) {
 return paragraphs.map((paragraph) =>
  externalDictationEntry(
   `reader:${paragraph.id}`,
   paragraph.zh,
   paragraph.vi || paragraphTitle(paragraph.paragraph_order),
   paragraph.pinyin,
  ),
 );
}

export function customDictationEntries(text: string, title: string) {
 const trimmed = text.trim();
 return trimmed.length === 0 ? [] : [externalDictationEntry("custom:dictation", trimmed, title)];
}

export function dictationActiveEntryIndex(
 entries: readonly ListeningTranscriptEntry[],
 activeId: string,
) {
 const selectedIndex = entries.findIndex((entry) => entry.id === activeId);
 return Math.max(0, selectedIndex);
}

export function dictationPlaybackTexts(
 entries: readonly ListeningTranscriptEntry[],
 activeIndex: number,
 playWholePassage: boolean,
) {
 const activeEntry = entries[activeIndex];
 return playWholePassage
  ? entries.map(dictationEntryText).filter(Boolean)
  : activeEntry
    ? [dictationEntryText(activeEntry)].filter(Boolean)
    : [];
}
