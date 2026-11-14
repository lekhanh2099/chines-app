"use client";

import { useEffect, useRef } from "react";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { decodeJson } from "@/lib/schema/storage";
import {
 dictationSourceTypeFor,
 emptyRecentSource,
 isRecentSourceAvailable,
 recentSourceSchema,
} from "./studio-dictation-source-utils";
import type {
 StudioDictationPracticeFlow,
 StudioDictationRecentSourceState,
} from "./useStudioDictationPracticeFlow";
import type { StudioDictationSourceState } from "./useStudioDictationSource";

type StudioDictationResumeParams = {
 isResolved: boolean;
 recentSourceStorageKey: string;
 requestedDocumentId: string;
 requestedReaderDocumentId: string;
 requestedClipId: string;
 resumeRequested: boolean;
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 recent: StudioDictationRecentSourceState;
 flow: StudioDictationPracticeFlow;
 source: StudioDictationSourceState;
 resetPlayback: () => void;
 tts: ReturnType<typeof useSharedMandarinTts>;
};

/**
 * Loads the per-owner recent source from browser storage (resetting the workspace when the
 * session owner changes) and completes a requested `?resume=1` once its source has loaded.
 */
export function useStudioDictationResume(params: StudioDictationResumeParams) {
 useStudioDictationRecentSourceLoad(params);
 useStudioDictationResumeCompletion(params);
}

function useStudioDictationRecentSourceLoad({
 isResolved,
 recentSourceStorageKey,
 requestedDocumentId,
 requestedReaderDocumentId,
 requestedClipId,
 resumeRequested,
 initialDictationLessons,
 initialReaderDocuments,
 recent,
 flow,
 source,
 resetPlayback,
 tts,
}: StudioDictationResumeParams) {
 const loadedRecentSourceOwner = useRef("");
 const { setRecentSource, setHasRecentSource, setRecentSourceOwner } = recent;
 const {
  setResumePending,
  setResumeUnavailable,
  setManualSelectionOpen,
  setModeConfirmed,
  setPracticeStarted,
  setCheckedEntryIds,
  setScriptMode,
 } = flow;
 const {
  bookOptions,
  setSelectedBookId,
  setSelectedVolumeId,
  setSelectedLessonId,
  setSelectedSectionId,
  setSelectedReaderDocumentId,
  setSelectedClipId,
  setSourceType,
  setCustomText,
 } = source;

 useEffect(() => {
  if (!isResolved || loadedRecentSourceOwner.current === recentSourceStorageKey) return;
  if (loadedRecentSourceOwner.current) tts.stop();
  const frame = window.requestAnimationFrame(() => {
   const previousOwner = loadedRecentSourceOwner.current;
   loadedRecentSourceOwner.current = recentSourceStorageKey;
   setRecentSourceOwner(recentSourceStorageKey);
   setRecentSource(emptyRecentSource);
   setHasRecentSource(false);
   setResumePending(false);
   setResumeUnavailable(false);
   if (previousOwner && previousOwner !== recentSourceStorageKey) {
    resetPlayback();
    setScriptMode("hidden");
    setModeConfirmed(false);
    setPracticeStarted(false);
    setCheckedEntryIds(new Set());
    setSelectedBookId("");
    setSelectedVolumeId("");
    setSelectedLessonId("");
    setSelectedSectionId("");
    setSelectedReaderDocumentId("");
    setSelectedClipId(requestedClipId);
    setSourceType(dictationSourceTypeFor(requestedDocumentId, requestedClipId));
    setCustomText("");
    setManualSelectionOpen(false);
   }
   try {
    const raw = window.localStorage.getItem(recentSourceStorageKey);
    const saved = raw === null ? null : decodeJson(raw, recentSourceSchema);
    if (saved === null) return;
    if (
     !isRecentSourceAvailable(saved, initialDictationLessons, bookOptions, initialReaderDocuments)
    )
     return;
    setRecentSource(saved);
    setHasRecentSource(true);
    if (!resumeRequested) return;
    if (
     requestedDocumentId !== saved.documentId ||
     requestedReaderDocumentId !== saved.readerDocumentId ||
     requestedClipId !== saved.clipId
    ) {
     setManualSelectionOpen(true);
     return;
    }
    setSelectedBookId(saved.bookId);
    setSelectedVolumeId(saved.volumeId);
    setSelectedLessonId(saved.lessonId);
    setSelectedSectionId(saved.sectionId);
    setSelectedReaderDocumentId(saved.readerDocumentId);
    setSelectedClipId(saved.clipId);
    setSourceType(dictationSourceTypeFor(saved.documentId, saved.clipId));
    setModeConfirmed(true);
    setResumePending(true);
   } catch {
    // Browser storage can be unavailable; manual source selection still works.
   }
  });
  return () => window.cancelAnimationFrame(frame);
 }, [
  bookOptions,
  initialDictationLessons,
  initialReaderDocuments,
  isResolved,
  recentSourceStorageKey,
  requestedClipId,
  requestedDocumentId,
  requestedReaderDocumentId,
  resetPlayback,
  resumeRequested,
  tts,
  setCheckedEntryIds,
  setCustomText,
  setHasRecentSource,
  setManualSelectionOpen,
  setModeConfirmed,
  setPracticeStarted,
  setRecentSource,
  setRecentSourceOwner,
  setResumePending,
  setResumeUnavailable,
  setScriptMode,
  setSelectedBookId,
  setSelectedClipId,
  setSelectedLessonId,
  setSelectedReaderDocumentId,
  setSelectedSectionId,
  setSelectedVolumeId,
  setSourceType,
 ]);
}

function useStudioDictationResumeCompletion({
 recentSourceStorageKey,
 requestedDocumentId,
 requestedReaderDocumentId,
 requestedClipId,
 resumeRequested,
 recent,
 flow,
 source,
}: StudioDictationResumeParams) {
 const { recentSource, setHasRecentSource, hasCurrentRecentSource } = recent;
 const {
  resumePending,
  setResumePending,
  setResumeUnavailable,
  setManualSelectionOpen,
  setModeConfirmed,
  setPracticeStarted,
 } = flow;
 const {
  sourceType,
  ttsLibraryQuery,
  bundleQuery,
  isReaderCoursePack,
  currentReaderResource,
  selectedClip,
  selectedReaderResource,
  selectedLessonId,
  selectedSection,
  sourceEntries,
 } = source;
 const resumeUrlMatchesRecent =
  requestedDocumentId === recentSource.documentId &&
  requestedReaderDocumentId === recentSource.readerDocumentId &&
  requestedClipId === recentSource.clipId;
 useEffect(() => {
  if (!resumePending || !hasCurrentRecentSource || !resumeRequested || !resumeUrlMatchesRecent)
   return;
  if (sourceType === "library" && ttsLibraryQuery.isPending) return;
  if (sourceType === "lesson" && !isReaderCoursePack && bundleQuery.isPending) return;

  const hasExactSource =
   sourceType === "reader"
    ? currentReaderResource?.document.id === recentSource.documentId
    : sourceType === "library"
      ? selectedClip?.id === recentSource.clipId
      : isReaderCoursePack
        ? selectedReaderResource?.document.id === recentSource.readerDocumentId
        : selectedLessonId === recentSource.lessonId &&
          selectedSection?.id === recentSource.sectionId;
  const readFailed =
   (sourceType === "library" && ttsLibraryQuery.isError) ||
   (sourceType === "lesson" && !isReaderCoursePack && bundleQuery.isError);
  const frame = window.requestAnimationFrame(() => {
   setResumePending(false);
   if (hasExactSource && sourceEntries.length > 0) {
    setPracticeStarted(true);
    return;
   }
   setModeConfirmed(false);
   setManualSelectionOpen(true);
   setResumeUnavailable(!readFailed);
   if (!readFailed) {
    setHasRecentSource(false);
    try {
     window.localStorage.removeItem(recentSourceStorageKey);
    } catch {
     // The invalid recent source stays hidden for this visit.
    }
   }
  });
  return () => window.cancelAnimationFrame(frame);
 }, [
  bundleQuery.isError,
  bundleQuery.isPending,
  currentReaderResource,
  hasCurrentRecentSource,
  isReaderCoursePack,
  recentSource.clipId,
  recentSource.documentId,
  recentSource.lessonId,
  recentSource.readerDocumentId,
  recentSource.sectionId,
  recentSourceStorageKey,
  requestedClipId,
  requestedDocumentId,
  requestedReaderDocumentId,
  resumePending,
  resumeRequested,
  resumeUrlMatchesRecent,
  selectedClip,
  selectedLessonId,
  selectedReaderResource,
  selectedSection,
  sourceEntries.length,
  sourceType,
  ttsLibraryQuery.isError,
  ttsLibraryQuery.isPending,
  setHasRecentSource,
  setManualSelectionOpen,
  setModeConfirmed,
  setPracticeStarted,
  setResumePending,
  setResumeUnavailable,
 ]);
}
