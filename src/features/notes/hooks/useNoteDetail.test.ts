import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DbNote } from "@/types/database";
import { NoteConflictError } from "@/services/notes/notes.service";
import { useNoteDetail } from "./useNoteDetail";
import { useUpdateNoteLibraryMetadata } from "./useNoteLibrary";
import { lessonAnnotationQueryKeys } from "@/features/hanzihome/annotations/query-keys";
import { fetchLessonAnnotations } from "@/features/hanzihome/annotations/lesson-annotation-api";
import type { LessonTextAnnotation } from "@/features/hanzihome/annotations/types";
import type {
 getNoteById,
 updateNoteContent,
 updateReadingContent,
 updateNoteTitle,
 updateNoteCategory,
 updateSplitViewEnabled,
 deleteNote,
 NoteDetail,
 updateNoteLibraryMetadata,
} from "@/services/notes/notes.service";
import type {
 getNoteDraft,
 clearNoteContentDraft,
 clearNoteReadingContentDraft,
 advanceNoteDraftRevision,
 NoteDraftRecord,
} from "@/features/notes/local/note-draft-store";

const noteMocks = vi.hoisted(() => ({
 clearContentDraft: vi.fn<typeof clearNoteContentDraft>(),
 clearReadingDraft: vi.fn<typeof clearNoteReadingContentDraft>(),
 deleteNote: vi.fn<typeof deleteNote>(),
 getDraft: vi.fn<typeof getNoteDraft>(),
 getNoteById: vi.fn<typeof getNoteById>(),
 updateCategory: vi.fn<typeof updateNoteCategory>(),
 updateContent: vi.fn<typeof updateNoteContent>(),
 updateReadingContent: vi.fn<typeof updateReadingContent>(),
 updateSplitViewEnabled: vi.fn<typeof updateSplitViewEnabled>(),
 updateTitle: vi.fn<typeof updateNoteTitle>(),
 updateLibraryMetadata: vi.fn<typeof updateNoteLibraryMetadata>(),
 advanceDraftRevision: vi.fn<typeof advanceNoteDraftRevision>(),
}));

const mockGetNoteById = noteMocks.getNoteById;
const mockUpdateNoteContent = noteMocks.updateContent;
const mockGetNoteDraft = noteMocks.getDraft;
const mockClearNoteDraft = noteMocks.clearContentDraft;

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  supabase: {},
  userId: "user-test-1",
  isResolved: true,
 }),
}));

vi.mock(import("@/services/notes/notes.service"), async (importOriginal) => ({
 ...(await importOriginal()),
 getNoteById: noteMocks.getNoteById,
 updateNoteContent: noteMocks.updateContent,
 updateNoteTitle: noteMocks.updateTitle,
 updateNoteCategory: noteMocks.updateCategory,
 deleteNote: noteMocks.deleteNote,
 updateReadingContent: noteMocks.updateReadingContent,
 updateSplitViewEnabled: noteMocks.updateSplitViewEnabled,
 updateNoteLibraryMetadata: noteMocks.updateLibraryMetadata,
}));

vi.mock("@/features/notes/local/note-draft-store", () => ({
 getNoteDraft: noteMocks.getDraft,
 getOtherNoteDrafts: async () => [],
 recoverNoteDraft: async () => true,
 advanceNoteDraftRevision: noteMocks.advanceDraftRevision,
 clearNoteDraft: async () => true,
 clearNoteContentDraft: noteMocks.clearContentDraft,
 clearNoteReadingContentDraft: noteMocks.clearReadingDraft,
}));
vi.mock("@/features/hanzihome/annotations/lesson-annotation-api", () => ({
 fetchLessonAnnotations: vi.fn(),
}));

function createFixtureNote(overrides?: Partial<NoteDetail>): NoteDetail {
 return {
  id: "note-1",
  user_id: "user-test-1",
  title: "Test Note",
  category: "general",
  tags: ["vocab"],
  content: { root: { children: [{ text: "server content" }] } },
  reading_content: null,
  folder_id: null,
  split_view_enabled: false,
  reading_status: null,
  linked_lesson_id: null,
  is_published: false,
  status: "draft",
  short_id: null,
  source_url: null,
  source_host: null,
  source_label: null,
  source_author: null,
  source_published_at: null,
  source_captured_at: null,
  revision: 0,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T10:00:00.000Z",
  links: [],
  ...overrides,
 };
}

// Captures real callbacks and Query options. SSR does not exercise effects,
// React rerenders or editor wiring; requests and local storage are controlled.
function renderNoteDetailHook(queryClient: QueryClient, noteId: string) {
 const captures: ReturnType<typeof useNoteDetail>[] = [];
 function Probe() {
  captures.push(useNoteDetail(noteId));
  return null;
 }
 renderToStaticMarkup(
  createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
 );
 const hookValue = captures[0];
 if (!hookValue) throw new Error("Probe failed to capture hook value");
 return hookValue;
}

describe("useNoteDetail", () => {
 let queryClient: QueryClient;

 beforeEach(() => {
  vi.resetAllMocks();
  mockGetNoteDraft.mockResolvedValue(null);
  noteMocks.advanceDraftRevision.mockResolvedValue(true);
  noteMocks.deleteNote.mockResolvedValue(true);
  noteMocks.updateContent.mockImplementation(async (_client, id, content, revision) =>
   createFixtureNote({ id, content, revision: revision + 1 }),
  );
  noteMocks.updateReadingContent.mockImplementation(
   async (_client, _id, reading_content, revision) =>
    createFixtureNote({ reading_content, revision: revision + 1 }),
  );
  noteMocks.updateTitle.mockImplementation(async (_client, _id, title, revision) =>
   createFixtureNote({ title, revision: revision + 1 }),
  );
  noteMocks.updateCategory.mockImplementation(async (_client, _id, category, revision) =>
   createFixtureNote({ category, revision: revision + 1 }),
  );
  noteMocks.updateSplitViewEnabled.mockImplementation(
   async (_client, _id, split_view_enabled, revision) =>
    createFixtureNote({ split_view_enabled, revision: revision + 1 }),
  );
  noteMocks.updateLibraryMetadata.mockImplementation(async (_client, _id, input, revision) =>
   createFixtureNote({ folder_id: input.folderId ?? null, revision: revision + 1 }),
  );
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
   },
  });
 });

 afterEach(() => queryClient.clear());

 async function fetchNote() {
  const query = queryClient.getQueryCache().find({
   queryKey: ["notes", "user-test-1", "detail", "note-1"],
  });
  if (!query) throw new Error("Hook did not register its query");
  await query.fetch();
  return renderNoteDetailHook(queryClient, "note-1");
 }

 it("advances metadata revision only after acknowledgement and preserves staged panes", async () => {
  const staged = createFixtureNote({
   content: { text: "Dirty local body" },
   reading_content: { text: "Dirty local reading" },
   revision: 3,
  });
  const key = ["notes", "user-test-1", "detail", "note-1"];
  const listKey = ["notes", "user-test-1", "list"];
  queryClient.setQueryData(key, staged);
  queryClient.setQueryData(listKey, []);
  const captures: ReturnType<typeof useUpdateNoteLibraryMetadata>[] = [];
  function Probe() {
   captures.push(useUpdateNoteLibraryMetadata("note-1"));
   return null;
  }
  renderToStaticMarkup(
   createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
  );
  const mutation = captures[0];
  if (!mutation) throw new Error("Missing library metadata mutation");
  const saved = createFixtureNote({
   title: "Acknowledged server title",
   folder_id: "folder",
   revision: 4,
  });
  let release = () => {};
  noteMocks.updateLibraryMetadata.mockImplementationOnce(
   () =>
    new Promise((resolve) => {
     release = () => resolve(saved);
    }),
  );
  const pending = mutation.mutateAsync({
   noteId: "note-1",
   expectedRevision: 3,
   title: "Acknowledged server title",
   folderId: "folder",
  });
  await vi.waitFor(() => expect(noteMocks.updateLibraryMetadata).toHaveBeenCalledOnce());
  expect(noteMocks.updateLibraryMetadata).toHaveBeenCalledWith(
   {},
   "note-1",
   {
    noteId: "note-1",
    expectedRevision: 3,
    title: "Acknowledged server title",
    folderId: "folder",
   },
   3,
   "user-test-1",
  );
  expect(noteMocks.advanceDraftRevision).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(key)).toEqual(staged);
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false);
  release();
  await pending;
  expect(noteMocks.advanceDraftRevision).toHaveBeenCalledWith("user-test-1", "note-1", 3, 4);
  expect(queryClient.getQueryData(key)).toEqual({
   ...staged,
   revision: 4,
   updated_at: saved.updated_at,
  });
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);

  queryClient.setQueryData(key, staged);
  queryClient.setQueryData(listKey, []);
  noteMocks.advanceDraftRevision.mockClear();
  noteMocks.updateLibraryMetadata.mockRejectedValueOnce(new Error("Write failed"));
  await expect(
   mutation.mutateAsync({ noteId: "note-1", expectedRevision: 3, folderId: null }),
  ).rejects.toThrow("Write failed");
  expect(noteMocks.advanceDraftRevision).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(key)).toEqual(staged);
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false);
  noteMocks.updateLibraryMetadata.mockRejectedValueOnce(new NoteConflictError(saved));
  await expect(
   mutation.mutateAsync({ noteId: "note-1", expectedRevision: 3, folderId: null }),
  ).rejects.toThrow(NoteConflictError);
  expect(noteMocks.advanceDraftRevision).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(key)).toEqual(staged);
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false);
 });

 it("returns server note when no local draft exists", async () => {
  const serverNote = createFixtureNote();
  mockGetNoteById.mockResolvedValue(serverNote);
  mockGetNoteDraft.mockResolvedValue(null);

  const hook = renderNoteDetailHook(queryClient, "note-1");
  expect(hook.isLoading).toBe(true);

  const updatedHook = await fetchNote();
  expect(mockGetNoteById).toHaveBeenCalledWith({}, "note-1", "user-test-1");
  expect(updatedHook.note?.title).toBe("Test Note");
  expect(updatedHook.note?.content).toEqual(serverNote.content);
 });

 it("hydrates local draft content when local draft is newer than server updated_at", async () => {
  const serverNote = createFixtureNote({
   updated_at: "2026-09-01T10:00:00.000Z",
  });
  const draftTime = new Date("2026-09-01T11:00:00.000Z").getTime();
  const localDraft: NoteDraftRecord = {
   key: "user-test-1:note-1",
   userId: "user-test-1",
   noteId: "note-1",
   content: { root: { children: [{ text: "draft content preserved" }] } },
   readingContent: null,
   updatedAt: draftTime,
  };

  mockGetNoteById.mockResolvedValue(serverNote);
  mockGetNoteDraft.mockResolvedValue(localDraft);

  renderNoteDetailHook(queryClient, "note-1");
  const hook = await fetchNote();
  expect(mockGetNoteDraft).toHaveBeenCalledWith("user-test-1", "note-1");
  expect(hook.note?.content).toEqual(localDraft.content);
 });

 it("acknowledges the content pane only after its actual request succeeds", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());

  const hook = renderNoteDetailHook(queryClient, "note-1");
  const content = { text: "saved content" };
  const startedAt = Date.now();
  await hook.saveContent(content);
  await vi.waitFor(() => expect(mockClearNoteDraft).toHaveBeenCalledOnce());
  expect(mockUpdateNoteContent).toHaveBeenCalledWith({}, "note-1", content, 0, "user-test-1");
  expect(mockClearNoteDraft.mock.calls[0]?.slice(0, 2)).toEqual(["user-test-1", "note-1"]);
  expect(mockClearNoteDraft.mock.calls[0]?.[2]).toBeGreaterThanOrEqual(startedAt);
  expect(noteMocks.clearReadingDraft).not.toHaveBeenCalled();
 });

 it("preserves the draft when the actual content request fails", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  mockUpdateNoteContent.mockRejectedValue(new Error("Failed to save content"));
  const hook = renderNoteDetailHook(queryClient, "note-1");
  await expect(hook.saveContent({ text: "unsaved" })).rejects.toThrow("Failed to save content");
  await vi.waitFor(() =>
   expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe("error"),
  );
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
 });

 it.each(["content", "reading", "title", "category", "split", "delete", "library"])(
  "refreshes only linked annotation lessons after committed Notes %s",
  async (action) => {
   const linked = createFixtureNote({
    links: [
     {
      noteId: "note-1",
      targetType: "hanzihome_lesson",
      targetKey: "lesson-1",
      relationType: "annotation",
      updatedAt: "2026-10-08T00:00:00Z",
     },
    ],
   });
   queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], linked);
   const targetKey = lessonAnnotationQueryKeys.byLesson("user-test-1", "lesson-1");
   const siblingKey = lessonAnnotationQueryKeys.byLesson("user-test-1", "lesson-2");
   const otherOwnerKey = lessonAnnotationQueryKeys.byLesson("user-test-2", "lesson-1");
   for (const key of [targetKey, siblingKey, otherOwnerKey]) queryClient.setQueryData(key, []);
   const hook = renderNoteDetailHook(queryClient, "note-1");
   if (action === "content") {
    mockUpdateNoteContent.mockRejectedValueOnce(new Error("Network failed"));
    await expect(hook.saveContent({ text: "Failed" })).rejects.toThrow("Network failed");
    expect(queryClient.getQueryState(targetKey)?.isInvalidated).toBe(false);
    await hook.saveContent({ text: "Committed" });
   } else if (action === "reading") await hook.saveReadingContent({ text: "Committed reading" });
   else if (action === "title") await hook.updateTitle("Committed title");
   else if (action === "category") await hook.updateCategory("general");
   else if (action === "split") await hook.updateSplitView(true);
   else if (action === "delete") await hook.deleteNote();
   else {
    const annotation: LessonTextAnnotation = {
     id: "annotation-1",
     lessonId: "lesson-1",
     nodeType: "paragraph",
     nodeId: "paragraph-1",
     startOffset: 0,
     endOffset: 2,
     selectedText: "你好",
     prefixText: "",
     suffixText: "",
     tone: "focus",
     noteId: linked.id,
     note: linked,
     noteText: "Before metadata",
     createdAt: linked.created_at,
     updatedAt: linked.updated_at,
    };
    queryClient.setQueryData(targetKey, [annotation]);
    queryClient.setQueryData(siblingKey, [{ ...annotation, noteId: "note-sibling" }]);
    queryClient.setQueryData(otherOwnerKey, [annotation]);
    queryClient.removeQueries({
     queryKey: ["notes", "user-test-1", "detail", "note-1"],
     exact: true,
    });
    const captures: ReturnType<typeof useUpdateNoteLibraryMetadata>[] = [];
    function Probe() {
     captures.push(useUpdateNoteLibraryMetadata("note-1"));
     return null;
    }
    renderToStaticMarkup(
     createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
    );
    const mutation = captures[0];
    if (!mutation) throw new Error("Missing library metadata mutation");
    await mutation.mutateAsync({ noteId: "note-1", expectedRevision: 0, folderId: "folder-1" });
   }
   expect(queryClient.getQueryState(targetKey)?.isInvalidated).toBe(true);
   expect(queryClient.getQueryState(siblingKey)?.isInvalidated).toBe(false);
   expect(queryClient.getQueryState(otherOwnerKey)?.isInvalidated).toBe(false);
  },
 );

 it("refetches an active Reader query subscriber after Notes saves without a request after a failed write", async () => {
  const note = createFixtureNote({
   links: [
    {
     noteId: "note-1",
     targetType: "hanzihome_lesson",
     targetKey: "lesson-1",
     relationType: "annotation",
     updatedAt: "2026-10-08T00:00:00Z",
    },
   ],
  });
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], note);
  const annotation: LessonTextAnnotation = {
   id: "annotation-1",
   lessonId: "lesson-1",
   nodeType: "paragraph",
   nodeId: "paragraph-1",
   startOffset: 0,
   endOffset: 2,
   selectedText: "你好",
   prefixText: "",
   suffixText: "",
   tone: "focus",
   noteId: note.id,
   note,
   noteText: "Before save",
   createdAt: note.created_at,
   updatedAt: note.updated_at,
  };
  vi.mocked(fetchLessonAnnotations).mockResolvedValue([annotation]);
  const key = lessonAnnotationQueryKeys.byLesson("user-test-1", "lesson-1");
  const observer = new QueryObserver(queryClient, {
   queryKey: key,
   staleTime: Infinity,
   queryFn: () => fetchLessonAnnotations("lesson-1", "user-test-1"),
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
   await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual([annotation]));
   const hook = renderNoteDetailHook(queryClient, "note-1");
   mockUpdateNoteContent.mockRejectedValueOnce(new Error("Failed write"));
   await expect(hook.saveContent({ text: "Failed" })).rejects.toThrow("Failed write");
   expect(fetchLessonAnnotations).toHaveBeenCalledTimes(1);
   const committed = {
    ...annotation,
    noteText: "Saved from Notes",
    note: { ...note, revision: 1, content: { text: "Saved from Notes" } },
   };
   vi.mocked(fetchLessonAnnotations).mockResolvedValue([committed]);
   await hook.saveContent({ text: "Saved from Notes" });
   await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual([committed]));
   expect(fetchLessonAnnotations).toHaveBeenCalledTimes(2);
   expect(fetchLessonAnnotations).toHaveBeenLastCalledWith("lesson-1", "user-test-1");
  } finally {
   unsubscribe();
  }
 });
 it("serializes A/B and preserves B in cache and draft when A fails", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredNote();
  const second = deferredNote();
  mockUpdateNoteContent.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const saveA = hook.saveContent({ text: "A" });
  const failureA = expect(saveA).rejects.toThrow("Failed to save content");
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledOnce());
  const saveB = hook.saveContent({ text: "B" });
  await vi.waitFor(() =>
   expect(renderNoteDetailHook(queryClient, "note-1").note?.content).toEqual({ text: "B" }),
  );
  expect(mockUpdateNoteContent).toHaveBeenCalledOnce();
  first.reject(new Error("Failed to save content"));
  await failureA;
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledTimes(2));
  expect(renderNoteDetailHook(queryClient, "note-1").note?.content).toEqual({ text: "B" });
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
  second.resolve(createFixtureNote({ revision: 1 }));
  await saveB;
  expect(mockClearNoteDraft).toHaveBeenCalledOnce();
  expect(mockClearNoteDraft.mock.calls[0]?.[3]).toEqual({ text: "B" });
 });
 it("does not restage in-flight A over edit B that is still waiting for its debounce", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredNote();
  mockUpdateNoteContent.mockReturnValueOnce(first.promise);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const saving = hook.saveContent({ text: "A" });
  hook.stageContent({ text: "B before debounce" });
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledOnce());
  expect(renderNoteDetailHook(queryClient, "note-1").note?.content).toEqual({
   text: "B before debounce",
  });
  first.resolve(createFixtureNote({ revision: 1 }));
  await saving;
 });

 it("does not let an old reading acknowledgement overwrite a newer reading intent", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredNote();
  const second = deferredNote();
  noteMocks.updateReadingContent
   .mockReturnValueOnce(first.promise)
   .mockReturnValueOnce(second.promise);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const saveA = hook.saveReadingContent({ text: "reading A" });
  await vi.waitFor(() => expect(noteMocks.updateReadingContent).toHaveBeenCalledOnce());
  const saveB = hook.saveReadingContent({ text: "reading B" });
  await vi.waitFor(() =>
   expect(renderNoteDetailHook(queryClient, "note-1").note?.reading_content).toEqual({
    text: "reading B",
   }),
  );
  first.resolve(createFixtureNote({ revision: 1 }));
  await saveA;
  expect(renderNoteDetailHook(queryClient, "note-1").note?.reading_content).toEqual({
   text: "reading B",
  });
  expect(noteMocks.clearReadingDraft.mock.calls[0]?.[3]).toEqual({ text: "reading A" });
  second.resolve(createFixtureNote({ revision: 2 }));
  await saveB;
 });

 it("serializes metadata with pane writes without blocking a different note", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  queryClient.setQueryData(
   ["notes", "user-test-1", "detail", "note-2"],
   createFixtureNote({ id: "note-2" }),
  );
  const first = deferredNote();
  mockUpdateNoteContent.mockReturnValueOnce(first.promise);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const save = hook.saveContent({ text: "pending" });
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledOnce());
  const title = hook.updateTitle("Updated");
  await renderNoteDetailHook(queryClient, "note-2").saveContent({ text: "independent note" });
  expect(noteMocks.updateTitle).not.toHaveBeenCalled();
  first.resolve(createFixtureNote({ revision: 1 }));
  await save;
  await title;
  expect(noteMocks.updateTitle).toHaveBeenCalledWith({}, "note-1", "Updated", 1, "user-test-1");
 });
 it("blocks a legacy draft restored by prefetch until the user chooses a version", async () => {
  const server = createFixtureNote({ revision: 3 });
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], server);
  mockGetNoteById.mockResolvedValue(server);
  mockGetNoteDraft.mockResolvedValue({
   key: "user-test-1:note-1",
   userId: "user-test-1",
   noteId: "note-1",
   content: { text: "legacy intent" },
   updatedAt: 100,
  });
  const hook = renderNoteDetailHook(queryClient, "note-1");
  await expect(hook.saveContent({ text: "legacy intent" })).rejects.toBeInstanceOf(
   NoteConflictError,
  );
  await expect(hook.saveContent({ text: "still local" })).rejects.toBeInstanceOf(NoteConflictError);
  expect(mockUpdateNoteContent).not.toHaveBeenCalled();
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
  await hook.resolveConflict(true);
  expect(queryClient.getQueryData(["notes", "user-test-1", "detail", "note-1"])).toEqual(server);
 });
 it("keeps staged content on CAS conflict and resumes only after an explicit choice", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const server = createFixtureNote({ revision: 2, content: { text: "remote" } });
  mockUpdateNoteContent.mockRejectedValueOnce(new NoteConflictError(server));
  const hook = renderNoteDetailHook(queryClient, "note-1");
  await expect(hook.saveContent({ text: "local" })).rejects.toBeInstanceOf(NoteConflictError);
  expect(queryClient.getQueryData(["notes", "user-test-1", "detail", "note-1"])).toMatchObject({
   content: { text: "local" },
   revision: 0,
  });
  await expect(hook.updateTitle("local title")).rejects.toBeInstanceOf(NoteConflictError);
  expect(noteMocks.updateTitle).not.toHaveBeenCalled();
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
  await hook.resolveConflict(false);
  await hook.saveContent({ text: "local" });
  expect(mockUpdateNoteContent).toHaveBeenLastCalledWith(
   {},
   "note-1",
   { text: "local" },
   2,
   "user-test-1",
  );
 });
});

function deferredNote() {
 let resolve = (_value: DbNote) => {};
 let reject = (_error: Error) => {};
 const promise = new Promise<DbNote>((complete, fail) => {
  resolve = complete;
  reject = fail;
 });
 return { promise, resolve, reject };
}
