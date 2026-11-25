"use client";

import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import { DictationDiffView } from "@/features/hanzihome/practice/DictationDiffView";
import { summarizeDictationDiff } from "@/features/hanzihome/practice/dictation-comparison";
import type { useStudioDictationSession } from "./useStudioDictationSession";

type StudioDictationSession = ReturnType<typeof useStudioDictationSession>;

/** Checked answer: per-token diff against the target plus the mistake summary badges. */
export function StudioDictationDiffResult({
 entry,
 diff,
 summary,
}: {
 entry: ListeningTranscriptEntry;
 diff: StudioDictationSession["diff"];
 summary: StudioDictationSession["summary"];
}) {
 return (
  <DictationDiffView
   diff={diff}
   summary={summary ?? summarizeDictationDiff(diff)}
   keyPrefix={entry.id}
   showSummary={summary !== null}
  />
 );
}
