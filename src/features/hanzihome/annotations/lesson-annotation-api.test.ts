import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
 LessonAnnotationConflictError,
 updateLessonAnnotationNote,
 fetchLessonAnnotations,
 createLessonAnnotation,
 deleteLessonAnnotation,
} from "./lesson-annotation-api";
import type { LessonTextAnnotation } from "./types";

const annotation: LessonTextAnnotation = {
 id: "00000000-0000-4000-8000-000000002021",
 lessonId: "lesson-1",
 nodeType: "paragraph",
 nodeId: "paragraph-1",
 startOffset: 0,
 endOffset: 2,
 selectedText: "你好",
 prefixText: "",
 suffixText: "",
 tone: "focus",
 noteId: null,
 note: null,
 noteText: "",
 createdAt: "2026-10-08T00:00:00Z",
 updatedAt: "2026-10-08T00:00:00Z",
};
const input = { annotationId: annotation.id, noteText: "Local draft", expectedRevision: null };
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
 fetchMock.mockReset();
 vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("sends the captured owner on annotation reads, creates and deletes", async () => {
 const ownerUserId = "user-test-1";
 fetchMock.mockResolvedValueOnce(Response.json({ annotations: [annotation] }));
 await expect(fetchLessonAnnotations(annotation.lessonId, ownerUserId)).resolves.toEqual([
  annotation,
 ]);
 expect(fetchMock).toHaveBeenLastCalledWith("/api/hanzihome/lesson-annotations?lessonId=lesson-1", {
  cache: "no-store",
  headers: { "X-HanziHome-Owner-Id": ownerUserId },
 });
 const anchor = {
  lessonId: annotation.lessonId,
  nodeType: annotation.nodeType,
  nodeId: annotation.nodeId,
  startOffset: annotation.startOffset,
  endOffset: annotation.endOffset,
  selectedText: annotation.selectedText,
  prefixText: annotation.prefixText,
  suffixText: annotation.suffixText,
 };
 fetchMock.mockResolvedValueOnce(Response.json({ annotation }));
 await expect(createLessonAnnotation({ anchor }, ownerUserId)).resolves.toEqual(annotation);
 expect(fetchMock).toHaveBeenLastCalledWith("/api/hanzihome/lesson-annotations", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify({ anchor }),
 });
 fetchMock.mockResolvedValueOnce(Response.json({ deleted: true }));
 await expect(deleteLessonAnnotation(annotation.id, ownerUserId)).resolves.toBe(true);
 expect(fetchMock).toHaveBeenLastCalledWith(`/api/hanzihome/lesson-annotations/${annotation.id}`, {
  method: "DELETE",
  headers: { "X-HanziHome-Owner-Id": ownerUserId },
 });
});

it("sends the observed absence base and exposes the authoritative conflict without retry", async () => {
 fetchMock.mockResolvedValue(Response.json({ saved: false, annotation }, { status: 409 }));
 const failure = updateLessonAnnotationNote(input, "user-test-1");
 await expect(failure).rejects.toBeInstanceOf(LessonAnnotationConflictError);
 await expect(failure).rejects.toMatchObject({ annotation });
 expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
  `/api/hanzihome/lesson-annotations/${annotation.id}`,
  {
   method: "PATCH",
   headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": "user-test-1" },
   body: JSON.stringify({ noteText: input.noteText, expectedRevision: null }),
  },
 );
});

it("does not acknowledge a success response without the linked committed note", async () => {
 fetchMock.mockResolvedValue(Response.json({ saved: true, annotation }));
 await expect(updateLessonAnnotationNote(input, "user-test-1")).rejects.toThrow(
  "Server chưa xác nhận đúng ghi chú vừa lưu.",
 );
});

it("propagates transport and malformed snapshot failures without making a second write", async () => {
 fetchMock.mockRejectedValue(new Error("Connection lost"));
 await expect(updateLessonAnnotationNote(input, "user-test-1")).rejects.toThrow("Connection lost");
 expect(fetchMock).toHaveBeenCalledTimes(1);
 fetchMock.mockReset();
 fetchMock.mockResolvedValue(
  Response.json({ saved: false, annotation: { id: annotation.id } }, { status: 409 }),
 );
 await expect(updateLessonAnnotationNote(input, "user-test-1")).rejects.toThrow();
 expect(fetchMock).toHaveBeenCalledTimes(1);
});
