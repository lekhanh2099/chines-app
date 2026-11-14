"use client";

import { useState } from "react";
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import type { StudioDictationScriptMode } from "@/features/dictation/StudioDictationSettingsMenu";
import { encodeJson } from "@/lib/schema/storage";
import { useDictationAttempts } from "./useDictationAttempts";
import {
 type DictationPlaybackMode,
 type DictationRecentSource,
 emptyRecentSource,
 recentSourceSchema,
} from "./studio-dictation-source-utils";

/** Owns the remembered recent source for the current session owner. */
export function useStudioDictationRecentSource(
 recentSourceStorageKey: string,
 isResolved: boolean,
) {
 const [recentSource, setRecentSource] = useState(emptyRecentSource);
 const [hasRecentSource, setHasRecentSource] = useState(false);
 const [recentSourceOwner, setRecentSourceOwner] = useState("");
 const ownerReady = isResolved && recentSourceOwner === recentSourceStorageKey;
 const hasCurrentRecentSource = hasRecentSource && recentSourceOwner === recentSourceStorageKey;
 const rememberRecentSource = (source: DictationRecentSource) => {
  const encoded = encodeJson(source, recentSourceSchema);
  if (encoded !== null) {
   try {
    window.localStorage.setItem(recentSourceStorageKey, encoded);
    setRecentSource(source);
    setHasRecentSource(true);
   } catch {
    // Practice is still available when browser storage is unavailable.
   }
  }
 };
 return {
  recentSource,
  setRecentSource,
  setHasRecentSource,
  setRecentSourceOwner,
  ownerReady,
  hasCurrentRecentSource,
  rememberRecentSource,
 };
}

/** Owns the source → mode → practice step state and checked-entry progress. */
export function useStudioDictationPracticeFlow() {
 const [resumePending, setResumePending] = useState(false);
 const [resumeUnavailable, setResumeUnavailable] = useState(false);
 const [manualSelectionOpen, setManualSelectionOpen] = useState(false);
 const [playbackMode, setPlaybackMode] = useState<DictationPlaybackMode>("sentence");
 const [modeConfirmed, setModeConfirmed] = useState(false);
 const [practiceStarted, setPracticeStarted] = useState(false);
 const [checkedEntryIds, setCheckedEntryIds] = useState<Set<string>>(() => new Set());
 const { persistAttempt: saveAttempt, attemptSaveError } = useDictationAttempts();
 const [scriptMode, setScriptMode] = useState<StudioDictationScriptMode>("hidden");
 const persistAttempt = (attempt: DictationAttempt) => {
  setCheckedEntryIds((current) => new Set(current).add(attempt.entryId));
  saveAttempt(attempt);
 };
 return {
  resumePending,
  setResumePending,
  resumeUnavailable,
  setResumeUnavailable,
  manualSelectionOpen,
  setManualSelectionOpen,
  playbackMode,
  setPlaybackMode,
  modeConfirmed,
  setModeConfirmed,
  practiceStarted,
  setPracticeStarted,
  checkedEntryIds,
  setCheckedEntryIds,
  scriptMode,
  setScriptMode,
  persistAttempt,
  attemptSaveError,
 };
}

export type StudioDictationPracticeFlow = ReturnType<typeof useStudioDictationPracticeFlow>;
export type StudioDictationRecentSourceState = ReturnType<typeof useStudioDictationRecentSource>;
