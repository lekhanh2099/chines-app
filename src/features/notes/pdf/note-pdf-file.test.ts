import { describe, expect, it } from "vitest";

import { isPdfFile, notePdfTitle } from "./note-pdf-file";

describe("imported PDF files", () => {
 it("names the note after the file without its extension", () => {
  expect(notePdfTitle(new File([], "Giáo trình Bài 3.PDF"))).toBe("Giáo trình Bài 3");
  expect(notePdfTitle(new File([], ".pdf"))).toBe(".pdf");
 });
 it("accepts PDFs by type or extension only", () => {
  expect(isPdfFile(new File([], "a.bin", { type: "application/pdf" }))).toBe(true);
  expect(isPdfFile(new File([], "scan.pdf"))).toBe(true);
  expect(isPdfFile(new File([], "note.json", { type: "application/json" }))).toBe(false);
 });
});
