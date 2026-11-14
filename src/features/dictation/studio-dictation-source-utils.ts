import { z } from "zod";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { READER_DICTATION_BOOK_ID, type dictationBookOptions } from "./dictation-workspace-utils";
import type { StudioDictationSourceState } from "./useStudioDictationSource";

export type DictationSource = "lesson" | "library" | "custom" | "reader";
export type DictationPlaybackMode = "sentence" | "paragraph" | "passage";

export const recentSourceStoragePrefix = "chines-app:dictation:recent-source:v1";
export const recentSourceSchema = z
 .object({
  title: z.string().min(1).max(200),
  bookId: z.string().max(100),
  volumeId: z.string().max(100),
  lessonId: z.string().max(100),
  sectionId: z.string().max(100),
  readerDocumentId: z.string().max(100),
  documentId: z.string().max(100),
  clipId: z.string().max(100),
 })
 .refine((source) => {
  if (
   [source.lessonId, source.readerDocumentId, source.documentId, source.clipId].filter(Boolean)
    .length !== 1
  )
   return false;
  if (source.lessonId) return Boolean(source.bookId && source.volumeId && source.sectionId);
  if (source.readerDocumentId)
   return source.bookId === READER_DICTATION_BOOK_ID && !source.volumeId && !source.sectionId;
  return !source.bookId && !source.volumeId && !source.sectionId;
 });
export type DictationRecentSource = z.infer<typeof recentSourceSchema>;
export const emptyRecentSource = {
 title: "",
 bookId: "",
 volumeId: "",
 lessonId: "",
 sectionId: "",
 readerDocumentId: "",
 documentId: "",
 clipId: "",
};

/** Source tab implied by a document or clip identifier (reader wins over library). */
export function dictationSourceTypeFor(documentId: string, clipId: string): DictationSource {
 return documentId ? "reader" : clipId ? "library" : "lesson";
}

/** Whether a stored recent source still points at content available in this workspace. */
export function isRecentSourceAvailable(
 saved: DictationRecentSource,
 lessons: ReadonlyArray<HanziHomeLesson>,
 bookOptions: ReturnType<typeof dictationBookOptions>,
 readerDocuments: ReadonlyArray<ReaderDocumentRow>,
) {
 if (saved.lessonId) {
  const lesson = lessons.find((item) => item.id === saved.lessonId);
  const book = bookOptions.find((item) => item.id === saved.bookId);
  if (
   !lesson ||
   lesson.bookId !== saved.volumeId ||
   !book?.volumes.some((volume) => volume.id === saved.volumeId)
  )
   return false;
 }
 if (
  saved.readerDocumentId &&
  !readerDocuments.some((document) => document.id === saved.readerDocumentId)
 )
  return false;
 return true;
}

/** Query string that reopens a recent source through the resume flow. */
export function recentSourceResumeSearch(source: DictationRecentSource) {
 const next = new URLSearchParams();
 next.set("resume", "1");
 if (source.documentId) next.set("documentId", source.documentId);
 if (source.readerDocumentId) next.set("readerDocumentId", source.readerDocumentId);
 if (source.clipId) next.set("clipId", source.clipId);
 return next.toString();
}

/** Recent-source record for the current non-custom selection, saved when practice starts. */
export function recentSourceFromSelection(
 source: StudioDictationSourceState,
 requestedDocumentId: string,
): DictationRecentSource {
 const { sourceType, isReaderCoursePack, selectedClip, selectedSection } = source;
 const lessonSource = sourceType === "lesson";
 return {
  title:
   sourceType === "reader"
    ? (source.currentReaderResource?.document.title_zh ?? "")
    : sourceType === "library"
      ? selectedClip?.title || selectedClip?.text.slice(0, 36) || ""
      : isReaderCoursePack
        ? (source.selectedReaderResource?.document.title_zh ?? "")
        : (selectedSection?.titleZh ?? ""),
  bookId: lessonSource ? source.selectedBookId : "",
  volumeId: lessonSource ? source.selectedVolumeId : "",
  lessonId: lessonSource && !isReaderCoursePack ? source.selectedLessonId : "",
  sectionId: lessonSource && !isReaderCoursePack ? (selectedSection?.id ?? "") : "",
  readerDocumentId: lessonSource && isReaderCoursePack ? source.selectedReaderDocumentId : "",
  documentId: sourceType === "reader" ? requestedDocumentId : "",
  clipId: sourceType === "library" ? source.effectiveSelectedClipId : "",
 };
}
