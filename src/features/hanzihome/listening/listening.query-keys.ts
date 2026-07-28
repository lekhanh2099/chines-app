import type { ListeningItemQuery } from "./listening.types";

export const listeningQueryKeys = {
 all: ["hanzihome", "listening"],
 lesson: (lessonId: string) => [...listeningQueryKeys.all, "lesson", lessonId],
 items: (query: ListeningItemQuery) => [
  ...listeningQueryKeys.lesson(query.lessonId),
  "items",
  query,
 ],
};
