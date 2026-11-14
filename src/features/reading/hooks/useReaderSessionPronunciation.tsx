"use client";

import { useMemo, useState } from "react";
import type { ReaderSegment } from "@/features/reader/model/reader-document.types";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
 formatContextualSpokenPinyin,
 getContextualReadingUnits,
 type PronunciationOverride,
} from "@/lib/pronunciation/contextual-pronunciation";
import { ReaderPronunciationReviewPopover } from "@/features/reading/components/ReaderPronunciationReviewPopover";
import type { ReaderSurfacePronunciationTarget } from "@/features/reading/model/reading-interactions";

// Source workspaces own session-only corrections; the Reader consumes analyses
// and callbacks, never another pronunciation context or persisted store.
export function useReaderSessionPronunciation(
 segments: readonly ReaderSegment[],
 autoDetectPinyin: boolean,
) {
 const [overridesBySegmentId, setOverridesBySegmentId] = useState<
  ReadonlyMap<string, readonly PronunciationOverride[]>
 >(() => new Map());
 const [target, setTarget] = useState<ReaderSurfacePronunciationTarget | null>(null);
 const analyses = useMemo(() => {
  const result = new Map<string, ReturnType<typeof analyzeContextualPronunciation>>();
  for (const segment of segments) {
   const overrides = overridesBySegmentId.get(segment.id) ?? [];
   if (
    segment.zh.length > 2_000 ||
    (!autoDetectPinyin && !segment.pinyin && overrides.length === 0)
   )
    continue;
   result.set(
    segment.id,
    analyzeContextualPronunciation({
     text: segment.zh,
     sourcePinyin: segment.pinyin && segment.pinyin.length <= 8_000 ? segment.pinyin : null,
     overrides,
    }),
   );
  }
  return result;
 }, [segments, autoDetectPinyin, overridesBySegmentId]);
 const preparedSegments = useMemo(
  () =>
   segments.map((segment) => {
    const analysis = analyses.get(segment.id);
    if (analysis === undefined) return segment;
    if (autoDetectPinyin) return { ...segment, pinyin: formatContextualReadingPinyin(analysis) };
    return analysis.glyphs.some((glyph) => glyph.evidence.includes("manual-override"))
     ? { ...segment, pinyin: formatContextualSpokenPinyin(analysis) }
     : segment;
   }),
  [segments, analyses, autoDetectPinyin],
 );
 const readingUnitsBySegmentId = useMemo(() => {
  const result = new Map<string, ReturnType<typeof getContextualReadingUnits>>();
  if (!autoDetectPinyin) return result;
  for (const [segmentId, analysis] of analyses) {
   result.set(segmentId, getContextualReadingUnits(analysis));
  }
  return result;
 }, [analyses, autoDetectPinyin]);
 const service: ReaderServices["pronunciationReview"] = {
  analyses,
  readingUnitsBySegmentId,
  onInspect: (input) => {
   const index = segments.findIndex((segment) => segment.id === input.segmentId);
   const segment = segments[index];
   if (segment)
    setTarget({ segment, index, analysis: input.analysis, glyph: input.glyph, rect: input.rect });
  },
 };
 const confirmed = target?.glyph.evidence.includes("manual-override") ?? false;
 const popover = target ? (
  <ReaderPronunciationReviewPopover
   target={target}
   confirmed={confirmed}
   saveScope="session"
   onClose={() => setTarget(null)}
   onSave={(input) => {
    const override: PronunciationOverride = {
     id: `local:${target.segment.id}:${input.start}:${input.end}`,
     text: input.text,
     readings: [...input.readings],
     scope: "sentence-instance",
     sentenceText: target.segment.zh,
     start: input.start,
     end: input.end,
     updatedAt: new Date().toISOString(),
    };
    setOverridesBySegmentId((current) => {
     const next = new Map(current);
     next.set(target.segment.id, [
      ...(current.get(target.segment.id) ?? []).filter(
       (item) =>
        item.scope !== "sentence-instance" || item.start !== input.start || item.end !== input.end,
      ),
      override,
     ]);
     return next;
    });
    setTarget(null);
   }}
   onReset={
    confirmed
     ? () => {
        const token = target.analysis.tokens.find(
         (item) =>
          item.type === "hanzi" && item.start <= target.glyph.start && item.end >= target.glyph.end,
        );
        const start = token?.start ?? target.glyph.start;
        const end = token?.end ?? target.glyph.end;
        setOverridesBySegmentId((current) => {
         const next = new Map(current);
         const remaining = (current.get(target.segment.id) ?? []).filter(
          (item) => item.scope !== "sentence-instance" || item.start !== start || item.end !== end,
         );
         if (remaining.length) next.set(target.segment.id, remaining);
         else next.delete(target.segment.id);
         return next;
        });
        setTarget(null);
       }
     : undefined
   }
  />
 ) : null;
 return { segments: preparedSegments, service, popover };
}
