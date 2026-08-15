import type { AggregateFilters, AggregateKind } from "./repositories/hanzihome-content-resources";
import { z } from "zod";

const LessonResourceKindSchema = z.enum(["overview", "sections", "vocabulary", "grammar"]);

export const hanzihomeQueryKeys = {
 root: ["hanzihome"],
 catalogRoot: ["hanzihome", "catalog"],
 catalog: (includeLessons: boolean, includeRadicals = false) => [
  "hanzihome",
  "catalog",
  { includeLessons, includeRadicals },
 ],
 courseLessonsRoot: ["hanzihome", "course-lessons"],
 courseLessons: (courseId: string) => ["hanzihome", "course-lessons", courseId],
 lessonDetail: (lessonId: z.infer<z.ZodNullable<z.ZodString>>) => [
  "hanzihome",
  "lesson-detail",
  lessonId,
 ],
 lessonResource: (lessonId: string, resource: z.infer<typeof LessonResourceKindSchema>) => [
  "hanzihome",
  "lesson-resource",
  lessonId,
  LessonResourceKindSchema.enum[resource],
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
 readerProgress: (documentId: string) => ["hanzihome", "reader", "progress", documentId],
 readerDailyState: (publishedDate: string) => ["hanzihome", "reader", "daily-state", publishedDate],
 readerPersonalState: (nodeId: string) => ["hanzihome", "reader", "personal-state", nodeId],
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
 canEdit: ["hanzihome", "can-edit"],
 searchIndexRoot: ["hanzihome", "search-index"],
 searchIndex: ["hanzihome", "search-index", "v2"],
 vocabChildManagerRoot: ["hanzihome", "vocab-child-manager"],
 deletedContent: ["hanzihome", "deleted-content"],
};
