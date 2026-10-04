import type { ResolvedLessonTextAnnotation } from "@/features/hanzihome/annotations/types";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

export function getActiveCharacterIndex(
 characterCount: number,
 startIndex: number,
 activeCharacterCount: number,
 progress: number,
) {
 if (characterCount === 0 || startIndex < 0 || activeCharacterCount <= 0) return -1;

 const boundedProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
 const offset = Math.min(
  activeCharacterCount - 1,
  Math.floor(boundedProgress * activeCharacterCount),
 );

 return Math.min(characterCount - 1, startIndex + offset);
}

export function progressiveStudyTextRanges(
 text: string,
 readerAnnotations: readonly ReaderAnnotationRow[],
 annotations: readonly ResolvedLessonTextAnnotation[],
) {
 const readerRanges: { before: string; text: string; annotation: ReaderAnnotationRow }[] = [];
 const lessonRanges: { before: string; text: string; annotation: ResolvedLessonTextAnnotation }[] =
  [];
 let cursor = 0;
 for (const annotation of [...readerAnnotations].sort(
  (left, right) => (left.start_offset ?? 0) - (right.start_offset ?? 0),
 )) {
  if (
   annotation.start_offset === null ||
   annotation.end_offset === null ||
   annotation.start_offset < cursor ||
   text.slice(annotation.start_offset, annotation.end_offset) !== annotation.selected_text
  )
   continue;
  readerRanges.push({
   before: text.slice(cursor, annotation.start_offset),
   text: annotation.selected_text,
   annotation,
  });
  cursor = annotation.end_offset;
 }
 for (const annotation of [...annotations].sort(
  (left, right) => left.resolvedStartOffset - right.resolvedStartOffset,
 )) {
  if (annotation.resolvedStartOffset < cursor) continue;
  lessonRanges.push({
   before: text.slice(cursor, annotation.resolvedStartOffset),
   text: text.slice(annotation.resolvedStartOffset, annotation.resolvedEndOffset),
   annotation,
  });
  cursor = annotation.resolvedEndOffset;
 }
 return { readerRanges, lessonRanges, trailingText: text.slice(cursor) };
}

export function progressiveReadingCharacters(
 text: string,
 annotations: readonly ResolvedLessonTextAnnotation[],
) {
 const sortedAnnotations = [...annotations].sort(
  (left, right) => left.resolvedStartOffset - right.resolvedStartOffset,
 );
 let characterOffset = 0;
 return Array.from(text).map((character, index) => {
  const startOffset = characterOffset;
  characterOffset += character.length;
  const endOffset = characterOffset;
  const annotation = sortedAnnotations.find(
   (candidate) =>
    candidate.resolvedStartOffset <= startOffset && candidate.resolvedEndOffset >= endOffset,
  );
  return { character, index, annotation };
 });
}
