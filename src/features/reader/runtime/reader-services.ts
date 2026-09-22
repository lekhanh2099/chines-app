import { z } from "zod";
import type { ReactNode } from "react";
import type { ReaderSegment, ReaderSection } from "../model/reader-document.types";
import type {
 ContextualPronunciationAnalysis,
 ContextualPronunciationGlyph,
 ContextualReadingUnit,
} from "@/lib/pronunciation/contextual-pronunciation";
import type { ReaderSpeechService } from "./reader-speech";
import type { ReaderSelection } from "./reader-selection";

export const readerAnnotationSchema = z.strictObject({
 id: z.string().min(1),
 segmentId: z.string().min(1),
 text: z.string().min(1),
 start: z.number().int().nonnegative(),
 end: z.number().int().positive(),
 color: z.enum(["yellow", "green", "blue", "pink"]).optional(),
});
export type ReaderAnnotation = z.output<typeof readerAnnotationSchema>;
export type ReaderServices = {
 toolbar?: {
  stickyOffset?: "none" | "page" | "tabs";
  actions?: ReactNode;
  hideAdvancedTools?: boolean;
  hideContentDisplay?: boolean;
 };
 renderReader?: (input: { content: ReactNode }) => ReactNode;
 renderTools?: (input: { content: ReactNode }) => ReactNode;
 renderHanzi?: (input: { segment: ReaderSegment; content: ReactNode }) => ReactNode;
 renderSegment?: (input: { segment: ReaderSegment; content: ReactNode }) => ReactNode;
 renderSection?: (input: { section: ReaderSection; content: ReactNode }) => ReactNode;
 speech?: ReaderSpeechService;
 lookup?: (selection: ReaderSelection) => void;
 annotations?: {
  items: readonly ReaderAnnotation[];
  onOpen: (annotation: ReaderAnnotation, rect: DOMRect) => void;
  onSelection: (selection: ReaderSelection) => void;
 };
 pronunciationReview?: {
  analyses: ReadonlyMap<string, ContextualPronunciationAnalysis>;
  readingUnitsBySegmentId: ReadonlyMap<string, readonly ContextualReadingUnit[]>;
  onInspect: (target: {
   segmentId: string;
   analysis: ContextualPronunciationAnalysis;
   glyph: ContextualPronunciationGlyph;
   rect: DOMRect;
  }) => void;
 };
};
