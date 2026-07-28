import { describe, expect, it } from "vitest";

import { createAnnotationAnchor, resolveAnnotationAnchor } from "./annotation-anchor";
import type { LessonTextAnnotation } from "./types";

function annotationFromAnchor(
 anchor: NonNullable<ReturnType<typeof createAnnotationAnchor>>,
): LessonTextAnnotation {
 return {
  id: "a1",
  ...anchor,
  tone: "focus",
  noteId: null,
  noteText: "",
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
 };
}

describe("lesson annotation anchors", () => {
 it("captures normalized offsets and surrounding context", () => {
  const text = "我很早就希望来中国学习汉语。";
  const anchor = createAnnotationAnchor({
   lessonId: "lesson-1",
   nodeType: "text_line",
   nodeId: "line-1",
   text,
   startOffset: 5,
   endOffset: 12,
  });

  expect(anchor).toMatchObject({
   selectedText: text.slice(5, 12),
   startOffset: 5,
   endOffset: 12,
  });
 });

 it("re-anchors a unique quote after source text shifts", () => {
  const source = "我希望来中国学习汉语。";
  const anchor = createAnnotationAnchor({
   lessonId: "lesson-1",
   nodeType: "text_line",
   nodeId: "line-1",
   text: source,
   startOffset: 1,
   endOffset: 3,
  });
  expect(anchor).not.toBeNull();
  if (!anchor) throw new Error("Expected annotation anchor");

  const resolved = resolveAnnotationAnchor(annotationFromAnchor(anchor), `以前${source}`);
  expect(resolved.stale).toBe(false);
  expect(resolved.resolvedStartOffset).toBe(3);
 });

 it("marks an ambiguous quote as stale instead of highlighting the wrong text", () => {
  const anchor = createAnnotationAnchor({
   lessonId: "lesson-1",
   nodeType: "text_line",
   nodeId: "line-1",
   text: "很好",
   startOffset: 0,
   endOffset: 1,
  });
  expect(anchor).not.toBeNull();
  if (!anchor) throw new Error("Expected annotation anchor");

  const resolved = resolveAnnotationAnchor(annotationFromAnchor(anchor), "不很也很");
  expect(resolved.stale).toBe(true);
 });
});
