import type {
 LessonTextAnnotation,
 NullableAnnotationAnchor,
 ResolvedLessonTextAnnotation,
} from "./types";

const CONTEXT_LENGTH = 24;

export function createAnnotationAnchor(input: {
 lessonId: string;
 nodeType: string;
 nodeId: string;
 text: string;
 startOffset: number;
 endOffset: number;
}): NullableAnnotationAnchor {
 const { text, startOffset, endOffset } = input;
 if (startOffset < 0 || endOffset <= startOffset || endOffset > text.length) return null;

 const selectedText = text.slice(startOffset, endOffset).trim();
 if (!selectedText) return null;

 const trimmedStart = text.indexOf(selectedText, startOffset);
 const trimmedEnd = trimmedStart + selectedText.length;

 return {
  lessonId: input.lessonId,
  nodeType: input.nodeType,
  nodeId: input.nodeId,
  startOffset: trimmedStart,
  endOffset: trimmedEnd,
  selectedText,
  prefixText: text.slice(Math.max(0, trimmedStart - CONTEXT_LENGTH), trimmedStart),
  suffixText: text.slice(trimmedEnd, trimmedEnd + CONTEXT_LENGTH),
 };
}

export function resolveAnnotationAnchor(
 annotation: LessonTextAnnotation,
 currentText: string,
): ResolvedLessonTextAnnotation {
 if (currentText.slice(annotation.startOffset, annotation.endOffset) === annotation.selectedText) {
  return {
   ...annotation,
   resolvedStartOffset: annotation.startOffset,
   resolvedEndOffset: annotation.endOffset,
   stale: false,
  };
 }

 const candidates: number[] = [];
 let searchFrom = 0;
 while (searchFrom <= currentText.length) {
  const index = currentText.indexOf(annotation.selectedText, searchFrom);
  if (index < 0) break;
  candidates.push(index);
  searchFrom = index + Math.max(1, annotation.selectedText.length);
 }

 const contextualCandidates = candidates.filter((index) => {
  const prefix = currentText.slice(Math.max(0, index - annotation.prefixText.length), index);
  const suffixStart = index + annotation.selectedText.length;
  const suffix = currentText.slice(suffixStart, suffixStart + annotation.suffixText.length);
  return prefix.endsWith(annotation.prefixText) && suffix.startsWith(annotation.suffixText);
 });
 const resolvedCandidates = contextualCandidates.length ? contextualCandidates : candidates;

 if (resolvedCandidates.length === 1) {
  return {
   ...annotation,
   resolvedStartOffset: resolvedCandidates[0],
   resolvedEndOffset: resolvedCandidates[0] + annotation.selectedText.length,
   stale: false,
  };
 }

 return {
  ...annotation,
  resolvedStartOffset: annotation.startOffset,
  resolvedEndOffset: annotation.endOffset,
  stale: true,
 };
}
