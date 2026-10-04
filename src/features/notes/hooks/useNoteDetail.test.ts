import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNoteDetail } from "./useNoteDetail";
import type {
 getNoteById,
 updateNoteContent,
 updateReadingContent,
 updateNoteTitle,
 updateNoteCategory,
 updateSplitViewEnabled,
 deleteNote,
 NoteDetail,
} from "@/services/notes/notes.service";
import type {
 getNoteDraft,
 clearNoteContentDraft,
 clearNoteReadingContentDraft,
 NoteDraftRecord,
} from "@/features/notes/local/note-draft-store";

const noteMocks = vi.hoisted(() => ({
 clearContentDraft: vi.fn<typeof clearNoteContentDraft>(),
 clearReadingDraft: vi.fn<typeof clearNoteReadingContentDraft>(),
 deleteNote: vi.fn<typeof deleteNote>().mockResolvedValue(true),
 getDraft: vi.fn<typeof getNoteDraft>(),
 getNoteById: vi.fn<typeof getNoteById>(),
 updateCategory: vi.fn<typeof updateNoteCategory>().mockResolvedValue(true),
 updateContent: vi.fn<typeof updateNoteContent>(),
 updateReadingContent: vi.fn<typeof updateReadingContent>().mockResolvedValue(true),
 updateSplitViewEnabled: vi.fn<typeof updateSplitViewEnabled>().mockResolvedValue(true),
 updateTitle: vi.fn<typeof updateNoteTitle>().mockResolvedValue(true),
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

vi.mock("@/services/notes/notes.service", () => ({
 getNoteById: noteMocks.getNoteById,
 updateNoteContent: noteMocks.updateContent,
 updateNoteTitle: noteMocks.updateTitle,
 updateNoteCategory: noteMocks.updateCategory,
 deleteNote: noteMocks.deleteNote,
 updateReadingContent: noteMocks.updateReadingContent,
 updateSplitViewEnabled: noteMocks.updateSplitViewEnabled,
}));

vi.mock("@/features/notes/local/note-draft-store", () => ({
 getNoteDraft: noteMocks.getDraft,
 clearNoteContentDraft: noteMocks.clearContentDraft,
 clearNoteReadingContentDraft: noteMocks.clearReadingDraft,
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
  mockUpdateNoteContent.mockResolvedValue(true);
  mockClearNoteDraft.mockResolvedValue(true);

  const hook = renderNoteDetailHook(queryClient, "note-1");
  const content = { text: "saved content" };
  const startedAt = Date.now();
  await hook.saveContent(content);
  await vi.waitFor(() => expect(mockClearNoteDraft).toHaveBeenCalledOnce());
  expect(mockUpdateNoteContent).toHaveBeenCalledWith({}, "note-1", content);
  expect(mockClearNoteDraft.mock.calls[0]?.slice(0, 2)).toEqual(["user-test-1", "note-1"]);
  expect(mockClearNoteDraft.mock.calls[0]?.[2]).toBeGreaterThanOrEqual(startedAt);
  expect(noteMocks.clearReadingDraft).not.toHaveBeenCalled();
 });

 it("preserves the draft when the actual content request fails", async () => {
  mockUpdateNoteContent.mockResolvedValue(false);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  await expect(hook.saveContent({ text: "unsaved" })).rejects.toThrow("Failed to save content");
  await vi.waitFor(() =>
   expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe("error"),
  );
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
 });
 it("serializes A/B and preserves B in cache and draft when A fails", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredBoolean();
  const second = deferredBoolean();
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
  first.resolve(false);
  await failureA;
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledTimes(2));
  expect(renderNoteDetailHook(queryClient, "note-1").note?.content).toEqual({ text: "B" });
  expect(mockClearNoteDraft).not.toHaveBeenCalled();
  second.resolve(true);
  await saveB;
  expect(mockClearNoteDraft).toHaveBeenCalledOnce();
  expect(mockClearNoteDraft.mock.calls[0]?.[3]).toEqual({ text: "B" });
 });
 it("does not restage in-flight A over edit B that is still waiting for its debounce", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredBoolean();
  mockUpdateNoteContent.mockReturnValueOnce(first.promise);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const saving = hook.saveContent({ text: "A" });
  hook.stageContent({ text: "B before debounce" });
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledOnce());
  expect(renderNoteDetailHook(queryClient, "note-1").note?.content).toEqual({
   text: "B before debounce",
  });
  first.resolve(true);
  await saving;
 });

 it("does not let an old reading acknowledgement overwrite a newer reading intent", async () => {
  queryClient.setQueryData(["notes", "user-test-1", "detail", "note-1"], createFixtureNote());
  const first = deferredBoolean();
  const second = deferredBoolean();
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
  first.resolve(true);
  await saveA;
  expect(renderNoteDetailHook(queryClient, "note-1").note?.reading_content).toEqual({
   text: "reading B",
  });
  expect(noteMocks.clearReadingDraft.mock.calls[0]?.[3]).toEqual({ text: "reading A" });
  second.resolve(true);
  await saveB;
 });

 it("serializes metadata with pane writes without blocking a different note", async () => {
  const first = deferredBoolean();
  mockUpdateNoteContent.mockReturnValueOnce(first.promise).mockResolvedValueOnce(true);
  noteMocks.updateTitle.mockResolvedValue(true);
  const hook = renderNoteDetailHook(queryClient, "note-1");
  const save = hook.saveContent({ text: "pending" });
  await vi.waitFor(() => expect(mockUpdateNoteContent).toHaveBeenCalledOnce());
  const title = hook.updateTitle("Updated");
  await renderNoteDetailHook(queryClient, "note-2").saveContent({ text: "independent note" });
  expect(noteMocks.updateTitle).not.toHaveBeenCalled();
  first.resolve(true);
  await save;
  await title;
  expect(noteMocks.updateTitle).toHaveBeenCalledWith({}, "note-1", "Updated");
 });
});

function deferredBoolean() {
 let resolve = (_value: boolean) => {};
 const promise = new Promise<boolean>((complete) => {
  resolve = complete;
 });
 return { promise, resolve };
}
