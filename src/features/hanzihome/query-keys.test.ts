import type { JsonFieldValue } from "@/types/json";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { invalidateHanziHomeContent } from "./editing/invalidate-content";
import { hanzihomeQueryKeys } from "./query-keys";

function isInvalidated(queryClient: QueryClient, queryKey: readonly JsonFieldValue[]) {
 return queryClient.getQueryState(queryKey)?.isInvalidated ?? false;
}

describe("hanzihomeQueryKeys", () => {
 it("keeps catalog variants below the catalog root", () => {
  expect(hanzihomeQueryKeys.catalog(false)).toEqual([
   ...hanzihomeQueryKeys.catalogRoot,
   { includeLessons: false, includeRadicals: false },
  ]);
 });

 it("invalidates one lesson without invalidating catalog data", async () => {
  const queryClient = new QueryClient();
  const lessonKey = hanzihomeQueryKeys.lessonDetail("lesson-1");
  const catalogKey = hanzihomeQueryKeys.catalog(false);
  queryClient.setQueryData(lessonKey, { id: "lesson-1" });
  queryClient.setQueryData(catalogKey, { courses: [] });

  await invalidateHanziHomeContent({
   queryClient,
   lessonId: "lesson-1",
   entityType: "vocab_item",
  });

  expect(isInvalidated(queryClient, lessonKey)).toBe(true);
  expect(isInvalidated(queryClient, catalogKey)).toBe(false);
 });

 it("invalidates catalog collections for catalog entities", async () => {
  const queryClient = new QueryClient();
  const catalogKey = hanzihomeQueryKeys.catalog(false);
  const courseLessonsKey = hanzihomeQueryKeys.courseLessons("course-1");
  queryClient.setQueryData(catalogKey, { courses: [] });
  queryClient.setQueryData(courseLessonsKey, []);

  await invalidateHanziHomeContent({
   queryClient,
   entityType: "book",
  });

  expect(isInvalidated(queryClient, catalogKey)).toBe(true);
  expect(isInvalidated(queryClient, courseLessonsKey)).toBe(true);
 });

 it("invalidates only the vocabulary resource for child edits", async () => {
  const queryClient = new QueryClient();
  const lessonKey = hanzihomeQueryKeys.lessonDetail("lesson-1");
  const vocabularyKey = hanzihomeQueryKeys.lessonResource("lesson-1", "vocabulary");
  queryClient.setQueryData(lessonKey, { id: "lesson-1" });
  queryClient.setQueryData(vocabularyKey, { words: [] });

  await invalidateHanziHomeContent({
   queryClient,
   lessonId: "lesson-1",
   entityType: "vocab_example",
  });

  expect(isInvalidated(queryClient, vocabularyKey)).toBe(true);
  expect(isInvalidated(queryClient, lessonKey)).toBe(false);
 });
});
