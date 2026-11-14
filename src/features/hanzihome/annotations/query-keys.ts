import type { useClientSession } from "@/components/providers/QueryProvider";

export const lessonAnnotationQueryKeys = {
 byOwner: (ownerUserId: ReturnType<typeof useClientSession>["userId"]) => [
  "hanzihome",
  "lesson-annotations",
  ownerUserId,
 ],
 byLesson: (ownerUserId: ReturnType<typeof useClientSession>["userId"], lessonId: string) => [
  "hanzihome",
  "lesson-annotations",
  ownerUserId,
  lessonId,
 ],
};
