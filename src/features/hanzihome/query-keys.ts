import type { AggregateFilters, AggregateKind } from "./repositories/hanzihome-content-resources";

type LessonResourceKind = "overview" | "sections" | "vocabulary" | "grammar";
type UserScope = string | null;

function scopedResourceKey(root: readonly string[], ownerOrResource: UserScope, resource?: string) {
 // One-argument calls are legacy invalidation roots. All user-owned query reads
 // introduced/updated in Phase 0 pass both owner + resource.
 return resource === undefined ? [...root] : [...root, ownerOrResource, resource];
}

export const hanzihomeQueryKeys = {
 root: ["hanzihome"],
 learningState: (userId: UserScope) => ["hanzihome", "learning-state", userId],
 catalogRoot: ["hanzihome", "catalog"],
 catalog: (includeLessons: boolean, includeRadicals = false) => [
  "hanzihome",
  "catalog",
  { includeLessons, includeRadicals },
 ],
 courseLessonsRoot: ["hanzihome", "course-lessons"],
 courseLessons: (courseId: string) => ["hanzihome", "course-lessons", courseId],
 courseOfflineStatus: (courseId: string, userId: UserScope) => [
  "hanzihome",
  "course-offline-status",
  courseId,
  userId,
 ],
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
 // Optional-resource forms keep pre-Phase-0 invalidation callers source-compatible.
 // User-owned Reader query reads pass owner explicitly.
 readerState: (ownerOrDocument: UserScope, documentId?: string) =>
  scopedResourceKey(["hanzihome", "reader", "state"], ownerOrDocument, documentId),
 readerSessionUser: ["hanzihome", "reader", "session-user"],
 readerDailyState: (ownerOrDate: UserScope, publishedDate?: string) =>
  scopedResourceKey(["hanzihome", "reader", "daily-state"], ownerOrDate, publishedDate),
 readerPersonalState: (ownerOrNode: UserScope, nodeId?: string) =>
  scopedResourceKey(["hanzihome", "reader", "personal-state"], ownerOrNode, nodeId),
 readerDataQuality: ["hanzihome", "reader", "data-quality"],
 readerAnnotations: (ownerOrDocument: UserScope, documentId?: string) =>
  scopedResourceKey(["hanzihome", "reader", "annotations"], ownerOrDocument, documentId),
 readerPronunciationOverrides: (ownerOrDocument: UserScope, documentId?: string) =>
  scopedResourceKey(
   ["hanzihome", "reader", "pronunciation-overrides"],
   ownerOrDocument,
   documentId,
  ),
 readerPdfAnnotation: (
  ownerOrAsset: UserScope,
  assetOrPage: string | number,
  pageNumber?: number,
 ) =>
  pageNumber === undefined
   ? ["hanzihome", "reader", "pdf-annotation", null, ownerOrAsset, assetOrPage]
   : ["hanzihome", "reader", "pdf-annotation", ownerOrAsset, assetOrPage, pageNumber],
 practiceAttempts: (ownerOrSurface: UserScope, surfaceOrContent: string, contentId?: string) =>
  contentId === undefined
   ? ["hanzihome", "practice-attempts", null, ownerOrSurface, surfaceOrContent]
   : ["hanzihome", "practice-attempts", ownerOrSurface, surfaceOrContent, contentId],
 practiceAttemptsForUser: (userId: UserScope) => ["hanzihome", "practice-attempts", userId],
 practiceAttemptsRecent: (userId: UserScope, surface: string) => [
  "hanzihome",
  "practice-attempts",
  userId,
  surface,
  "recent",
 ],
 practiceAttemptsCount: (userId: UserScope, surface: string, since: string) => [
  "hanzihome",
  "practice-attempts",
  userId,
  surface,
  "count",
  since,
 ],
 homeLearningOverview: (userId: UserScope) => ["hanzihome", "home-learning-overview", userId],
 learningLoop: ["hanzihome", "learning-loop"],
 learningLoopForUser: (userId: UserScope) => ["hanzihome", "learning-loop", userId],
 aiConversationRuntimeHealth: (runtimeKeyId: string) => [
  "hanzihome",
  "ai-conversation",
  "runtime-health",
  runtimeKeyId,
 ],
 ttsLibrary: ["hanzihome", "tts", "library"],
 ttsLibraryForUser: (userId: UserScope) => ["hanzihome", "tts", "library", userId],
 canEdit: ["hanzihome", "can-edit"],
 canEditForUser: (userId: UserScope) => ["hanzihome", "can-edit", userId],
 searchIndexRoot: ["hanzihome", "search-index"],
 searchIndex: ["hanzihome", "search-index", "v2"],
 vocabChildManagerRoot: ["hanzihome", "vocab-child-manager"],
 deletedContent: ["hanzihome", "deleted-content"],
};
