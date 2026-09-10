import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import {
 buildHanziHomeLessonHref,
 findLessonByRouteParam,
 getLessonRouteValue,
 type LessonRouteSummary,
} from "./lesson-route";
import { prefetchHanziHomeLessonResources } from "./lesson-prefetch";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

describe("HanziHome lesson-route utilities", () => {
 const sampleLessons: LessonRouteSummary[] = [
  { id: "uuid-lesson-1", lessonNumber: 1, bookId: "book-1" },
  { id: "uuid-lesson-2", lessonNumber: 2, bookId: "book-1" },
  { id: "uuid-lesson-3", lessonNumber: 1, bookId: "book-2" },
 ];

 it("getLessonRouteValue formats lesson number as string", () => {
  expect(getLessonRouteValue(1)).toBe("1");
  expect(getLessonRouteValue(42)).toBe("42");
 });

 it("buildHanziHomeLessonHref constructs canonical URLs with query params", () => {
  const href = buildHanziHomeLessonHref({
   courseId: "course-hanyu",
   bookId: "book-1",
   lessonNumber: 3,
   module: "vocab",
  });

  expect(href).toBe("/hanzihome?courseId=course-hanyu&bookId=book-1&lesson=3&module=vocab");
 });

 it("buildHanziHomeLessonHref omits optional parameters when not provided", () => {
  const href = buildHanziHomeLessonHref({
   courseId: "course-hanyu",
  });

  expect(href).toBe("/hanzihome?courseId=course-hanyu");
 });

 it("findLessonByRouteParam matches by canonical lesson number within book scope", () => {
  const match = findLessonByRouteParam(sampleLessons, "1", undefined, "book-2");
  expect(match?.id).toBe("uuid-lesson-3");
 });

 it("findLessonByRouteParam falls back to legacy UUID lesson ID", () => {
  const match = findLessonByRouteParam(sampleLessons, undefined, "uuid-lesson-2", "book-1");
  expect(match?.id).toBe("uuid-lesson-2");
 });

 it("findLessonByRouteParam returns null when no lesson matches", () => {
  const match = findLessonByRouteParam(sampleLessons, "99", "non-existent", "book-1");
  expect(match).toBeNull();
 });
});

describe("prefetchHanziHomeLessonResources", () => {
 it("dispatches prefetchQuery for both lessonDetail and lessonVocabulary with correct keys and staleTime", () => {
  const queryClient = new QueryClient();
  const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery").mockResolvedValue();

  prefetchHanziHomeLessonResources(queryClient, "test-lesson-id");

  expect(prefetchSpy).toHaveBeenCalledTimes(2);

  expect(prefetchSpy).toHaveBeenCalledWith(
   expect.objectContaining({
    queryKey: hanzihomeQueryKeys.lessonDetail("test-lesson-id"),
    staleTime: Infinity,
   }),
  );

  expect(prefetchSpy).toHaveBeenCalledWith(
   expect.objectContaining({
    queryKey: hanzihomeQueryKeys.lessonResource("test-lesson-id", "vocabulary"),
    staleTime: Infinity,
   }),
  );
 });

 it("does nothing when lessonId is empty or null", () => {
  const queryClient = new QueryClient();
  const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery").mockResolvedValue();

  prefetchHanziHomeLessonResources(queryClient, null);
  prefetchHanziHomeLessonResources(queryClient, undefined);
  prefetchHanziHomeLessonResources(queryClient, "");

  expect(prefetchSpy).not.toHaveBeenCalled();
 });
});
