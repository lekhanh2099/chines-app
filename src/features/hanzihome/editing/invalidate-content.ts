import type { QueryClient } from "@tanstack/react-query";

const catalogEntityTypes = new Set(["course", "book", "lesson"]);

export async function invalidateHanziHomeContent({
 queryClient,
 lessonId,
 entityType,
}: {
 queryClient: QueryClient;
 lessonId?: string;
 entityType: string;
}) {
 if (lessonId) {
  await queryClient.invalidateQueries({
   queryKey: ["hanzihome", "lesson-detail", lessonId],
  });
 }

 if (!catalogEntityTypes.has(entityType)) return;

 await queryClient.invalidateQueries({ queryKey: ["hanzihome", "catalog"] });
 await queryClient.invalidateQueries({ queryKey: ["hanzihome", "course-lessons"] });
}
