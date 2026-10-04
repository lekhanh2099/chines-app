import { describe, expect, it } from "vitest";
import type { NoteDetail } from "@/services/notes/notes.service";
import type { NoteDraftRecord } from "./local/note-draft-store";
import { NoteExportPayloadSchema } from "./note-export.schema";
import {
 createNoteDownloadFileName,
 createNoteExportPayload,
 restoreNoteDraft,
 resolveNoteSaveStatus,
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
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T10:00:00.000Z",
  links: [],
  ...overrides,
 };
}

describe("note editor utilities", () => {
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
