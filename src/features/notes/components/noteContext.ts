import type { JsonFieldValue } from "@/types/json";
import type { NoteDetail, NoteLinkSummary, NoteListItem } from "@/services/notes.service";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { z } from "zod";

type NoteWithContextMap = {
 list: NoteListItem;
 detail: NoteDetail;
};
export type NoteWithContext = NoteWithContextMap[keyof NoteWithContextMap];

const NoteContextKindSchema = z.enum(["lesson", "quick", "normal"]);
export type NoteContextKind = z.infer<typeof NoteContextKindSchema>;
type Optional<T> = z.infer<z.ZodOptional<z.ZodType<T>>>;

export type NoteContextView = {
 kind: NoteContextKind;
 displayTitle: string;
 title: string;
 subtitle: string;
 relationLabel?: string;
 lessonId?: string;
 badges: string[];
};

export type LessonLookup = Map<string, HanziHomeLesson>;

const relationLabels: Record<NoteLinkSummary["relationType"], string> = {
 main: "Bài học",
 lesson_text: "Bài khóa",
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 annotation: "Đánh dấu",
};

const categoryLabels: Record<NoteWithContext["category"], string> = {
 grammar: "Ngữ pháp",
 vocabulary: "Từ vựng",
 culture: "Văn hóa",
 general: "Chung",
};

export function buildLessonLookup(lessons: HanziHomeLesson[]): LessonLookup {
 const lookup = new Map<string, HanziHomeLesson>();

 for (const lesson of lessons) {
  lookup.set(lesson.id, lesson);
  if (lesson.legacyLessonId) lookup.set(lesson.legacyLessonId, lesson);
 }

 return lookup;
}

function getPrimaryLessonLink(note: NoteWithContext): Optional<NoteLinkSummary> {
 return note.links.find((link) => link.targetType === "hanzihome_lesson");
}

function getLessonForNote(
 note: NoteWithContext,
 lessonLookup: LessonLookup,
): Optional<HanziHomeLesson> {
 const link = getPrimaryLessonLink(note);
 if (link) {
  const lesson = lessonLookup.get(link.targetKey);
  if (lesson) return lesson;
 }

 if (note.linked_lesson_id) {
  return lessonLookup.get(note.linked_lesson_id);
 }

 return undefined;
}

function compactRawTargetKey(targetKey: string): string {
 return targetKey
  .replace(/^hanyu_/i, "")
  .replace(/^hanyu-/i, "")
  .replace(/_/g, "-")
  .replace(/--+/g, "-")
  .toUpperCase();
}

function cleanTags(tags: string[]): string[] {
 return tags
  .map((tag) => tag.trim())
  .filter((tag) => tag.length > 0)
  .filter((tag) => tag !== "hanzihome")
  .filter((tag) => tag !== "lesson-note")
  .filter((tag) => tag !== "quick-note")
  .slice(0, 3);
}

function uniqueBadges(badges: JsonFieldValue[]): string[] {
 const seen = new Set<string>();
 const uniqueBadgesList: string[] = [];
 if (!badges || badges.length === 0) return uniqueBadgesList;
 for (const badge of badges) {
  if (typeof badge !== "string") continue;
  const normalizedBadge = badge.trim().toLocaleLowerCase("vi-VN");
  if (!normalizedBadge || seen.has(normalizedBadge)) continue;
  seen.add(normalizedBadge);
  uniqueBadgesList.push(badge);
 }

 return uniqueBadgesList;
}

export function getNoteContext(note: NoteWithContext, lessonLookup: LessonLookup): NoteContextView {
 const lesson = getLessonForNote(note, lessonLookup);
 const link = getPrimaryLessonLink(note);
 const noteTags = cleanTags(note.tags ?? []).filter(
  (tag) => tag !== link?.targetKey && tag !== note.linked_lesson_id,
 );

 if (lesson || link || note.linked_lesson_id) {
  const relationLabel = link ? relationLabels[link.relationType] : "Bài học";
  const fallbackTarget = link?.targetKey ?? note.linked_lesson_id ?? "";
  const lessonTitle = lesson
   ? [lesson.title, lesson.titleZh !== lesson.title ? lesson.titleZh : null]
      .filter(Boolean)
      .join(" · ")
   : compactRawTargetKey(fallbackTarget);
  const legacyGeneratedTitle = lesson ? `Ghi chú: ${lesson.title}` : null;
  const generatedTitle = lesson
   ? `${lesson.bookTitle ? `${lesson.bookTitle} · ` : ""}Bài ${lesson.lessonNumber} · ${lesson.title}`
   : null;
  const displayTitle =
   lesson && (note.title === legacyGeneratedTitle || note.title === generatedTitle)
    ? lesson.bookTitle || lesson.courseTitle
      ? `${lesson.bookTitle || lesson.courseTitle} · Bài ${lesson.lessonNumber}`
      : `Bài ${lesson.lessonNumber}`
    : note.title || "Ghi chú chưa đặt tên";

  return {
   kind: "lesson",
   displayTitle,
   title: "Ghi chú bài học",
   subtitle: lessonTitle,
   relationLabel,
   lessonId: lesson?.id ?? fallbackTarget,
   badges: uniqueBadges([relationLabel, ...noteTags]),
  };
 }

 if ((note.tags ?? []).includes("quick-note")) {
  return {
   kind: "quick",
   displayTitle: note.title || "Ghi chú chưa đặt tên",
   title: "Ghi chú nhanh",
   subtitle: "Không gắn với bài học",
   badges: uniqueBadges(["Quick note", ...noteTags]),
  };
 }

 return {
  kind: "normal",
  displayTitle: note.title || "Ghi chú chưa đặt tên",
  title: "Ghi chú thường",
  subtitle: categoryLabels[note.category],
  badges: uniqueBadges([categoryLabels[note.category], ...noteTags]),
 };
}

export function getCategoryLabel(category: NoteWithContext["category"]): string {
 return categoryLabels[category];
}
