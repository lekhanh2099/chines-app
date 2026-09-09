import type { ReaderSegment } from "@/features/reader/model/reader-document.types";
import type {
 ContextualPronunciationAnalysis,
 ContextualPronunciationGlyph,
} from "@/lib/pronunciation/contextual-pronunciation";

export type ReaderSurfaceSelection = {
 segment: ReaderSegment;
 index: number;
 text: string;
 start: number | null;
 end: number | null;
 rect: DOMRect;
};

export type ReaderSurfacePronunciationTarget = {
 segment: ReaderSegment;
 index: number;
 analysis: ContextualPronunciationAnalysis;
 glyph: ContextualPronunciationGlyph;
 rect: DOMRect;
};
