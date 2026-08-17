import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { NoteDetail, NoteLinkSummary, NoteListItem } from "@/services/notes.service";
import type { JsonFieldValue } from "@/types/json";

type NoteWithContextMap = {
 list: NoteListItem;
 detail: NoteDetail;
};
export type NoteWithContext = NoteWithContextMap[keyof NoteWithContextMap];

export type NoteContextKind = "lesson" | "quick" | "normal";

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

export type NoteContextLabels = {
 relations: Record<NoteLinkSummary["relationType"], string>;
 categories: Record<NoteWithContext["category"], string>;
 lessonNote: string;
 quickNote: string;
 normalNote: string;
 noLesson: string;
 quickBadge: string;
 untitled: string;
 lessonNumber: (number: number) => string;
 bookLesson: (book: string, number: number) => string;
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
  const normalizedBadge = badge.trim().toLocaleLowerCase();
  if (!normalizedBadge || seen.has(normalizedBadge)) continue;
  seen.add(normalizedBadge);
  uniqueBadgesList.push(badge);
 }

 return uniqueBadgesList;
}

export function getNoteContext(
 note: NoteWithContext,
 lessonLookup: LessonLookup,
 labels: NoteContextLabels,
): NoteContextView {
 const lesson = getLessonForNote(note, lessonLookup);
 const link = getPrimaryLessonLink(note);
 const noteTags = cleanTags(note.tags ?? []).filter(
  (tag) => tag !== link?.targetKey && tag !== note.linked_lesson_id,
 );

 if (lesson || link || note.linked_lesson_id) {
  const relationLabel = link ? labels.relations[link.relationType] : labels.relations.main;
  const fallbackTarget = link?.targetKey ?? note.linked_lesson_id ?? "";
  const lessonTitle = lesson
   ? [lesson.title, lesson.titleZh !== lesson.title ? lesson.titleZh : null]
      .filter(Boolean)
      .join(" · ")
   : compactRawTargetKey(fallbackTarget);

  // These persisted title shapes predate i18n. Keep them only for compatibility detection.
  const legacyGeneratedTitle = lesson ? `Ghi chú: ${lesson.title}` : null;
  const generatedTitle = lesson
   ? `${lesson.bookTitle ? `${lesson.bookTitle} · ` : ""}Bài ${lesson.lessonNumber} · ${lesson.title}`
   : null;
  const lessonGroupTitle = lesson ? lesson.bookTitle || lesson.courseTitle : undefined;
  const displayTitle =
   lesson && (note.title === legacyGeneratedTitle || note.title === generatedTitle)
    ? lessonGroupTitle
     ? labels.bookLesson(lessonGroupTitle, lesson.lessonNumber)
     : labels.lessonNumber(lesson.lessonNumber)
    : note.title || labels.untitled;

  return {
   kind: "lesson",
   displayTitle,
   title: labels.lessonNote,
   subtitle: lessonTitle,
   relationLabel,
   lessonId: lesson?.id ?? fallbackTarget,
   badges: uniqueBadges([relationLabel, ...noteTags]),
  };
 }

 if ((note.tags ?? []).includes("quick-note")) {
  return {
   kind: "quick",
   displayTitle: note.title || labels.untitled,
   title: labels.quickNote,
   subtitle: labels.noLesson,
   badges: uniqueBadges([labels.quickBadge, ...noteTags]),
  };
 }

 return {
  kind: "normal",
  displayTitle: note.title || labels.untitled,
  title: labels.normalNote,
  subtitle: labels.categories[note.category],
  badges: uniqueBadges([labels.categories[note.category], ...noteTags]),
 };
}
