import type { MutationStatus } from "@tanstack/react-query";

import type { NoteDraftRecord } from "./local/note-draft-store";
import type { NoteExportPayload } from "./note-export.schema";
import type { NoteDetail, NoteFolder } from "@/services/notes/notes.service";

export function restoreNoteDraft(note: NoteDetail, draft: NoteDraftRecord): NoteDetail {
 // A pane remains a local intent until its own successful write acknowledges it.
 // A title/category write also advances updated_at and cannot acknowledge a pane.
 return {
  ...note,
  content: draft.content ?? note.content,
  reading_content: draft.readingContent === undefined ? note.reading_content : draft.readingContent,
 };
}

export function createNoteDownloadFileName(title: string): string {
 const slug = title
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64);
 return `${slug || "note"}.json`;
}

export function createNoteExportPayload(input: {
 note: NoteDetail;
 folders: readonly NoteFolder[];
 content: NoteDetail["content"];
 readingContent: NoteDetail["reading_content"];
 exportedAt: string;
}): NoteExportPayload {
 const { note, folders, content, readingContent, exportedAt } = input;
 const folder = folders.find((item) => item.id === note.folder_id);
 const parentFolder = folders.find((item) => item.id === folder?.parentId);
 return {
  version: 2,
  exportedAt,
  note: {
   title: note.title,
   tags: note.tags ?? [],
   category: note.category,
   content,
   readingContent,
   splitViewEnabled: note.split_view_enabled,
   readingStatus: note.reading_status,
   folder: folder
    ? { name: folder.name, parentName: parentFolder?.name ?? null, color: folder.color }
    : null,
   source: note.source_url
    ? {
       url: note.source_url,
       host: note.source_host,
       label: note.source_label,
       author: note.source_author,
       publishedAt: note.source_published_at,
       capturedAt: note.source_captured_at,
      }
    : null,
  },
 };
}

export function resolveNoteSaveStatus(
 statuses: readonly MutationStatus[],
 dirty: boolean,
 localDraftFailed: boolean,
): MutationStatus {
 if (statuses.includes("pending")) return "pending";
 if (localDraftFailed || statuses.includes("error")) return "error";
 if (dirty) return "pending";
 return statuses.includes("success") ? "success" : "idle";
}
