import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "./lesson-annotation-api";
import { lessonAnnotationQueryKeys } from "./query-keys";
import type { AnnotationAnchor, LessonTextAnnotation } from "./types";
import { useLessonAnnotations } from "./useLessonAnnotations";
import type { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import type { NoteDetail } from "@/services/notes/notes.service";

const session = vi.hoisted(() => {
 const state: {
  userId: ReturnType<typeof useClientSession>["userId"];
  isResolved: boolean;
 } = { userId: "user-test-1", isResolved: true };
 return state;
});
vi.mock("@/components/providers/QueryProvider", () => ({ useClientSession: () => session }));

vi.mock("./lesson-annotation-api", async (importOriginal) => ({
 ...(await importOriginal<typeof import("./lesson-annotation-api")>()),
 fetchLessonAnnotations: vi.fn(),
 createLessonAnnotation: vi.fn(),
 updateLessonAnnotationNote: vi.fn(),
 deleteLessonAnnotation: vi.fn(),
}));

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
  note: null,
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
 const queryKey = lessonAnnotationQueryKeys.byLesson("user-test-1", lessonId);

 beforeEach(() => {
  vi.resetAllMocks();
  session.userId = "user-test-1";
  session.isResolved = true;
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
   },
  });
 });

 it("does not reuse another account's annotations even within the same QueryClient", () => {
  const privateAnnotation = createFixtureAnnotation();
  queryClient.setQueryData(queryKey, [privateAnnotation]);
  expect(renderHookProbe(queryClient, lessonId).annotations).toEqual([privateAnnotation]);
  session.userId = "user-test-2";
  expect(renderHookProbe(queryClient, lessonId).annotations).toEqual([]);
  session.userId = null;
  expect(renderHookProbe(queryClient, lessonId).annotations).toEqual([]);
 });

 it.each([false, true])(
  "does not fetch or mutate with an unresolved/guest owner: %s",
  async (isResolved) => {
   session.userId = null;
   session.isResolved = isResolved;
   const hook = renderHookProbe(queryClient, lessonId);
   expect(hook.isLoading).toBe(false);
   expect(api.fetchLessonAnnotations).not.toHaveBeenCalled();
   await expect(hook.deleteAnnotation("annotation-one")).rejects.toThrow();
   expect(api.deleteLessonAnnotation).not.toHaveBeenCalled();
  },
 );

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
    expectedRevision: null,
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

 it("retains the authoritative conflict snapshot and never silently retries against a new base", async () => {
  const original = createFixtureAnnotation();
  const sibling = createFixtureAnnotation({ id: "00000000-0000-4000-8000-000000000002" });
  const server = createFixtureAnnotation({
   noteText: "Other writer committed",
   updatedAt: "2026-10-08T00:00:00Z",
  });
  queryClient.setQueryData(queryKey, [original, sibling]);
  vi
   .mocked(api.updateLessonAnnotationNote)
   .mockRejectedValue(new api.LessonAnnotationConflictError(server));
  const hook = renderHookProbe(queryClient, lessonId);
  const input = {
   annotationId: original.id,
   noteText: "Unsent local intent",
   expectedRevision: null,
  };
  await expect(hook.updateAnnotationNote(input)).rejects.toBeInstanceOf(
   api.LessonAnnotationConflictError,
  );
  expect(api.updateLessonAnnotationNote).toHaveBeenCalledExactlyOnceWith(input, "user-test-1");
  expect(queryClient.getQueryData(queryKey)).toEqual([server, sibling]);
 });

 it.each(["create", "update", "delete"])(
  "invalidates linked Notes after Reader %s without replacing an active draft or another owner",
  async (action) => {
   const note: NoteDetail = {
    id: "note-1",
    user_id: "user-test-1",
    revision: 1,
    title: "Annotation note",
    content: { text: "Committed note" },
    reading_content: null,
    split_view_enabled: false,
    tags: [],
    linked_lesson_id: null,
    is_published: false,
    category: "general",
    status: "draft",
    short_id: null,
    created_at: "2026-10-08T00:00:00Z",
    updated_at: "2026-10-08T00:00:00Z",
    folder_id: null,
    reading_status: null,
    source_url: null,
    source_host: null,
    source_label: null,
    source_author: null,
    source_published_at: null,
    source_captured_at: null,
    links: [],
   };
   const saved = createFixtureAnnotation({ noteId: note.id, note, noteText: "Committed note" });
   queryClient.setQueryData(queryKey, [saved]);
   const keys = [
    noteQueryKeys.listRoot("user-test-1"),
    noteQueryKeys.recent("user-test-1", 3),
    noteQueryKeys.recent("user-test-1", 10),
    noteQueryKeys.lessonLinked("user-test-1", [lessonId], "annotation"),
    noteQueryKeys.detail("user-test-1", note.id),
   ];
   for (const key of keys) queryClient.setQueryData(key, []);
   const activeDraft = { ...note, content: { text: "New unsaved local intent" } };
   queryClient.setQueryData(noteQueryKeys.detail("user-test-1", note.id), activeDraft);
   const siblingKey = noteQueryKeys.detail("user-test-1", "note-sibling");
   const otherOwnerKey = noteQueryKeys.recent("user-test-2", 3);
   queryClient.setQueryData(siblingKey, { ...note, id: "note-sibling" });
   queryClient.setQueryData(otherOwnerKey, []);
   const hook = renderHookProbe(queryClient, lessonId);
   if (action === "create") {
    vi.mocked(api.createLessonAnnotation).mockResolvedValue(saved);
    const anchor = {
     lessonId: saved.lessonId,
     nodeType: saved.nodeType,
     nodeId: saved.nodeId,
     startOffset: saved.startOffset,
     endOffset: saved.endOffset,
     selectedText: saved.selectedText,
     prefixText: saved.prefixText,
     suffixText: saved.suffixText,
    };
    await hook.createAnnotation({ anchor, noteText: "Committed note" });
   } else if (action === "update") {
    const input = { annotationId: saved.id, noteText: "Committed note", expectedRevision: 0 };
    vi.mocked(api.updateLessonAnnotationNote).mockRejectedValueOnce(new Error("Network failed"));
    await expect(hook.updateAnnotationNote(input)).rejects.toThrow("Network failed");
    for (const key of keys) expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    vi.mocked(api.updateLessonAnnotationNote).mockResolvedValue(saved);
    await hook.updateAnnotationNote(input);
   } else {
    vi.mocked(api.deleteLessonAnnotation).mockResolvedValue(true);
    await hook.deleteAnnotation(saved.id);
   }
   for (const key of keys) expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
   expect(queryClient.getQueryData(noteQueryKeys.detail("user-test-1", note.id))).toEqual(
    activeDraft,
   );
   expect(queryClient.getQueryState(siblingKey)?.isInvalidated).toBe(false);
   expect(queryClient.getQueryState(otherOwnerKey)?.isInvalidated).toBe(false);
  },
 );
});
