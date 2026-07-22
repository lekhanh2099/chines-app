import { describe, expect, it } from "vitest";

import { normalizeImportedNotePayload } from "./note-export.schema";

const content = { type: "doc", content: [{ type: "paragraph" }] };

describe("note export schema", () => {
 it("normalizes legacy v1 exports without library metadata", () => {
  expect(
   normalizeImportedNotePayload({
    version: 1,
    note: { title: "Ghi chú cũ", content },
   }),
  ).toMatchObject({
   version: 2,
   note: { readingStatus: null, folder: null, source: null },
  });
 });

 it("keeps v2 source, folder and reading status", () => {
  const payload = normalizeImportedNotePayload({
   version: 2,
   note: {
    title: "Bài báo",
    content,
    readingStatus: "reading",
    folder: { name: "Tháng 7", parentName: "Báo", color: "blue" },
    source: {
     url: "https://example.com/article",
     host: "example.com",
     label: "Example",
     author: null,
     publishedAt: "2026-07-21",
     capturedAt: "2026-07-21T00:00:00.000Z",
    },
   },
  });

  expect(payload.note).toMatchObject({
   readingStatus: "reading",
   folder: { name: "Tháng 7", parentName: "Báo" },
   source: { host: "example.com" },
  });
 });
});
