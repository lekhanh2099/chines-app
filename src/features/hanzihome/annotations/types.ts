export type LessonTextAnnotation = {
 id: string;
 lessonId: string;
 nodeType: string;
 nodeId: string;
 startOffset: number;
 endOffset: number;
 selectedText: string;
 prefixText: string;
 suffixText: string;
 tone: "focus";
 noteId: string | null;
 noteText: string;
 createdAt: string;
 updatedAt: string;
};

export type AnnotationAnchor = {
 lessonId: string;
 nodeType: string;
 nodeId: string;
 startOffset: number;
 endOffset: number;
 selectedText: string;
 prefixText: string;
 suffixText: string;
};

export type ResolvedLessonTextAnnotation = LessonTextAnnotation & {
 resolvedStartOffset: number;
 resolvedEndOffset: number;
 stale: boolean;
};
