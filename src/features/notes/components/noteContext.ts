import type { NoteDetail, NoteLinkSummary, NoteListItem } from "@/services/notes.service";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

export type NoteWithContext = NoteListItem | NoteDetail;

export type NoteContextKind = "lesson" | "quick" | "normal";

export type NoteContextView = {
 kind: NoteContextKind;
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

function getPrimaryLessonLink(note: NoteWithContext): NoteLinkSummary | undefined {
 return note.links.find((link) => link.targetType === "hanzihome_lesson");
}

function getLessonForNote(
 note: NoteWithContext,
 lessonLookup: LessonLookup,
): HanziHomeLesson | undefined {
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
  .filter((tag) => tag !== "quick-note")
  .slice(0, 3);
}

function uniqueBadges(badges: string[]): string[] {
 const seen = new Set<string>();
 const uniqueBadgesList: string[] = [];
 if (!badges || badges.length === 0) return uniqueBadgesList;
 for (const badge of badges) {
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
 const noteTags = cleanTags(note.tags ?? []);

 if (lesson || link || note.linked_lesson_id) {
  const relationLabel = link ? relationLabels[link.relationType] : "Bài học";
  const fallbackTarget = link?.targetKey ?? note.linked_lesson_id ?? "";
  const lessonTitle = lesson
   ? `Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`
   : compactRawTargetKey(fallbackTarget);

  return {
   kind: "lesson",
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
   title: "Ghi chú nhanh",
   subtitle: "Không gắn với bài học",
   badges: uniqueBadges(["Quick note", ...noteTags]),
  };
 }

 return {
  kind: "normal",
  title: "Ghi chú thường",
  subtitle: categoryLabels[note.category],
  badges: uniqueBadges([categoryLabels[note.category], ...noteTags]),
 };
}

export function getCategoryLabel(category: NoteWithContext["category"]): string {
 return categoryLabels[category];
}
