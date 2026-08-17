import type { NoteFolder, NoteListItem } from "@/services/notes.service";
import type { NoteCategory } from "@/types/database";
import type { JsonObject } from "./note-export.schema";

export type NoteLibraryView =
 | "recent"
 | "inbox"
 | "reading"
 | "completed"
 | "lesson"
 | "quick"
 | "unfiled"
 | `folder:${string}`;

export type NoteFolderTreeNode = NoteFolder & { children: NoteFolderTreeNode[] };

export function normalizeReadingUrl(value: string): { url: string; host: string } {
 const parsed = new URL(value.trim());
 if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
  throw new Error("URL phải bắt đầu bằng http:// hoặc https://.");
 }
 parsed.hash = "";
 return { url: parsed.toString(), host: parsed.hostname.toLowerCase() };
}

export function plainTextToEditorDocument(value: string): JsonObject {
 const paragraphs = value
  .replace(/\r\n?/g, "\n")
  .split(/\n{2,}/)
  .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
  .filter(Boolean)
  .map((text) => ({ type: "paragraph", content: [{ type: "text", text }] }));

 return {
  type: "doc",
  content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
 };
}

export function buildNoteFolderTree(folders: NoteFolder[]): NoteFolderTreeNode[] {
 const nodes = new Map<string, NoteFolderTreeNode>(
  folders.map((folder) => [folder.id, { ...folder, children: [] }]),
 );
 const roots: NoteFolderTreeNode[] = [];

 for (const folder of folders) {
  const node = nodes.get(folder.id);
  if (!node) continue;
  const parent = folder.parentId ? nodes.get(folder.parentId) : null;
  if (parent) parent.children.push(node);
  else roots.push(node);
 }

 return roots;
}

export function matchesNoteLibraryView(note: NoteListItem, view: NoteLibraryView): boolean {
 if (view === "recent") return true;
 if (view === "lesson") return note.links.length > 0 || Boolean(note.linked_lesson_id);
 if (view === "quick") return note.tags.includes("quick-note");
 if (view === "unfiled") return note.folder_id === null;
 if (view.startsWith("folder:")) return note.folder_id === view.slice("folder:".length);
 return note.reading_status === view;
}

export function matchesNoteFacets(
 note: NoteListItem,
 input: {
  category: NoteCategory | "all";
  sourceHost: string;
 },
): boolean {
 if (input.category !== "all" && note.category !== input.category) return false;
 if (input.sourceHost !== "all" && note.source_host !== input.sourceHost) return false;
 return true;
}
