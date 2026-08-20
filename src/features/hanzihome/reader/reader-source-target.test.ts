import { describe, expect, it } from "vitest";

import { buildReaderSourceHref, parseReaderSourceTarget } from "./reader-source-target";

describe("reader source targets", () => {
 it("round-trips a document paragraph and selected range", () => {
  const href = buildReaderSourceHref({
   source: "reader-selection",
   documentId: "doc-1",
   paragraphId: "paragraph-2",
   startOffset: 4,
   endOffset: 9,
  });
  const target = parseReaderSourceTarget(new URL(href, "https://app.example").searchParams);

  expect(target).toEqual({
   source: "reader-selection",
   documentId: "doc-1",
   paragraphId: "paragraph-2",
   startOffset: 4,
   endOffset: 9,
  });
 });

 it("round-trips paragraph-only shadowing context", () => {
  const href = buildReaderSourceHref({
   source: "shadowing",
   documentId: "doc-2",
   paragraphId: "paragraph-3",
  });

  expect(parseReaderSourceTarget(new URL(href, "https://app.example").searchParams)).toEqual({
   source: "shadowing",
   documentId: "doc-2",
   paragraphId: "paragraph-3",
  });
 });

 it("rejects incomplete and reversed ranges", () => {
  expect(
   parseReaderSourceTarget(
    new URLSearchParams({
     source: "reader-selection",
     document: "doc-1",
     paragraph: "p-1",
     start: "5",
    }),
   ),
  ).toBeNull();
  expect(
   parseReaderSourceTarget(
    new URLSearchParams({
     source: "reader-selection",
     document: "doc-1",
     paragraph: "p-1",
     start: "5",
     end: "4",
    }),
   ),
  ).toBeNull();
 });
});
