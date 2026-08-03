import type { AggregateFilters, AggregateKind } from "./repositories/hanzihome-content-resources";
import { z } from "zod";

const LessonResourceKindSchema = z.enum(["overview", "sections", "vocabulary", "grammar"]);

export const hanzihomeQueryKeys = {
 root: ["hanzihome"],
 catalogRoot: ["hanzihome", "catalog"],
 catalog: (includeLessons: boolean) => ["hanzihome", "catalog", { includeLessons }],
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
 canEdit: ["hanzihome", "can-edit"],
 searchIndexRoot: ["hanzihome", "search-index"],
 searchIndex: ["hanzihome", "search-index", "v2"],
 vocabChildManagerRoot: ["hanzihome", "vocab-child-manager"],
 deletedContent: ["hanzihome", "deleted-content"],
};
