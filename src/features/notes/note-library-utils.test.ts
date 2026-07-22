import { describe, expect, it } from "vitest";

import { normalizeReadingUrl, plainTextToEditorDocument } from "./note-library-utils";

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
