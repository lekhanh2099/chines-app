"use client";

import type { useTranslations } from "next-intl";

import type { ContextualPronunciationAnalysis } from "@/lib/pronunciation/contextual-pronunciation";
import type { ReaderAnnotation } from "../runtime/reader-services";
import type {
 useReaderCommands,
 useReaderPlaybackStatus,
 useReaderSegment,
 useReaderServices,
} from "../runtime/reader-context";
import type { LearnerGlyphModel } from "./learner-glyphs";

/** Everything one Reader segment's glyph model reads during render. */
export type ReaderSegmentGlyphContext = {
 segment: NonNullable<ReturnType<typeof useReaderSegment>>;
 segmentId: string;
 graphemes: Intl.SegmentData[];
 glyphs: ReadonlyMap<number, ContextualPronunciationAnalysis["glyphs"][number]>;
 annotations: readonly ReaderAnnotation[];
 analysis?: ContextualPronunciationAnalysis;
 inlinePinyin: boolean;
 showPinyin: boolean;
 status: ReturnType<typeof useReaderPlaybackStatus>;
 progress: number;
 startOffset: number;
 services: ReturnType<typeof useReaderServices>;
 commands: ReturnType<typeof useReaderCommands>;
 textLabels: ReturnType<typeof useTranslations<"Reader.document.text">>;
};

/** Reader segment glyph state: Reader annotations, playback progress and play-from-character. */
export function createReaderGlyphModel(context: ReaderSegmentGlyphContext): LearnerGlyphModel {
 const {
  segment,
  segmentId,
  graphemes,
  glyphs,
  annotations,
  analysis,
  inlinePinyin,
  showPinyin,
  status,
  progress,
  startOffset,
  services,
  commands,
  textLabels,
 } = context;
 const currentOffset = Math.min(
  segment.zh.length - 1,
  startOffset + (segment.zh.length - startOffset) * progress,
 );

 return {
  graphemes,
  glyphByStart: glyphs,
  rubyPinyin: inlinePinyin && showPinyin && analysis !== undefined,
  pinyinInspectable: true,
  onInspectPinyin: (glyph, element) => {
   if (analysis === undefined) return;
   services.pronunciationReview?.onInspect({
    segmentId,
    analysis,
    glyph,
    rect: element.getBoundingClientRect(),
   });
  },
  labels: textLabels,
  stateFor: (grapheme) => {
   const annotation = annotations.find(
    (item) =>
     item.start <= grapheme.index &&
     item.end >= grapheme.index + grapheme.segment.length &&
     segment.zh.slice(item.start, item.end) === item.text,
   );
   const playable = Boolean(services.speech) && /\p{Script=Han}/u.test(grapheme.segment);
   return {
    highlighted: annotation !== undefined,
    highlightColor: annotation?.color ?? "",
    active:
     status !== "idle" &&
     grapheme.index <= currentOffset &&
     currentOffset < grapheme.index + grapheme.segment.length,
    actionLabel: annotation
     ? textLabels("openAnnotation", { text: annotation.text })
     : playable
       ? textLabels("playFromCharacter", { character: grapheme.segment })
       : "",
    onActivate: (element) => {
     if (annotation) {
      services.annotations?.onOpen(annotation, element.getBoundingClientRect());
      return;
     }
     commands.playFromCharacter(segmentId, grapheme.index);
    },
    noteText: annotation?.noteText ?? "",
   };
  },
 };
}
