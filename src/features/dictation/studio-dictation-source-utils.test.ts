import { describe, expect, it } from "vitest";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerDocumentRowSchema } from "@/features/reading/model/reading-resource.schemas";
import { dictationBookOptions, READER_DICTATION_BOOK_ID } from "./dictation-workspace-utils";
import {
 dictationSourceTypeFor,
 emptyRecentSource,
 isRecentSourceAvailable,
 recentSourceResumeSearch,
 recentSourceSchema,
} from "./studio-dictation-source-utils";

function lesson(id: string, bookId: string, bookTitle: string): HanziHomeLesson {
 return {
  id,
  bookId,
  bookTitle,
  lessonNumber: 2,
  titleZh: "朋友",
  title: "Bạn",
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
 };
}

describe("studio dictation recent source", () => {
 it("derives the source tab from a document or clip identifier", () => {
  expect(dictationSourceTypeFor("doc-1", "clip-1")).toBe("reader");
  expect(dictationSourceTypeFor("", "clip-1")).toBe("library");
  expect(dictationSourceTypeFor("", "")).toBe("lesson");
 });

 it("accepts exactly one identifier with matching lesson or reader context", () => {
  const base = { ...emptyRecentSource, title: "朋友" };
  expect(recentSourceSchema.safeParse({ ...base, clipId: "c" }).success).toBe(true);
  expect(recentSourceSchema.safeParse({ ...base, clipId: "c", documentId: "d" }).success).toBe(
   false,
  );
  expect(
   recentSourceSchema.safeParse({
    ...base,
    lessonId: "l",
    bookId: "b",
    volumeId: "v",
    sectionId: "s",
   }).success,
  ).toBe(true);
  expect(recentSourceSchema.safeParse({ ...base, lessonId: "l", bookId: "b" }).success).toBe(false);
  expect(
   recentSourceSchema.safeParse({
    ...base,
    readerDocumentId: "r",
    bookId: READER_DICTATION_BOOK_ID,
   }).success,
  ).toBe(true);
  expect(recentSourceSchema.safeParse({ ...base, clipId: "c", bookId: "b" }).success).toBe(false);
 });

 it("only restores sources that still exist in the workspace catalog", () => {
  const lessons = [lesson("lesson-1", "book-a-volume-1", "Book A")];
  const books = dictationBookOptions(lessons);
  const documents = readerDocumentRowSchema.array().parse(studioSeed.reader.documents).slice(0, 1);
  const saved = {
   ...emptyRecentSource,
   title: "朋友",
   lessonId: "lesson-1",
   bookId: "book-a",
   volumeId: "book-a-volume-1",
   sectionId: "s",
  };
  expect(isRecentSourceAvailable(saved, lessons, books, documents)).toBe(true);
  expect(isRecentSourceAvailable({ ...saved, lessonId: "gone" }, lessons, books, documents)).toBe(
   false,
  );
  expect(
   isRecentSourceAvailable({ ...saved, volumeId: "book-a-volume-2" }, lessons, books, documents),
  ).toBe(false);
  const reader = {
   ...emptyRecentSource,
   title: "读",
   bookId: READER_DICTATION_BOOK_ID,
   readerDocumentId: documents[0]?.id ?? "",
  };
  expect(isRecentSourceAvailable(reader, lessons, books, documents)).toBe(true);
  expect(isRecentSourceAvailable({ ...reader, readerDocumentId: "x" }, lessons, books, [])).toBe(
   false,
  );
  expect(isRecentSourceAvailable({ ...emptyRecentSource, clipId: "c" }, lessons, books, [])).toBe(
   true,
  );
 });

 it("builds the resume query string from the stored identifiers", () => {
  expect(recentSourceResumeSearch({ ...emptyRecentSource, clipId: "c 1" })).toBe(
   "resume=1&clipId=c+1",
  );
  expect(
   recentSourceResumeSearch({ ...emptyRecentSource, documentId: "d", readerDocumentId: "r" }),
  ).toBe("resume=1&documentId=d&readerDocumentId=r");
 });
});
