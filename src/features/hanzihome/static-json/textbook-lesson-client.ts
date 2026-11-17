import { z } from "zod";

import { textbookLessonSchema, type TextbookLesson } from "./textbook-catalog";

/** Cache Storage bucket the service worker serves textbook lessons from when offline. */
export const textbookLessonCacheName = "hanzihome-textbook-lessons";

const textbookLessonResponseSchema = z.object({ lesson: textbookLessonSchema });

export function textbookLessonUrl(bookKey: TextbookLesson["bookKey"], lessonNumber: number) {
 return `/api/hanzihome/textbooks/${bookKey}/lessons/${lessonNumber}`;
}

/** One textbook lesson from the server (or from the offline cache through the service worker). */
export async function fetchTextbookLesson(
 bookKey: TextbookLesson["bookKey"],
 lessonNumber: number,
 signal?: AbortSignal,
): Promise<TextbookLesson> {
 const response = await fetch(textbookLessonUrl(bookKey, lessonNumber), { signal });
 if (!response.ok) throw new Error(`Textbook lesson failed with status ${response.status}`);
 return textbookLessonResponseSchema.parse(await response.json()).lesson;
}

/**
 * Keeps a lesson the learner has opened readable offline, without downloading it
 * again: the page already holds it, so it is written to the offline cache as-is.
 */
export async function rememberTextbookLesson(lesson: TextbookLesson) {
 if (typeof caches === "undefined") return;
 try {
  const cache = await caches.open(textbookLessonCacheName);
  await cache.put(
   textbookLessonUrl(lesson.bookKey, lesson.number),
   new Response(JSON.stringify({ lesson }), {
    headers: { "Content-Type": "application/json" },
   }),
  );
 } catch {
  // Offline availability is best effort; storage can be unavailable or full.
 }
}

/** Lesson numbers of `bookKey` that are kept on this device for offline reading. */
export async function listRememberedTextbookLessons(bookKey: TextbookLesson["bookKey"]) {
 if (typeof caches === "undefined") return [];
 const prefix = textbookLessonUrl(bookKey, 0).slice(0, -1);
 const cache = await caches.open(textbookLessonCacheName);
 return (await cache.keys())
  .map((request) => new URL(request.url).pathname)
  .filter((pathname) => pathname.startsWith(prefix))
  .map((pathname) => Number(pathname.slice(prefix.length)))
  .filter((lessonNumber) => Number.isInteger(lessonNumber))
  .sort((left, right) => left - right);
}
