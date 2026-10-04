import { expect, it } from "vitest";
import type { ResolvedLessonTextAnnotation } from "@/features/hanzihome/annotations/types";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import {
 getActiveCharacterIndex,
 progressiveReadingCharacters,
 progressiveStudyTextRanges,
} from "./progressive-study-text-utils";

const annotation: ResolvedLessonTextAnnotation = {
 id: "lesson-annotation",
 lessonId: "lesson",
 nodeType: "paragraph",
 nodeId: "node",
 startOffset: 0,
 endOffset: 2,
 selectedText: "𠮷",
 prefixText: "",
 suffixText: "你",
 tone: "focus",
 noteId: null,
 noteText: "",
 createdAt: "2026-10-04T00:00:00Z",
 updatedAt: "2026-10-04T00:00:00Z",
 resolvedStartOffset: 0,
 resolvedEndOffset: 2,
 stale: false,
};
it("maps audio progress within the active substring and handles inactive or unbounded playback", () => {
 expect(getActiveCharacterIndex(6, 0, 6, 0)).toBe(0);
 expect(getActiveCharacterIndex(6, 0, 6, 0.5)).toBe(3);
 expect(getActiveCharacterIndex(6, 2, 4, 0)).toBe(2);
 expect(getActiveCharacterIndex(6, 2, 4, 0.75)).toBe(5);
 expect(getActiveCharacterIndex(6, 2, 4, 2)).toBe(5);
 expect(getActiveCharacterIndex(6, 2, 4, Number.NaN)).toBe(2);
 expect(getActiveCharacterIndex(0, 0, 0, 0.5)).toBe(-1);
 expect(getActiveCharacterIndex(6, -1, 6, 0.5)).toBe(-1);
});
it("matches UTF-16 annotation ranges to Unicode characters without mutating source annotations", () => {
 const second = {
  ...annotation,
  id: "second",
  resolvedStartOffset: 2,
  resolvedEndOffset: 3,
  selectedText: "你",
 };
 const source = [second, annotation];
 const characters = progressiveReadingCharacters("𠮷你。", source);
 expect(characters.map(({ character, annotation }) => [character, annotation?.id])).toEqual([
  ["𠮷", "lesson-annotation"],
  ["你", "second"],
  ["。", undefined],
 ]);
 expect(source[0]).toBe(second);
});
it("skips stale and overlapping Reader ranges and continues lesson ranges after the Reader cursor", () => {
 const reader: ReaderAnnotationRow = {
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "00000000-0000-4000-8000-000000000002",
  document_id: "document",
  paragraph_id: "paragraph",
  asset_id: null,
  annotation_type: "highlight",
  page_number: null,
  start_offset: 0,
  end_offset: 2,
  selected_text: "𠮷",
  note_text: "",
  color: "yellow",
  payload: {},
  revision: 0,
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
  deleted_at: null,
 };
 const lesson = { ...annotation, resolvedStartOffset: 2, resolvedEndOffset: 3, selectedText: "你" };
 const ranges = progressiveStudyTextRanges(
  "𠮷你。",
  [
   { ...reader, id: "stale", start_offset: 2, end_offset: 3, selected_text: "好" },
   reader,
   { ...reader, id: "overlap" },
  ],
  [annotation, lesson],
 );
 expect(ranges.readerRanges).toEqual([{ before: "", text: "𠮷", annotation: reader }]);
 expect(ranges.lessonRanges).toEqual([{ before: "", text: "你", annotation: lesson }]);
 expect(ranges.trailingText).toBe("。");
 expect(progressiveStudyTextRanges("你好", [], []).trailingText).toBe("你好");
});
