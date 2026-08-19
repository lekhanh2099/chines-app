import type { AggregateFilters, AggregateKind } from "./repositories/hanzihome-content-resources";

type LessonResourceKind = "overview" | "sections" | "vocabulary" | "grammar";

export const hanzihomeQueryKeys = {
 root: ["hanzihome"],
 learningState: ["hanzihome", "learning-state"],
 catalogRoot: ["hanzihome", "catalog"],
 catalog: (includeLessons: boolean, includeRadicals = false) => [
  "hanzihome",
  "catalog",
  { includeLessons, includeRadicals },
 ],
 courseLessonsRoot: ["hanzihome", "course-lessons"],
 courseLessons: (courseId: string) => ["hanzihome", "course-lessons", courseId],
 lessonDetail: (lessonId: string | null) => ["hanzihome", "lesson-detail", lessonId],
 lessonResource: (lessonId: string, resource: LessonResourceKind) => [
  "hanzihome",
  "lesson-resource",
  lessonId,
  resource,
 ],
 aggregate: (kind: AggregateKind, filters: AggregateFilters) => [
  "hanzihome",
  `aggregate-${kind}`,
  filters,
 ],
 listeningLesson: (lessonId: string) => ["hanzihome", "listening", "lesson", lessonId],
 readerDocuments: (kind?: string) => ["hanzihome", "reader", "documents", kind ?? "all"],
 readerDocument: (documentId: string) => ["hanzihome", "reader", "document", documentId],
 readerState: (documentId: string) => ["hanzihome", "reader", "state", documentId],
 readerSessionUser: ["hanzihome", "reader", "session-user"],
 readerDailyState: (publishedDate: string) => ["hanzihome", "reader", "daily-state", publishedDate],
 readerPersonalState: (nodeId: string) => ["hanzihome", "reader", "personal-state", nodeId],
 readerDataQuality: ["hanzihome", "reader", "data-quality"],
 readerAnnotations: (documentId: string) => ["hanzihome", "reader", "annotations", documentId],
 readerPronunciationOverrides: (documentId: string) => [
  "hanzihome",
  "reader",
  "pronunciation-overrides",
  documentId,
 ],
 readerPdfAnnotation: (assetId: string, pageNumber: number) => [
  "hanzihome",
  "reader",
  "pdf-annotation",
  assetId,
  pageNumber,
 ],
 practiceAttempts: (surface: string, contentId: string) => [
  "hanzihome",
  "practice-attempts",
  surface,
  contentId,
 ],
 learningLoop: ["hanzihome", "learning-loop"],
 aiConversationRuntimeHealth: (runtimeKeyId: string) => [
  "hanzihome",
  "ai-conversation",
  "runtime-health",
  runtimeKeyId,
 ],
 ttsLibrary: ["hanzihome", "tts", "library"],
 canEdit: ["hanzihome", "can-edit"],
 searchIndexRoot: ["hanzihome", "search-index"],
 searchIndex: ["hanzihome", "search-index", "v2"],
 vocabChildManagerRoot: ["hanzihome", "vocab-child-manager"],
 deletedContent: ["hanzihome", "deleted-content"],
};
