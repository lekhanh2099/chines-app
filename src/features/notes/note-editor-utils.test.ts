import { describe, expect, it } from "vitest";
import type { NoteDetail, NoteFolder } from "@/services/notes/notes.service";
import { EMPTY_LEXICAL_DOCUMENT } from "@/lib/editor/editor-document";
import type { NoteDraftRecord } from "./local/note-draft-store";
import { NoteExportPayloadSchema } from "./note-export.schema";
import {
 createNoteDownloadFileName,
 createNoteExportPayload,
 restoreNoteDraft,
 resolveNoteSaveStatus,
 createNoteFormInput,
 createNoteImportInput,
 findNoteImportFolder,
 formatQuickNoteDate,
 createQuickNoteInput,
} from "./note-editor-utils";

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

describe("note editor utilities", () => {
 it.each([
  ["vi", "03:04 02/01/2026"],
  ["en", "01/02/2026, 03:04 AM"],
  ["zh-CN", "2026/01/02 03:04"],
 ])("formats the existing quick-note date fields in %s", (locale, formatted) => {
  expect(formatQuickNoteDate(new Date(2026, 0, 2, 3, 4), locale)).toBe(formatted);
 });
 it("keeps quick note tags/content and leaves existing database defaults intact", () => {
  expect(createQuickNoteInput("Quick title")).toEqual({
   title: "Quick title",
   tags: ["quick-note"],
   content: EMPTY_LEXICAL_DOCUMENT,
  });
 });
 it("creates plain and reading payloads without changing tag order or duplicates", () => {
  const form: Parameters<typeof createNoteFormInput>[0] = {
   title: "  中文 note  ",
   tags: " grammar, ,中文, grammar, ",
   category: "culture",
   folderId: "unfiled",
   readingStatus: "completed",
  };
  expect(createNoteFormInput(form, false)).toEqual({
   title: "中文 note",
   tags: ["grammar", "中文", "grammar"],
   category: "culture",
   content: EMPTY_LEXICAL_DOCUMENT,
   readingContent: undefined,
   splitViewEnabled: false,
   folderId: null,
   readingStatus: null,
   source: null,
  });
  expect(createNoteFormInput({ ...form, folderId: "folder", tags: "" }, true)).toEqual({
   title: "中文 note",
   tags: [],
   category: "culture",
   content: EMPTY_LEXICAL_DOCUMENT,
   readingContent: EMPTY_LEXICAL_DOCUMENT,
   splitViewEnabled: true,
   folderId: "folder",
   readingStatus: "completed",
   source: null,
  });
 });
 it("matches import folders by exact name and parent without mutating their order", () => {
  const parent: NoteFolder = {
   id: "parent",
   userId: "owner",
   parentId: null,
   name: "Folder",
   color: "purple",
   position: 0,
   createdAt: "",
   updatedAt: "",
  };
  const child: NoteFolder = { ...parent, id: "child", parentId: "parent" };
  const folders = [child, parent];
  expect(findNoteImportFolder(folders, null, "Folder")).toBe(parent);
  expect(findNoteImportFolder(folders, "parent", "Folder")).toBe(child);
  expect(findNoteImportFolder(folders, null, "folder")).toBeUndefined();
  expect(findNoteImportFolder(folders, "different", "Folder")).toBeUndefined();
  expect(folders).toEqual([child, parent]);
 });
 it("maps an imported v2 note to its exact create fields and preserves metadata", () => {
  const source = {
   url: "https://example.test/read",
   host: "example.test",
   label: "Source",
   author: "Author",
   publishedAt: null,
   capturedAt: "2026-10-10T00:00:00Z",
  };
  const imported = NoteExportPayloadSchema.parse({
   version: 2,
   note: {
    title: "Imported",
    tags: ["中文"],
    category: "grammar",
    content: { text: "body" },
    readingContent: { text: "reading" },
    splitViewEnabled: true,
    readingStatus: "inbox",
    source,
   },
  }).note;
  expect(createNoteImportInput(imported, "child")).toEqual({
   title: "Imported",
   tags: ["中文"],
   category: "grammar",
   content: { text: "body" },
   readingContent: { text: "reading" },
   splitViewEnabled: true,
   readingStatus: "inbox",
   folderId: "child",
   source,
  });
  const minimal = NoteExportPayloadSchema.parse({
   version: 2,
   note: { title: "Minimal", content: {} },
  }).note;
  expect(createNoteImportInput(minimal, null)).toEqual({
   title: "Minimal",
   tags: [],
   category: "general",
   content: {},
   readingContent: null,
   splitViewEnabled: undefined,
   readingStatus: null,
   folderId: null,
   source: null,
  });
 });
 it("restores both unacknowledged panes even after a newer metadata update", () => {
  const note = createFixtureNote({ updated_at: "2026-10-04T00:00:00Z" });
  const draft: NoteDraftRecord = {
   key: "user-test-1:note-1",
   userId: "user-test-1",
   noteId: "note-1",
   content: { text: "unsaved" },
   readingContent: null,
   updatedAt: 1,
  };
  expect(restoreNoteDraft(note, draft)).toMatchObject({
   content: { text: "unsaved" },
   reading_content: null,
   title: "Test Note",
  });
 });
 it("keeps an acknowledged pane on the server while restoring the other pane", () => {
  const note = createFixtureNote();
  const draft: NoteDraftRecord = {
   key: "user-test-1:note-1",
   userId: "user-test-1",
   noteId: "note-1",
   content: null,
   readingContent: { text: "reading draft" },
   updatedAt: 1,
  };
  const restored = restoreNoteDraft(note, draft);
  expect(restored.content).toEqual(note.content);
  expect(restored.reading_content).toEqual({ text: "reading draft" });
 });
 it("exports the supplied latest pane snapshots with the existing v2 contract", () => {
  const note = createFixtureNote();
  const payload = createNoteExportPayload({
   note,
   folders: [],
   content: { text: "edit B before debounce" },
   readingContent: { text: "reading B" },
   exportedAt: "2026-10-04T00:00:00Z",
  });
  expect(NoteExportPayloadSchema.parse(payload).note).toMatchObject({
   content: { text: "edit B before debounce" },
   readingContent: { text: "reading B" },
   title: "Test Note",
   folder: null,
   source: null,
  });
 });
 it("uses deterministic Unicode filenames and a fallback for an empty title", () => {
  expect(createNoteDownloadFileName(" 中文 / Ghi chú! ")).toBe("中文-ghi-chú.json");
  expect(createNoteDownloadFileName("! ")).toBe("note.json");
 });
 it("includes reading-only activity and failure in the visible save state", () => {
  expect(resolveNoteSaveStatus(["idle", "pending"], false, false)).toBe("pending");
  expect(resolveNoteSaveStatus(["success", "error"], false, false)).toBe("error");
  expect(resolveNoteSaveStatus(["success", "idle"], false, true)).toBe("error");
  expect(resolveNoteSaveStatus(["idle", "idle"], true, false)).toBe("pending");
  expect(resolveNoteSaveStatus(["success", "success"], false, false)).toBe("success");
 });
});
