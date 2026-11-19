import { describe, expect, it } from "vitest";

import { diffNoteLines, noteContentLines } from "./note-content-diff";

type EditorNode = { type: string; text?: string; children?: EditorNode[] };

const doc = (...blocks: EditorNode[]) => ({
 root: { type: "root", children: blocks },
});
const paragraph = (text: string) => ({
 type: "paragraph",
 children: [{ type: "text", text }],
});

describe("note content diff", () => {
 it("reads editor blocks as lines, including nested list items", () => {
  const content = doc(
   { type: "heading", children: [{ type: "text", text: "第2课" }] },
   paragraph("你好"),
   paragraph(""),
   {
    type: "list",
    children: [
     { type: "listitem", children: [{ type: "text", text: "一" }] },
     { type: "listitem", children: [{ type: "text", text: "二" }] },
    ],
   },
  );
  expect(noteContentLines(JSON.parse(JSON.stringify(content)))).toEqual([
   "第2课",
   "你好",
   "一",
   "二",
  ]);
  expect(noteContentLines(null)).toEqual([]);
 });

 it("marks added and removed lines and diffs an edited line by character", () => {
  const lines = diffNoteLines(
   ["标题", "我们去公园", "旧的一行"],
   ["标题", "我们明天去公园", "新加的一行"],
  );
  expect(lines[0]).toEqual({ kind: "same", parts: [{ kind: "same", text: "标题" }] });
  expect(lines[1]).toEqual({
   kind: "changed",
   parts: [
    { kind: "same", text: "我们" },
    { kind: "added", text: "明天" },
    { kind: "same", text: "去公园" },
   ],
  });
  expect(lines[2]?.kind).toBe("changed");
 });

 it("reports identical versions as unchanged only", () => {
  expect(diffNoteLines(["a", "b"], ["a", "b"]).every((line) => line.kind === "same")).toBe(true);
  expect(diffNoteLines([], ["new"])).toEqual([
   { kind: "added", parts: [{ kind: "added", text: "new" }] },
  ]);
 });
});
