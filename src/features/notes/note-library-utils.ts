import type {
 NoteFolder,
 NoteListItem,
 updateNoteLibraryMetadata,
} from "@/services/notes/notes.service";
import { ReadingStatusSchema } from "@/types/database";
import type { NoteCategory } from "@/types/database";
import type { JsonObject } from "./note-export.schema";
import type { NoteTab } from "@/stores/notes/note-tabs-store";
import {
 getNoteContext,
 type LessonLookup,
 type NoteContextLabels,
} from "./components/noteContext";

export type SelectableNote = {
 id: NoteListItem["id"];
 title: NoteListItem["title"];
 updated_at: NoteListItem["updated_at"];
};

export function mergeSelectableNotes(
 notes: NoteListItem[],
 tabs: NoteTab[],
 untitled: string,
): SelectableNote[] {
 const notesById = new Map<string, SelectableNote>();

 for (const note of notes) {
  notesById.set(note.id, {
   id: note.id,
   title: note.title || untitled,
   updated_at: note.updated_at,
  });
 }

 for (const tab of tabs) {
  if (!notesById.has(tab.noteId)) {
   notesById.set(tab.noteId, {
    id: tab.noteId,
    title: tab.title || untitled,
    updated_at: "",
   });
  }
 }

 return Array.from(notesById.values());
}

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

export function createNoteLibraryMetadataInput(
 input: {
  title: NoteListItem["title"];
  folderId: NonNullable<NoteListItem["folder_id"]>;
  readingStatus: string;
  sourceUrl: NonNullable<NoteListItem["source_url"]>;
  sourceLabel: NonNullable<NoteListItem["source_label"]>;
  sourceAuthor: NonNullable<NoteListItem["source_author"]>;
  publishedAt: NonNullable<NoteListItem["source_published_at"]>;
  sourceCapturedAt: NoteListItem["source_captured_at"];
 },
 capturedAt: NonNullable<NoteListItem["source_captured_at"]>,
): Parameters<typeof updateNoteLibraryMetadata>[2] {
 const normalized = input.sourceUrl.trim() ? normalizeReadingUrl(input.sourceUrl) : null;
 const parsedReadingStatus = ReadingStatusSchema.safeParse(input.readingStatus);
 return {
  title: input.title.trim(),
  folderId: input.folderId === "unfiled" ? null : input.folderId,
  readingStatus: parsedReadingStatus.success ? parsedReadingStatus.data : null,
  source:
   normalized === null
    ? null
    : {
       url: normalized.url,
       host: normalized.host,
       label: input.sourceLabel.trim() || normalized.host,
       author: input.sourceAuthor.trim() || null,
       publishedAt: input.publishedAt || null,
       capturedAt: input.sourceCapturedAt ?? capturedAt,
      },
 };
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

export function getNoteLibrarySources(
 notes: NoteListItem[],
 locale: string,
): Array<[string, string]> {
 return Array.from(
  notes
   .reduce((options, note) => {
    if (!note.source_host) return options;
    options.set(note.source_host, note.source_label || note.source_host);
    return options;
   }, new Map<string, string>())
   .entries(),
 ).sort((left, right) => left[1].localeCompare(right[1], locale));
}

export function filterNoteLibrary(
 notes: NoteListItem[],
 input: Parameters<typeof matchesNoteFacets>[1] & {
  view: NoteLibraryView;
  searchQuery: string;
  lessonLookup: LessonLookup;
  contextLabels: NoteContextLabels;
  folderNames: Map<NoteFolder["id"], NoteFolder["name"]>;
 },
): NoteListItem[] {
 const normalizedSearch = input.searchQuery.trim().toLowerCase();
 return notes.filter((note) => {
  if (!matchesNoteLibraryView(note, input.view)) return false;
  if (!matchesNoteFacets(note, input)) return false;
  if (!normalizedSearch) return true;
  const context = getNoteContext(note, input.lessonLookup, input.contextLabels);
  const searchableText = [
   note.title,
   note.category,
   note.source_label,
   note.source_host,
   note.source_author,
   note.folder_id ? input.folderNames.get(note.folder_id) : null,
   context.displayTitle,
   context.title,
   context.subtitle,
   context.relationLabel,
   ...note.tags,
  ]
   .filter(Boolean)
   .join(" ")
   .toLowerCase();
  return searchableText.includes(normalizedSearch);
 });
}

export function groupNoteLibraryByMonth(
 notes: NoteListItem[],
 locale: string,
 groupByMonth: boolean,
): Array<[string, NoteListItem[]]> {
 if (!groupByMonth) return [["", notes]];
 const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
 const byMonth = new Map<string, NoteListItem[]>();
 for (const note of notes) {
  const month = monthFormatter.format(new Date(note.updated_at));
  const existing = byMonth.get(month) ?? [];
  existing.push(note);
  byMonth.set(month, existing);
 }
 return Array.from(byMonth.entries());
}

export function getNoteLibraryPage(notes: NoteListItem[], requestedPage: number) {
 const pageSize = 25;
 const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
 const page = Math.min(totalPages, Math.max(1, requestedPage));
 const start = (page - 1) * pageSize;
 return {
  page,
  totalPages,
  start: notes.length === 0 ? 0 : start + 1,
  end: Math.min(start + pageSize, notes.length),
  notes: notes.slice(start, start + pageSize),
 };
}

export function getNoteFolderBreadcrumb(
 folderId: NoteListItem["folder_id"],
 folders: NoteFolder[],
) {
 if (!folderId) return null;
 const folder = folders.find((item) => item.id === folderId);
 if (!folder) return null;
 const parent = folder.parentId ? folders.find((item) => item.id === folder.parentId) : null;
 return parent ? `${parent.name} / ${folder.name}` : folder.name;
}

export function countNoteLibraryView(notes: NoteListItem[], view: NoteLibraryView): number {
 return notes.filter((note) => matchesNoteLibraryView(note, view)).length;
}

export function countNotesInFolder(notes: NoteListItem[], folderId: NoteFolder["id"]): number {
 return notes.filter((note) => note.folder_id === folderId).length;
}

export function getNextNoteFolderPosition(
 folders: NoteFolder[],
 parentId: NoteFolder["parentId"],
): number {
 return folders.filter((folder) => folder.parentId === parentId).length;
}

export function getNoteFolderMoveTarget(
 folder: NoteFolder,
 folders: NoteFolder[],
 moveUp: boolean,
) {
 const siblings = folders
  .filter((item) => item.parentId === folder.parentId)
  .sort((left, right) => left.position - right.position);
 const index = siblings.findIndex((item) => item.id === folder.id);
 const targetIndex = index + (moveUp ? -1 : 1);
 if (targetIndex < 0) return;
 return siblings.at(targetIndex);
}

export function getNoteLibraryNavigationAfterFolderDelete(
 current: { activeView: NoteLibraryView; page: ReturnType<typeof getNoteLibraryPage>["page"] },
 folderId: NoteFolder["id"],
): typeof current {
 return current.activeView === `folder:${folderId}` ? { activeView: "unfiled", page: 1 } : current;
}
