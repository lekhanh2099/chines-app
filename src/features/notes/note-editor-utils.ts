import type { MutationStatus } from "@tanstack/react-query";

import type { NoteDraftRecord } from "./local/note-draft-store";
import type { NoteExportPayload } from "./note-export.schema";
import type { CreateNoteInput, NoteDetail, NoteFolder } from "@/services/notes/notes.service";
import { EMPTY_LEXICAL_DOCUMENT } from "@/lib/editor/editor-document";

export function formatQuickNoteDate(date: Date, locale: string): string {
 return new Intl.DateTimeFormat(locale, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 }).format(date);
}

export function createQuickNoteInput(title: CreateNoteInput["title"]): CreateNoteInput {
 return { title, tags: ["quick-note"], content: EMPTY_LEXICAL_DOCUMENT };
}

export function createNoteFormInput(
 input: {
  title: CreateNoteInput["title"];
  tags: string;
  category: NoteDetail["category"];
  folderId: string;
  readingStatus: NonNullable<NoteDetail["reading_status"]>;
 },
 reading: boolean,
): CreateNoteInput {
 return {
  title: input.title.trim(),
  tags: input.tags
   .split(",")
   .map((tag) => tag.trim())
   .filter(Boolean),
  category: input.category,
  content: EMPTY_LEXICAL_DOCUMENT,
  readingContent: reading ? EMPTY_LEXICAL_DOCUMENT : undefined,
  splitViewEnabled: reading,
  folderId: input.folderId === "unfiled" ? null : input.folderId,
  readingStatus: reading ? input.readingStatus : null,
  source: null,
 };
}

export function findNoteImportFolder(
 folders: readonly NoteFolder[],
 parentId: NoteFolder["parentId"],
 name: NoteFolder["name"],
) {
 return folders.find((folder) => folder.parentId === parentId && folder.name === name);
}

export function createNoteImportInput(
 note: NoteExportPayload["note"],
 folderId: NoteFolder["parentId"],
): CreateNoteInput {
 return {
  title: note.title,
  tags: note.tags,
  category: note.category,
  content: note.content,
  readingContent: note.readingContent ?? null,
  splitViewEnabled: note.splitViewEnabled,
  folderId,
  readingStatus: note.readingStatus ?? null,
  source: note.source ?? null,
 };
}

export function restoreNoteDraft(note: NoteDetail, draft: NoteDraftRecord): NoteDetail {
 // A pane remains a local intent until its own successful write acknowledges it.
 // A title/category write also advances updated_at and cannot acknowledge a pane.
 return {
  ...note,
  revision: draft.baseRevision ?? note.revision,
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
