"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import { hanzihomeQueryKeys } from "../../query-keys";
import type { ReaderSurfacePronunciationTarget } from "../components/ReaderSurface";
import {
 ReaderPronunciationReviewPopover,
 type ReaderPronunciationSaveInput,
} from "../components/ReaderPronunciationReviewPopover";
import type { ReaderDocumentResource } from "../reader-content-api";
import {
 deleteReaderPronunciationOverride,
 saveReaderPronunciationOverride,
} from "../reader-pronunciation-api";
import { useReaderRuntimeActions } from "./ReaderRuntimeProvider";
import type {
 ReaderProgressOwner,
 ReaderPronunciationOverride,
} from "./useReaderStudyState";

export function useReaderPronunciationReview({
 resource,
 stateOwner,
 pronunciationOverrides,
 setSaveError,
}: {
 resource: ReaderDocumentResource;
 stateOwner: ReaderProgressOwner;
 pronunciationOverrides: readonly ReaderPronunciationOverride[];
 setSaveError: (error: string) => void;
}) {
 const queryClient = useQueryClient();
 const runtimeActions = useReaderRuntimeActions();
 const { openInspector } = useVocabInspector();
 const [target, setTarget] = useState<ReaderSurfacePronunciationTarget | null>(null);
 const reviewRange = useMemo(() => {
  if (!target) return null;
  const token = target.analysis.tokens.find(
   (item) =>
    item.type === "hanzi" &&
    item.start <= target.glyph.start &&
    item.end >= target.glyph.end,
  );
  return {
   start: token?.start ?? target.glyph.start,
   end: token?.end ?? target.glyph.end,
   text:
    target.segment.zh.slice(
     token?.start ?? target.glyph.start,
     token?.end ?? target.glyph.end,
    ) || target.glyph.text,
  };
 }, [target]);
 const override =
  target && reviewRange
   ? pronunciationOverrides.find(
      (item) =>
       item.paragraph_id === target.segment.id &&
       item.scope === "sentence-instance" &&
       item.start_offset === reviewRange.start &&
       item.end_offset === reviewRange.end,
     )
   : undefined;
 const meaning = reviewRange
  ? resource.vocabulary.find((item) => item.word === reviewRange.text)?.meaning
  : undefined;

 const invalidate = useCallback(
  () =>
   queryClient.invalidateQueries({
    queryKey:
     stateOwner === "reader"
      ? hanzihomeQueryKeys.readerState(resource.document.id)
      : hanzihomeQueryKeys.readerPronunciationOverrides(resource.document.id),
   }),
  [queryClient, resource.document.id, stateOwner],
 );
 const handleInspect = useCallback(
  (next: ReaderSurfacePronunciationTarget) => {
   runtimeActions.selectSegment(next.segment.id, "scroll");
   setTarget(next);
  },
  [runtimeActions],
 );
 const save = useCallback(
  (input: ReaderPronunciationSaveInput) => {
   if (!target) return;
   void saveReaderPronunciationOverride({
    id: override?.id ?? crypto.randomUUID(),
    documentId: resource.document.id,
    paragraphId: target.segment.id,
    text: input.text,
    readings: [...input.readings],
    scope: "sentence-instance",
    sentenceText: target.segment.zh,
    startOffset: input.start,
    endOffset: input.end,
    expectedRevision: override?.revision ?? 0,
   })
    .then(() => {
     setSaveError("");
     setTarget(null);
     return invalidate();
    })
    .catch((error: Error) => setSaveError(error.message));
  },
  [invalidate, override, resource.document.id, setSaveError, target],
 );
 const reset = useCallback(() => {
  if (!override) return;
  void deleteReaderPronunciationOverride({
   id: override.id,
   expectedRevision: override.revision,
  })
   .then(() => {
    setSaveError("");
    setTarget(null);
    return invalidate();
   })
   .catch((error: Error) => setSaveError(error.message));
 }, [invalidate, override, setSaveError]);
 const openFullInspector = useCallback(
  (text: string, rect: DOMRect) => {
   setTarget(null);
   openInspector(text, { anchorRect: rect });
  },
  [openInspector],
 );

 const popover = target ? (
  <ReaderPronunciationReviewPopover
   key={`${target.segment.id}:${reviewRange?.start ?? target.glyph.start}:${override?.revision ?? 0}`}
   target={target}
   confirmed={Boolean(override)}
   meaning={meaning}
   onClose={() => setTarget(null)}
   onSave={save}
   onReset={override ? reset : undefined}
   onOpenInspector={openFullInspector}
  />
 ) : null;

 return { handleInspect, popover };
}
