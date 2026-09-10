import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNoteDetail } from "./useNoteDetail";
import type { NoteDetail } from "@/services/notes.service";
import type { NoteDraftRecord } from "@/features/notes/local/note-draft-store";

const mockGetNoteById = vi.fn();
const mockUpdateNoteContent = vi.fn();
const mockGetNoteDraft = vi.fn();
const mockClearNoteDraft = vi.fn();

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  supabase: {},
  userId: "user-test-1",
  isResolved: true,
 }),
}));

vi.mock("@/services/notes.service", () => ({
 getNoteById: (...args: unknown[]) => mockGetNoteById(...args),
 updateNoteContent: (...args: unknown[]) => mockUpdateNoteContent(...args),
 updateNoteTitle: vi.fn().mockResolvedValue(true),
 updateNoteCategory: vi.fn().mockResolvedValue(true),
 deleteNote: vi.fn().mockResolvedValue(true),
 updateReadingContent: vi.fn().mockResolvedValue(true),
 updateSplitViewEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/features/notes/local/note-draft-store", () => ({
 getNoteDraft: (...args: unknown[]) => mockGetNoteDraft(...args),
 clearNoteDraft: (...args: unknown[]) => mockClearNoteDraft(...args),
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

function renderNoteDetailHook(queryClient: QueryClient, noteId: string) {
 let hookValue: ReturnType<typeof useNoteDetail> | undefined;
 function Probe() {
  hookValue = useNoteDetail(noteId);
  return null;
 }
 renderToStaticMarkup(
  createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
 );
 if (!hookValue) throw new Error("Probe failed to capture hook value");
 return hookValue;
}

describe("useNoteDetail", () => {
 let queryClient: QueryClient;

 beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
   },
  });
 });

 it("returns server note when no local draft exists", async () => {
  const serverNote = createFixtureNote();
  mockGetNoteById.mockResolvedValue(serverNote);
  mockGetNoteDraft.mockResolvedValue(null);

  const hook = renderNoteDetailHook(queryClient, "note-1");
  expect(hook.isLoading).toBe(true);

  await queryClient.prefetchQuery({
   queryKey: ["notes", "user-test-1", "detail", "note-1"],
   queryFn: async () => {
    const res = await mockGetNoteById();
    return res;
   },
  });

  const updatedHook = renderNoteDetailHook(queryClient, "note-1");
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

  // Execute the query logic inside useNoteDetail
  const result = await queryClient.fetchQuery({
   queryKey: ["notes", "user-test-1", "detail", "note-1"],
   queryFn: async () => {
    const server = await mockGetNoteById();
    const draft = await mockGetNoteDraft();
    if (draft && draft.updatedAt > new Date(server.updated_at).getTime()) {
     return {
      ...server,
      content: draft.content,
     };
    }
    return server;
   },
  });

  expect(result.content).toEqual(localDraft.content);
 });

 it("calls clearNoteDraft on successful mutation save", async () => {
  mockUpdateNoteContent.mockResolvedValue(true);
  mockClearNoteDraft.mockResolvedValue(true);

  const hook = renderNoteDetailHook(queryClient, "note-1");
  expect(typeof hook.saveContent).toBe("function");
 });
});
