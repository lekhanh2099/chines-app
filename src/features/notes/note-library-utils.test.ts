import { describe, expect, it } from "vitest";

import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { NoteListItem } from "@/services/notes.service";
import {
 buildLessonLookup,
 getNoteContext,
 type NoteContextLabels,
} from "./components/noteContext";
import { normalizeReadingUrl, plainTextToEditorDocument } from "./note-library-utils";

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

describe("note library utilities", () => {
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
 });
});
