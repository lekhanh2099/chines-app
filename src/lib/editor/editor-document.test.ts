import { describe, expect, it } from "vitest";

import {
 EMPTY_LEXICAL_DOCUMENT,
 convertProseMirrorToLexical,
 isLexicalDocument,
 isProseMirrorDocument,
 toLexicalEditorState,
} from "./editor-document";

describe("editor-document utilities", () => {
 it("recognizes a valid Lexical document", () => {
  expect(isLexicalDocument(EMPTY_LEXICAL_DOCUMENT)).toBe(true);
  expect(isLexicalDocument({ root: { type: "root", children: [] } })).toBe(true);
  expect(isLexicalDocument({ type: "doc" })).toBe(false);
  expect(isLexicalDocument(null)).toBe(false);
  expect(isLexicalDocument(undefined)).toBe(false);
 });

 it("recognizes a legacy ProseMirror document", () => {
  expect(isProseMirrorDocument({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true);
  expect(isProseMirrorDocument({ type: "doc" })).toBe(true);
  expect(isProseMirrorDocument(EMPTY_LEXICAL_DOCUMENT)).toBe(false);
 });

 it("converts empty ProseMirror document into valid Lexical document", () => {
  const legacyEmpty = { type: "doc", content: [{ type: "paragraph" }] };
  const converted = convertProseMirrorToLexical(legacyEmpty);

  expect(isLexicalDocument(converted)).toBe(true);
  expect(converted).toMatchObject({
   root: {
    type: "root",
    children: [
     {
      type: "paragraph",
      children: [],
     },
    ],
   },
  });
 });

 it("converts ProseMirror document with headings and text into Lexical nodes", () => {
  const legacyWithText = {
   type: "doc",
   content: [
    {
     type: "heading",
     attrs: { level: 1 },
     content: [{ type: "text", text: "Tiêu đề" }],
    },
    {
     type: "paragraph",
     content: [{ type: "text", text: "Nội dung dòng 1" }],
    },
   ],
  };

  const converted = convertProseMirrorToLexical(legacyWithText);
  expect(isLexicalDocument(converted)).toBe(true);
  expect(converted).toMatchObject({
   root: {
    type: "root",
    children: [
     {
      type: "heading",
      tag: "h1",
      children: [{ type: "text", text: "Tiêu đề" }],
     },
     {
      type: "paragraph",
      children: [{ type: "text", text: "Nội dung dòng 1" }],
     },
    ],
   },
  });
 });

 it("handles toLexicalEditorState correctly for all input shapes", () => {
  // Nil / empty input returns undefined
  expect(toLexicalEditorState(null)).toBeUndefined();
  expect(toLexicalEditorState(undefined)).toBeUndefined();

  // Valid Lexical returns JSON string
  const lexicalResult = toLexicalEditorState(EMPTY_LEXICAL_DOCUMENT);
  expect(typeof lexicalResult).toBe("string");
  expect(JSON.parse(lexicalResult ?? "")).toMatchObject({ root: { type: "root" } });

  // Legacy ProseMirror converts to JSON string
  const pmResult = toLexicalEditorState({ type: "doc", content: [{ type: "paragraph" }] });
  expect(typeof pmResult).toBe("string");
  expect(JSON.parse(pmResult ?? "")).toMatchObject({ root: { type: "root" } });

  // Corrupted / unknown input returns undefined safely
  expect(toLexicalEditorState({ foo: "bar" })).toBeUndefined();
 });
});
