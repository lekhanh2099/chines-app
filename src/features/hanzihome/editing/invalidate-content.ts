import type { QueryClient } from "@tanstack/react-query";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

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
   queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  });

  if (entityType === "listening_item") {
   await queryClient.invalidateQueries({
    queryKey: hanzihomeQueryKeys.listeningLesson(lessonId),
   });
  }
 }

 if (!catalogEntityTypes.has(entityType)) return;

 await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
 await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.courseLessonsRoot });
}
