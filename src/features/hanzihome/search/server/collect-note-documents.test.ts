import { describe, expect, it } from "vitest";

import { collectNoteDocuments, lexicalPlainText } from "./collect-note-documents";

const lexicalContent = {
 root: {
  type: "root",
  children: [
   {
    type: "heading",
    children: [
     { type: "text", text: "Ôn tập " },
     { type: "text", text: "团聚" },
    ],
   },
   { type: "paragraph", children: [{ type: "text", text: "Cả nhà đoàn tụ dịp Tết." }] },
   { type: "paragraph", children: [] },
  ],
 },
};

describe("collectNoteDocuments", () => {
 it("extracts Lexical text one block per line", () => {
  expect(lexicalPlainText(lexicalContent)).toBe("Ôn tập 团聚\nCả nhà đoàn tụ dịp Tết.");
  expect(lexicalPlainText(null)).toBe("");
 });

 it("indexes title, tags and plain-text content and links to the note", () => {
  const [document] = collectNoteDocuments([
   {
    id: "note-1",
    title: "Tết",
    tags: ["hsk4", "văn hóa"],
    updated_at: "2026-11-01T00:00:00Z",
    content: lexicalContent,
   },
  ]);
  expect(document?.item).toEqual(
   expect.objectContaining({
    id: "note:note-1",
    kind: "note",
    title: "Tết",
    subtitle: "hsk4 · văn hóa",
    href: "/notes/note-1",
   }),
  );
  expect(document?.body).toContain("đoàn tụ");
 });

 it("derives a display title from content and skips empty notes", () => {
  const documents = collectNoteDocuments([
   { id: "untitled", title: " ", tags: [], updated_at: "", content: lexicalContent },
   { id: "empty", title: "", tags: [], updated_at: "", content: null },
  ]);
  expect(documents.map((document) => document.item.title)).toEqual(["Ôn tập 团聚"]);
 });
});
