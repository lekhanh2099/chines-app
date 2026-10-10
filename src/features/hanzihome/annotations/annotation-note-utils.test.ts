import { expect, it } from "vitest";
import { extractAnnotationNoteText } from "./annotation-note-utils";

it("projects every paragraph and inline text from legacy annotation notes", () => {
 expect(
  extractAnnotationNoteText({
   type: "doc",
   content: [
    {
     type: "paragraph",
     content: [
      { type: "text", text: "First " },
      { type: "text", text: "paragraph" },
     ],
    },
    { type: "paragraph", content: [{ type: "text", text: "Second paragraph" }] },
   ],
  }),
 ).toBe("First paragraph\nSecond paragraph");
});

it("projects Lexical headings, paragraphs and nested lists without discarding the rest of the document", () => {
 expect(
  extractAnnotationNoteText({
   root: {
    type: "root",
    children: [
     { type: "heading", children: [{ type: "text", text: "Heading" }] },
     {
      type: "paragraph",
      children: [
       { type: "text", text: "First" },
       { type: "linebreak" },
       { type: "text", text: "line" },
      ],
     },
     { type: "list", children: [{ type: "listitem", children: [{ type: "text", text: "Item" }] }] },
    ],
   },
  }),
 ).toBe("Heading\nFirst\nline\nItem");
 expect(extractAnnotationNoteText({ root: { type: "root", children: [] } })).toBe("");
});
