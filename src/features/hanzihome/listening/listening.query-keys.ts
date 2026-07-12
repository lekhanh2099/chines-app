import type { ListeningItemQuery } from "./listening.types";

export const listeningQueryKeys = {
 all: ["hanzihome", "listening"] as const,
 lesson: (lessonId: string) => [...listeningQueryKeys.all, "lesson", lessonId] as const,
 items: (query: ListeningItemQuery) =>
  [...listeningQueryKeys.lesson(query.lessonId), "items", query] as const,
};
