import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "./lesson-annotation-api";
import { lessonAnnotationQueryKeys } from "./query-keys";
import type { AnnotationAnchor, LessonTextAnnotation } from "./types";
import { useLessonAnnotations } from "./useLessonAnnotations";

vi.mock("./lesson-annotation-api");

function createFixtureAnnotation(overrides?: Partial<LessonTextAnnotation>): LessonTextAnnotation {
 return {
  id: "00000000-0000-4000-8000-000000000001",
  lessonId: "lesson-1",
  nodeType: "reading",
  nodeId: "node-1",
  startOffset: 0,
  endOffset: 5,
  selectedText: "你好",
  prefixText: "",
  suffixText: "",
  tone: "focus",
  noteId: null,
  noteText: "Initial note",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
  ...overrides,
 };
}

function renderHookProbe(queryClient: QueryClient, lessonId: string) {
 let hookValue: ReturnType<typeof useLessonAnnotations> | undefined;
 function Probe() {
  hookValue = useLessonAnnotations(lessonId);
  return null;
 }
 renderToStaticMarkup(
  createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
 );
 if (!hookValue) throw new Error("Probe failed to capture hook value");
 return hookValue;
}

describe("useLessonAnnotations optimistic mutations", () => {
 let queryClient: QueryClient;
 const lessonId = "lesson-1";
 const queryKey = lessonAnnotationQueryKeys.byLesson(lessonId);

 beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
   },
  });
 });

 it("optimistically adds annotation and reconciles canonical server entity on success", async () => {
  const existing = createFixtureAnnotation();
  queryClient.setQueryData(queryKey, [existing]);

  const serverReturned: LessonTextAnnotation = {
   ...existing,
   id: "00000000-0000-4000-8000-000000000099",
   noteText: "New note",
   selectedText: "谢谢",
   createdAt: "2026-09-10T01:00:00.000Z",
   updatedAt: "2026-09-10T01:00:00.000Z",
  };

  let resolveApi: (val: LessonTextAnnotation) => void = () => {};
  vi.mocked(api.createLessonAnnotation).mockImplementation(
   () =>
    new Promise((resolve) => {
     resolveApi = resolve;
    }),
  );

  const hook = renderHookProbe(queryClient, lessonId);

  const anchor: AnnotationAnchor = {
   lessonId,
   nodeType: "reading",
   nodeId: "node-1",
   startOffset: 6,
   endOffset: 10,
   selectedText: "谢谢",
   prefixText: "",
   suffixText: "",
  };

  const mutatePromise = hook.createAnnotation({ anchor, noteText: "New note" });

  // Verify optimistic item is immediately visible in cache before network resolves
  await vi.waitFor(() => {
   const optimisticCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
   expect(optimisticCache).toHaveLength(2);
   expect(optimisticCache?.[0]?.id).toBe(existing.id);
   expect(optimisticCache?.[1]?.id).toMatch(/^optimistic-/);
   expect(optimisticCache?.[1]?.selectedText).toBe("谢谢");
  });

  // Server returns canonical entity
  resolveApi(serverReturned);
  await mutatePromise;

  // Verify cache replaced optimistic temporary ID with canonical server entity
  const finalCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
  expect(finalCache).toHaveLength(2);
  expect(finalCache?.[1]?.id).toBe("00000000-0000-4000-8000-000000000099");
  expect(finalCache?.[1]?.noteText).toBe("New note");
 });

 it("rolls back only the failed annotation on error without wiping concurrent additions", async () => {
  const existing = createFixtureAnnotation();
  queryClient.setQueryData(queryKey, [existing]);

  vi.mocked(api.createLessonAnnotation).mockRejectedValue(new Error("Network failure"));

  const hook = renderHookProbe(queryClient, lessonId);

  const anchorA: AnnotationAnchor = {
   lessonId,
   nodeType: "reading",
   nodeId: "node-1",
   startOffset: 10,
   endOffset: 15,
   selectedText: "A",
   prefixText: "",
   suffixText: "",
  };

  // Simulate mutation A that will fail
  const promiseA = hook.createAnnotation({ anchor: anchorA, noteText: "Note A" }).catch(() => null);

  // Simultaneously, another item B is added to the cache (e.g. from another mutation or local interaction)
  const concurrentItem = createFixtureAnnotation({
   id: "00000000-0000-4000-8000-000000000002",
   selectedText: "B",
  });
  queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, (current) => [
   ...(current ?? []),
   concurrentItem,
  ]);

  await promiseA;

  // Item A should be removed, but existing AND concurrentItem B MUST remain!
  const finalCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
  expect(finalCache?.some((item) => item.id === existing.id)).toBe(true);
  expect(finalCache?.some((item) => item.id === concurrentItem.id)).toBe(true);
  expect(finalCache?.some((item) => item.selectedText === "A")).toBe(false);
 });

 it("optimistically updates noteText and reverts only the affected field on error", async () => {
  const existing1 = createFixtureAnnotation({
   id: "00000000-0000-4000-8000-000000000001",
   noteText: "Original 1",
  });
  const existing2 = createFixtureAnnotation({
   id: "00000000-0000-4000-8000-000000000002",
   noteText: "Original 2",
  });
  queryClient.setQueryData(queryKey, [existing1, existing2]);

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.updateLessonAnnotationNote).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  const hook = renderHookProbe(queryClient, lessonId);

  const promise = hook
   .updateAnnotationNote({
    annotationId: existing1.id,
    noteText: "Updated optimistically",
   })
   .catch(() => null);

  // Check optimistic update in cache while request is in-flight
  await vi.waitFor(() => {
   const optimisticCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
   expect(optimisticCache?.find((i) => i.id === existing1.id)?.noteText).toBe(
    "Updated optimistically",
   );
  });

  // Fail the request
  rejectApi(new Error("Update failed"));
  await promise;

  // After failure, only existing1 noteText is rolled back, existing2 is untouched
  const finalCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
  expect(finalCache?.find((i) => i.id === existing1.id)?.noteText).toBe("Original 1");
  expect(finalCache?.find((i) => i.id === existing2.id)?.noteText).toBe("Original 2");
 });

 it("optimistically deletes annotation and restores it on error", async () => {
  const existing1 = createFixtureAnnotation({ id: "00000000-0000-4000-8000-000000000001" });
  const existing2 = createFixtureAnnotation({ id: "00000000-0000-4000-8000-000000000002" });
  queryClient.setQueryData(queryKey, [existing1, existing2]);

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.deleteLessonAnnotation).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  const hook = renderHookProbe(queryClient, lessonId);

  const promise = hook.deleteAnnotation(existing1.id).catch(() => null);

  // Optimistically removed while in-flight
  await vi.waitFor(() => {
   const optimisticCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
   expect(optimisticCache).toHaveLength(1);
   expect(optimisticCache?.[0]?.id).toBe(existing2.id);
  });

  // Fail the request
  rejectApi(new Error("Delete failed"));
  await promise;

  // Restored on error at original index
  const finalCache = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey);
  expect(finalCache).toHaveLength(2);
  expect(finalCache?.[0]?.id).toBe(existing1.id);
  expect(finalCache?.[1]?.id).toBe(existing2.id);
 });
});
