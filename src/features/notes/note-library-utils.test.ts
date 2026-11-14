import { describe, expect, it } from "vitest";

import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";
import {
 buildLessonLookup,
 getNoteContext,
 type NoteContextLabels,
} from "./components/noteContext";
import {
 mergeSelectableNotes,
 normalizeReadingUrl,
 plainTextToEditorDocument,
 filterNoteLibrary,
 getNoteLibrarySources,
 getNoteLibraryPage,
 getNoteLibraryNavigationAfterFolderDelete,
 groupNoteLibraryByMonth,
 getNoteFolderBreadcrumb,
 countNoteLibraryView,
 countNotesInFolder,
 getNextNoteFolderPosition,
 getNoteFolderMoveTarget,
 createNoteLibraryMetadataInput,
} from "./note-library-utils";

const testContextLabels: NoteContextLabels = {
 relations: {
  main: "Bài học",
  lesson_text: "Bài khóa",
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  annotation: "Đánh dấu",
 },
 categories: {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  culture: "Văn hóa",
  general: "Chung",
 },
 lessonNote: "Ghi chú bài học",
 quickNote: "Ghi chú nhanh",
 normalNote: "Ghi chú thường",
 noLesson: "Không gắn với bài học",
 quickBadge: "Quick note",
 untitled: "Ghi chú chưa đặt tên",
 lessonNumber: (number) => `Bài ${number}`,
 bookLesson: (book, number) => `${book} · Bài ${number}`,
};

function libraryNote(id: string, overrides: Partial<NoteListItem> = {}): NoteListItem {
 return {
  id,
  title: `Note ${id}`,
  tags: [],
  status: "draft",
  category: "general",
  short_id: null,
  updated_at: "2026-10-01T12:00:00.000Z",
  linked_lesson_id: null,
  folder_id: null,
  reading_status: null,
  source_url: null,
  source_host: null,
  source_label: null,
  source_author: null,
  source_published_at: null,
  source_captured_at: null,
  revision: 0,
  links: [],
  ...overrides,
 };
}

function libraryFolder(id: string, overrides: Partial<NoteFolder> = {}): NoteFolder {
 return {
  id,
  userId: "owner",
  parentId: null,
  name: id,
  color: "purple",
  position: 0,
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
  ...overrides,
 };
}

describe("complete library policies", () => {
 const filterInput: Parameters<typeof filterNoteLibrary>[1] = {
  view: "recent",
  category: "all",
  sourceHost: "all",
  searchQuery: "",
  lessonLookup: new Map(),
  contextLabels: testContextLabels,
  folderNames: new Map([["f", "Review folder"]]),
 };

 it("keeps last source label, omits missing hosts and sorts labels", () => {
  expect(
   getNoteLibrarySources(
    [
     libraryNote("a", { source_host: "same.test", source_label: "Z first" }),
     libraryNote("b", { source_label: "No host" }),
     libraryNote("c", { source_host: "b.test" }),
     libraryNote("d", { source_host: "same.test", source_label: "A last" }),
    ],
    "en",
   ),
  ).toEqual([
   ["same.test", "A last"],
   ["b.test", "b.test"],
  ]);
 });

 it("searches all existing summary fields, trims case and combines facets without reordering", () => {
  const note = libraryNote("match", {
   title: "Title marker",
   category: "grammar",
   tags: ["Tag marker", "quick-note"],
   source_host: "news.test",
   source_label: "Source marker",
   source_author: "Author marker",
   folder_id: "f",
   reading_status: "reading",
  });
  const notes = [libraryNote("before"), note, libraryNote("after", { category: "grammar" })];
  for (const searchQuery of [
   " TITLE MARKER ",
   "grammar",
   "Tag marker",
   "news.test",
   "Source marker",
   "Author marker",
   "Review folder",
   "Ghi chú nhanh",
  ]) {
   expect(
    filterNoteLibrary(notes, {
     ...filterInput,
     searchQuery,
     view: "reading",
     category: "grammar",
     sourceHost: "news.test",
    }),
   ).toEqual([note]);
  }
  expect(filterNoteLibrary(notes, filterInput)).toEqual(notes);
  expect(filterNoteLibrary(notes, { ...filterInput, searchQuery: "   " })).toEqual(notes);
  expect(filterNoteLibrary(notes, { ...filterInput, category: "culture" })).toEqual([]);
  expect(filterNoteLibrary(notes, { ...filterInput, view: "folder:f" })).toEqual([note]);
 });

 it("searches lesson-generated book/number/title/subtitle/relation labels", () => {
  const lesson: HanziHomeLesson = {
   id: "lesson",
   lessonNumber: 7,
   title: "Câu chuyện",
   titleZh: "成语故事",
   courseTitle: "Hán ngữ",
   bookTitle: "Quyển 2",
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
  };
  const note = libraryNote("linked", { title: "Ghi chú: Câu chuyện", linked_lesson_id: lesson.id });
  for (const searchQuery of ["Quyển 2", "Bài 7", "Câu chuyện", "成语故事", "Bài học"]) {
   expect(
    filterNoteLibrary([note], {
     ...filterInput,
     lessonLookup: buildLessonLookup([lesson]),
     searchQuery,
    }),
   ).toEqual([note]);
  }
 });

 it("counts full-library views and folders including legacy lesson links", () => {
  const notes = [
   libraryNote("a", { linked_lesson_id: "legacy" }),
   libraryNote("b", {
    folder_id: "f",
    tags: ["quick-note"],
    reading_status: "completed",
    links: [
     {
      noteId: "b",
      targetType: "hanzihome_lesson",
      targetKey: "lesson",
      relationType: "main",
      updatedAt: "2026-10-01T12:00:00.000Z",
     },
    ],
   }),
  ];
  expect(countNoteLibraryView(notes, "recent")).toBe(2);
  expect(countNoteLibraryView(notes, "lesson")).toBe(2);
  expect(countNoteLibraryView(notes, "quick")).toBe(1);
  expect(countNoteLibraryView(notes, "unfiled")).toBe(1);
  expect(countNoteLibraryView(notes, "completed")).toBe(1);
  expect(countNotesInFolder(notes, "f")).toBe(1);
 });

 it("preserves insertion order within months and does not mutate input", () => {
  const notes = [
   libraryNote("oct-1"),
   libraryNote("sep", { updated_at: "2026-09-15T12:00:00.000Z" }),
   libraryNote("oct-2"),
  ];
  expect(groupNoteLibraryByMonth(notes, "en", true)).toEqual([
   ["October 2026", [notes[0], notes[2]]],
   ["September 2026", [notes[1]]],
  ]);
  expect(groupNoteLibraryByMonth(notes, "en", false)[0]?.[1]).toBe(notes);
  expect(notes.map((note) => note.id)).toEqual(["oct-1", "sep", "oct-2"]);
 });

 it("keeps folder ancestry, sibling counts and move boundaries", () => {
  const root = libraryFolder("root", { name: "Root", position: 4 });
  const first = libraryFolder("first", { name: "First", parentId: "root", position: 2 });
  const last = libraryFolder("last", { parentId: "root", position: 8 });
  const folders = [last, root, first];
  expect(getNoteFolderBreadcrumb("first", folders)).toBe("Root / First");
  expect(getNoteFolderBreadcrumb("first", [first])).toBe("First");
  expect(getNoteFolderBreadcrumb(null, folders)).toBeNull();
  expect(getNoteFolderBreadcrumb("missing", folders)).toBeNull();
  expect(getNextNoteFolderPosition(folders, "root")).toBe(2);
  expect(getNoteFolderMoveTarget(first, folders, true)).toBeUndefined();
  expect(getNoteFolderMoveTarget(last, folders, false)).toBeUndefined();
  expect(getNoteFolderMoveTarget(first, folders, false)).toBe(last);
  expect(getNoteFolderMoveTarget(last, folders, true)).toBe(first);
  expect(folders.map((folder) => folder.id)).toEqual(["last", "root", "first"]);
 });
});

describe("visible note pages", () => {
 it("returns to unfiled page one only when the deleted folder remains selected", () => {
  const current: Parameters<typeof getNoteLibraryNavigationAfterFolderDelete>[0] = {
   activeView: "folder:reading",
   page: 2,
  };
  expect(getNoteLibraryNavigationAfterFolderDelete(current, "reading")).toEqual({
   activeView: "unfiled",
   page: 1,
  });
  expect(current).toEqual({ activeView: "folder:reading", page: 2 });
 });

 it("preserves the newer smart view and its current page", () => {
  const current: Parameters<typeof getNoteLibraryNavigationAfterFolderDelete>[0] = {
   activeView: "recent",
   page: 3,
  };
  expect(getNoteLibraryNavigationAfterFolderDelete(current, "reading")).toBe(current);
  expect(current).toEqual({ activeView: "recent", page: 3 });
 });

 it("preserves a different folder or child selection when its parent is deleted", () => {
  const current: Parameters<typeof getNoteLibraryNavigationAfterFolderDelete>[0] = {
   activeView: "folder:child",
   page: 2,
  };
  expect(getNoteLibraryNavigationAfterFolderDelete(current, "other")).toBe(current);
  expect(getNoteLibraryNavigationAfterFolderDelete(current, "parent")).toBe(current);
  expect(current).toEqual({ activeView: "folder:child", page: 2 });
 });

 it("handles empty, exact and partial page boundaries without mutating summaries", () => {
  expect(getNoteLibraryPage([], 8)).toEqual({
   page: 1,
   totalPages: 1,
   start: 0,
   end: 0,
   notes: [],
  });
  const notes = Array.from({ length: 26 }, (_, index) => libraryNote(String(index)));
  expect(getNoteLibraryPage(notes.slice(0, 25), 2)).toMatchObject({
   page: 1,
   totalPages: 1,
   start: 1,
   end: 25,
  });
  expect(getNoteLibraryPage(notes, 2)).toEqual({
   page: 2,
   totalPages: 2,
   start: 26,
   end: 26,
   notes: [notes[25]],
  });
  expect(getNoteLibraryPage(notes, 999)).toEqual(getNoteLibraryPage(notes, 2));
  expect(getNoteLibraryPage(notes, 0)).toEqual(getNoteLibraryPage(notes, 1));
  expect(notes.length).toBe(26);
 });

 it("keeps the last identity at 10000 notes and groups only the visible month slice", () => {
  const notes = Array.from({ length: 10000 }, (_, index) =>
   libraryNote(String(index), {
    updated_at: index < 25 ? "2026-09-15T12:00:00.000Z" : "2026-10-15T12:00:00.000Z",
   }),
  );
  const last = getNoteLibraryPage(notes, 400);
  expect(last.notes.length).toBe(25);
  expect(last.notes.at(-1)?.id).toBe("9999");
  expect(last).toMatchObject({ start: 9976, end: 10000, page: 400, totalPages: 400 });
  expect(
   groupNoteLibraryByMonth(getNoteLibraryPage(notes, 2).notes, "en", true).map(([month]) => month),
  ).toEqual(["October 2026"]);
 });
});

describe("note library utilities", () => {
 it("preserves metadata fields and the selected source capture time without changing form values", () => {
  const input: Parameters<typeof createNoteLibraryMetadataInput>[0] = {
   title: "  Title  ",
   folderId: "folder",
   readingStatus: "completed",
   sourceUrl: " https://Example.com/article?id=2#section ",
   sourceLabel: " Label ",
   sourceAuthor: " Author ",
   publishedAt: "2026-01-02",
   sourceCapturedAt: "2026-01-03T00:00:00Z",
  };
  expect(createNoteLibraryMetadataInput(input, "2026-10-10T00:00:00Z")).toEqual({
   title: "Title",
   folderId: "folder",
   readingStatus: "completed",
   source: {
    url: "https://example.com/article?id=2",
    host: "example.com",
    label: "Label",
    author: "Author",
    publishedAt: "2026-01-02",
    capturedAt: "2026-01-03T00:00:00Z",
   },
  });
  expect(input.title).toBe("  Title  ");
  expect(input.sourceUrl).toBe(" https://Example.com/article?id=2#section ");
 });

 it("keeps unfiled/none defaults, source host fallback and the supplied capture timestamp", () => {
  const input: Parameters<typeof createNoteLibraryMetadataInput>[0] = {
   title: "Title",
   folderId: "unfiled",
   readingStatus: "none",
   sourceUrl: "https://example.com",
   sourceLabel: " ",
   sourceAuthor: " ",
   publishedAt: "",
   sourceCapturedAt: null,
  };
  expect(createNoteLibraryMetadataInput(input, "2026-10-10T00:00:00Z")).toEqual({
   title: "Title",
   folderId: null,
   readingStatus: null,
   source: {
    url: "https://example.com/",
    host: "example.com",
    label: "example.com",
    author: null,
    publishedAt: null,
    capturedAt: "2026-10-10T00:00:00Z",
   },
  });
  for (const readingStatus of ["inbox", "reading", "completed"]) {
   expect(createNoteLibraryMetadataInput({ ...input, readingStatus }, "now").readingStatus).toBe(
    readingStatus,
   );
  }
  expect(createNoteLibraryMetadataInput({ ...input, sourceUrl: "   " }, "now")).toEqual({
   title: "Title",
   folderId: null,
   readingStatus: null,
   source: null,
  });
  expect(() =>
   createNoteLibraryMetadataInput({ ...input, sourceUrl: "file:///tmp/article" }, "now"),
  ).toThrow("URL phải bắt đầu bằng http:// hoặc https://.");
  expect(() =>
   createNoteLibraryMetadataInput({ ...input, sourceUrl: "not a URL" }, "now"),
  ).toThrow();
 });

 it("normalizes a reading URL and removes its fragment", () => {
  expect(normalizeReadingUrl("https://Example.com/news?id=2#section")).toEqual({
   url: "https://example.com/news?id=2",
   host: "example.com",
  });
 });

 it("rejects non-http reading URLs", () => {
  expect(() => normalizeReadingUrl("file:///tmp/article.html")).toThrow(
   "URL phải bắt đầu bằng http:// hoặc https://.",
  );
 });

 it("converts pasted paragraphs into editor content", () => {
  expect(plainTextToEditorDocument("Đoạn một.\n\nĐoạn hai.\nDòng tiếp.")).toEqual({
   type: "doc",
   content: [
    { type: "paragraph", content: [{ type: "text", text: "Đoạn một." }] },
    { type: "paragraph", content: [{ type: "text", text: "Đoạn hai. Dòng tiếp." }] },
   ],
  });
 });

 it("keeps open-tab order and localized untitled labels when the library is focus-locked", () => {
  expect(
   mergeSelectableNotes(
    [],
    [
     { noteId: "b", title: "" },
     { noteId: "a", title: "A" },
    ],
    "Untitled",
   ),
  ).toEqual([
   { id: "b", title: "Untitled", updated_at: "" },
   { id: "a", title: "A", updated_at: "" },
  ]);
 });
});

describe("lesson note context", () => {
 it("shows the course, book and lesson while hiding technical tags", () => {
  const lesson: HanziHomeLesson = {
   id: "f3bf9e32-0f37-4cd4-8954-d1bf6c52a286",
   lessonNumber: 7,
   title: "Câu chuyện thành ngữ",
   titleZh: "成语故事",
   courseTitle: "Giáo trình Hán ngữ Quyển 2",
   bookTitle: "Quyển 2 Thượng",
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
  };
  const note: NoteListItem = {
   id: "note-id",
   title: "Ghi chú: Câu chuyện thành ngữ",
   tags: ["hanzihome", lesson.id, "lesson-note", "ôn tập"],
   status: "draft",
   category: "general",
   short_id: "lesson-note",
   updated_at: "2026-07-27T00:00:00.000Z",
   linked_lesson_id: lesson.id,
   folder_id: null,
   reading_status: null,
   source_url: null,
   source_host: null,
   source_label: null,
   source_author: null,
   source_published_at: null,
   source_captured_at: null,
   revision: 0,
   links: [
    {
     noteId: "note-id",
     targetType: "hanzihome_lesson",
     targetKey: lesson.id,
     relationType: "main",
     updatedAt: "2026-07-27T00:00:00.000Z",
    },
   ],
  };

  expect(getNoteContext(note, buildLessonLookup([lesson]), testContextLabels)).toMatchObject({
   displayTitle: "Quyển 2 Thượng · Bài 7",
   subtitle: "Câu chuyện thành ngữ · 成语故事",
   badges: ["Bài học", "ôn tập"],
  });
  expect(
   mergeSelectableNotes(
    [note],
    [
     { noteId: note.id, title: "Stale tab title" },
     { noteId: "other", title: "Other" },
    ],
    "Untitled",
   ),
  ).toEqual([
   { id: note.id, title: note.title, updated_at: note.updated_at },
   { id: "other", title: "Other", updated_at: "" },
  ]);
 });
});
