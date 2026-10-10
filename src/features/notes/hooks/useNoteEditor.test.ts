import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DbNote } from "@/types/database";
import { useNoteEditor } from "./useNoteEditor";
import type {
 updateNoteContent,
 updateReadingContent,
 updateNoteLibraryMetadata,
 NoteDetail,
} from "@/services/notes/notes.service";
import type { saveNoteDraft } from "../local/note-draft-store";
import { NoteExportPayloadSchema } from "../note-export.schema";
import { noteQueryKeys } from "../query-keys";

const mocks = vi.hoisted(() => ({
 content: vi.fn<typeof updateNoteContent>(),
 reading: vi.fn<typeof updateReadingContent>(),
 metadata: vi.fn<typeof updateNoteLibraryMetadata>(),
 draft: vi.fn<typeof saveNoteDraft>(),
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ supabase: {}, userId: "user-test-1", isResolved: true }),
}));
vi.mock(import("@/services/notes/notes.service"), async (importOriginal) => ({
 ...(await importOriginal()),
 updateNoteContent: mocks.content,
 updateReadingContent: mocks.reading,
 updateNoteLibraryMetadata: mocks.metadata,
 getNoteById: async () => null,
 getNoteFolders: async () => [],
 updateNoteTitle: async (_client, _id, title, revision) =>
  createFixtureNote({ title, revision: revision + 1 }),
 updateNoteCategory: async (_client, _id, category, revision) =>
  createFixtureNote({ category, revision: revision + 1 }),
 updateSplitViewEnabled: async (_client, _id, split_view_enabled, revision) =>
  createFixtureNote({ split_view_enabled, revision: revision + 1 }),
 deleteNote: async () => true,
}));
vi.mock("../local/note-draft-store", () => ({
 saveNoteDraft: mocks.draft,
 getNoteDraft: async () => null,
 advanceNoteDraftRevision: async () => true,
 getOtherNoteDrafts: async () => [],
 recoverNoteDraft: async () => true,
 clearNoteDraft: async () => true,
 clearNoteContentDraft: async () => true,
 clearNoteReadingContentDraft: async () => true,
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

let client: QueryClient;
const downloads: Blob[] = [];
function controller() {
 const captures: ReturnType<typeof useNoteEditor>[] = [];
 function Probe() {
  captures.push(useNoteEditor("note-1"));
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing editor hook");
 return hook;
}
function importFile(text: string) {
 return new File(
  [
   JSON.stringify({
    version: 1,
    note: { title: "Test Note", category: "general", content: { text } },
   }),
  ],
  "note.json",
  { type: "application/json" },
 );
}
async function exportedBody() {
 const blob = downloads.at(-1);
 if (!blob) throw new Error("Missing download");
 return NoteExportPayloadSchema.parse(JSON.parse(await blob.text())).note;
}
beforeEach(() => {
 vi.useFakeTimers();
 vi.resetAllMocks();
 downloads.length = 0;
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 client.setQueryData(noteQueryKeys.detail("user-test-1", "note-1"), createFixtureNote());
 client.setQueryData(noteQueryKeys.folders("user-test-1"), []);
 mocks.content.mockImplementation(async (_client, _id, content, revision) =>
  createFixtureNote({ content, revision: revision + 1 }),
 );
 mocks.reading.mockImplementation(async (_client, _id, reading_content, revision) =>
  createFixtureNote({ reading_content, revision: revision + 1 }),
 );
 mocks.metadata.mockImplementation(async (_client, _id, _input, revision) =>
  createFixtureNote({ revision: revision + 1 }),
 );
 mocks.draft.mockResolvedValue(true);
 vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
  if (!(blob instanceof Blob)) throw new Error("Expected download Blob");
  downloads.push(blob);
  return "blob:note-test";
 });
 vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
 vi.stubGlobal("document", {
  createElement: () => ({ href: "", download: "", click: () => {}, remove: () => {} }),
  body: { appendChild: () => {} },
 });
});
afterEach(() => {
 client.clear();
 vi.clearAllTimers();
 vi.useRealTimers();
 vi.restoreAllMocks();
 vi.unstubAllGlobals();
});

// Actual hook callbacks/Query mutations. SSR does not mount effects or Lexical.
describe("Notes editor import/export flow", () => {
 it("exports a new edit immediately before the debounce dispatch", async () => {
  const hook = controller();
  hook.handleChange({ text: "B" });
  hook.exportNote();
  expect(mocks.content).not.toHaveBeenCalled();
  expect((await exportedBody()).content).toEqual({ text: "B" });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:note-test");
 });
 it("exports edit B after importing A", async () => {
  const hook = controller();
  await hook.importNote(importFile("A"));
  hook.handleChange({ text: "B" });
  hook.exportNote();
  expect((await exportedBody()).content).toEqual({ text: "B" });
 });
 it("exports and saves a reading-only edit independently", async () => {
  const hook = controller();
  hook.handleReadingChange({ text: "left pane" });
  hook.exportNote();
  expect((await exportedBody()).readingContent).toEqual({ text: "left pane" });
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.reading).toHaveBeenCalledWith({}, "note-1", { text: "left pane" }, 0, "user-test-1");
  expect(mocks.content).not.toHaveBeenCalled();
 });
 it("awaits the reading write before import resolves", async () => {
  let resolveReading = (_saved: DbNote) => {};
  mocks.reading.mockImplementationOnce(
   () =>
    new Promise<DbNote>((resolve) => {
     resolveReading = resolve;
    }),
  );
  const completed = vi.fn<() => void>();
  const pending = controller().importNote(importFile("A"));
  void pending.then(completed);
  await vi.waitFor(() => expect(mocks.reading).toHaveBeenCalledOnce());
  expect(completed).not.toHaveBeenCalled();
  resolveReading(createFixtureNote({ revision: 2 }));
  await pending;
  expect(completed).toHaveBeenCalledOnce();
 });
 it("rejects failed import writes and retains the body for retry/export", async () => {
  mocks.content.mockRejectedValueOnce(new Error("Failed to save content"));
  const hook = controller();
  await expect(hook.importNote(importFile("A"))).rejects.toThrow("Failed to save content");
  expect(mocks.reading).toHaveBeenCalledOnce();
  hook.exportNote();
  expect((await exportedBody()).content).toEqual({ text: "A" });
  await hook.retrySave();
  expect(mocks.content).toHaveBeenCalledTimes(2);
  expect(mocks.reading).toHaveBeenCalledOnce();
 });
 it("rejects a failed v2 metadata write after body writes instead of completing", async () => {
  mocks.metadata.mockRejectedValueOnce(new Error("Metadata failed"));
  const file = new File(
   [
    JSON.stringify({
     version: 2,
     note: { title: "Test Note", category: "general", content: { text: "A" }, folder: null },
    }),
   ],
   "note.json",
  );
  await expect(controller().importNote(file)).rejects.toThrow("Metadata failed");
  expect(mocks.content).toHaveBeenCalledOnce();
  expect(mocks.reading).toHaveBeenCalledOnce();
 });
 it("does not report a completed import when its local draft transaction fails", async () => {
  mocks.draft.mockResolvedValueOnce(false);
  await expect(controller().importNote(importFile("A"))).rejects.toThrow(
   "Local note draft was not saved",
  );
  expect(mocks.content).not.toHaveBeenCalled();
  expect(mocks.reading).not.toHaveBeenCalled();
 });
});
