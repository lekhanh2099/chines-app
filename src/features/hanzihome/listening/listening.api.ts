import type { JsonFieldValue } from "@/types/json";
import { listeningLessonBundleSchema } from "./listening.schemas";

export async function fetchHanziHomeListeningLesson(lessonId: string) {
 const response = await fetch(`/api/hanzihome/listening/lessons/${encodeURIComponent(lessonId)}`, {
  cache: "no-store",
 });
 const payload = (await response.json()) as JsonFieldValue;

 if (!response.ok) {
  const message =
   payload && typeof payload === "object" && "error" in payload
    ? String(payload.error)
    : "Không tải được bài luyện nghe";
  throw new Error(message);
 }

 return listeningLessonBundleSchema.parse(
  payload && typeof payload === "object" && "bundle" in payload ? payload.bundle : payload,
 );
}
