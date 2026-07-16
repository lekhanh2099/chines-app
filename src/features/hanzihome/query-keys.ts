import type { AggregateFilters, AggregateKind } from "./repositories/hanzihome-content-resources";

export const hanzihomeQueryKeys = {
 root: ["hanzihome"] as const,
 catalogRoot: ["hanzihome", "catalog"] as const,
 catalog: (includeLessons: boolean) => ["hanzihome", "catalog", { includeLessons }] as const,
 courseLessonsRoot: ["hanzihome", "course-lessons"] as const,
 courseLessons: (courseId: string) => ["hanzihome", "course-lessons", courseId] as const,
 lessonDetail: (lessonId: string | null) => ["hanzihome", "lesson-detail", lessonId] as const,
 lessonResource: (lessonId: string, resource: "overview" | "sections" | "vocabulary" | "grammar") =>
  ["hanzihome", "lesson-resource", lessonId, resource] as const,
 aggregate: (kind: AggregateKind, filters: AggregateFilters) =>
  ["hanzihome", `aggregate-${kind}`, filters] as const,
 listeningLesson: (lessonId: string) => ["hanzihome", "listening", "lesson", lessonId] as const,
 canEdit: ["hanzihome", "can-edit"] as const,
 searchIndexRoot: ["hanzihome", "search-index"] as const,
 searchIndex: ["hanzihome", "search-index", "v2"] as const,
 deletedContent: ["hanzihome", "deleted-content"] as const,
};
