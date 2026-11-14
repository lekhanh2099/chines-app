"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useHanziHomeListeningLesson } from "@/features/hanzihome/listening/useHanziHomeListeningLesson";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
} from "@/features/hanzihome/listening/listening.view-model";
import { useTtsLibrary } from "@/features/hanzihome/tts/useTtsLibrary";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { StudioDictationWorkspaceProps } from "./StudioDictationWorkspace";
import {
 dictationBookOptions,
 dictationLessonSelection,
 dictationReaderDocumentId,
 readerDictationEntries,
 customDictationEntries,
 externalDictationEntry,
} from "./dictation-workspace-utils";
import { type DictationSource, dictationSourceTypeFor } from "./studio-dictation-source-utils";

/** Owns the dictation source selection (tab, book/volume/lesson/section, clip, custom text). */
export function useStudioDictationSource({
 initialReaderDocuments,
 initialReaderResource,
 initialReaderCourseResource,
 initialDictationLessons,
 requestedDocumentId,
 requestedReaderDocumentId,
 requestedClipId,
 practiceStarted,
 t,
}: {
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialReaderResource: StudioDictationWorkspaceProps["initialReaderResource"];
 initialReaderCourseResource: StudioDictationWorkspaceProps["initialReaderCourseResource"];
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
 requestedDocumentId: string;
 requestedReaderDocumentId: string;
 requestedClipId: string;
 practiceStarted: boolean;
 t: ReturnType<typeof useTranslations<"Dictation">>;
}) {
 const [selectedLessonIdState, setSelectedLessonId] = useState("");
 const [selectedBookIdState, setSelectedBookId] = useState("");
 const [selectedVolumeIdState, setSelectedVolumeId] = useState("");
 const [selectedSectionId, setSelectedSectionId] = useState("");
 const [selectedReaderDocumentIdState, setSelectedReaderDocumentId] = useState("");
 const [sourceType, setSourceType] = useState<DictationSource>(
  dictationSourceTypeFor(requestedDocumentId, requestedClipId),
 );
 const [selectedClipId, setSelectedClipId] = useState(requestedClipId);
 const [customText, setCustomText] = useState("");
 const ttsLibraryQuery = useTtsLibrary(sourceType === "library");
 const bookOptions = useMemo(
  () => dictationBookOptions(initialDictationLessons),
  [initialDictationLessons],
 );
 const {
  selectedBookId,
  selectedBook,
  isReaderCoursePack,
  selectedVolumeId,
  visibleLessons,
  selectedLessonId,
 } = useMemo(
  () =>
   dictationLessonSelection(
    initialDictationLessons,
    bookOptions,
    selectedBookIdState,
    selectedVolumeIdState,
    selectedLessonIdState,
   ),
  [
   initialDictationLessons,
   bookOptions,
   selectedBookIdState,
   selectedVolumeIdState,
   selectedLessonIdState,
  ],
 );
 const selectedReaderDocumentId = dictationReaderDocumentId(
  initialReaderDocuments,
  selectedReaderDocumentIdState,
  requestedReaderDocumentId,
 );
 const selectedReaderResource =
  isReaderCoursePack && initialReaderCourseResource?.document.id === selectedReaderDocumentId
   ? initialReaderCourseResource
   : null;
 const currentReaderResource =
  sourceType === "reader" && initialReaderResource?.document.id === requestedDocumentId
   ? initialReaderResource
   : sourceType === "lesson" && isReaderCoursePack
     ? selectedReaderResource
     : null;
 const bundleQuery = useHanziHomeListeningLesson(
  sourceType === "lesson" && !isReaderCoursePack ? selectedLessonId : "",
 );
 const selectedSection = useMemo(
  () =>
   bundleQuery.data?.sections.find((section) => section.id === selectedSectionId) ??
   bundleQuery.data?.sections[0],
  [bundleQuery.data?.sections, selectedSectionId],
 );
 const selectedItems = useMemo(
  () =>
   bundleQuery.data && selectedSection
    ? itemsForListeningSection(bundleQuery.data, selectedSection.id)
    : [],
  [bundleQuery.data, selectedSection],
 );
 const transcriptEntries = useMemo(
  () => (selectedSection ? transcriptsForListeningSection(selectedSection, selectedItems) : []),
  [selectedItems, selectedSection],
 );
 const effectiveSelectedClipId = selectedClipId || ttsLibraryQuery.data?.clips[0]?.id || "";
 const selectedClip = ttsLibraryQuery.data?.clips.find(
  (clip) => clip.id === effectiveSelectedClipId,
 );
 const sourceEntries = useMemo(() => {
  if (sourceType === "reader") {
   return readerDictationEntries(currentReaderResource?.paragraphs ?? [], (number) =>
    t("paragraph", { number }),
   );
  }
  if (sourceType === "lesson" && isReaderCoursePack) {
   return readerDictationEntries(selectedReaderResource?.paragraphs ?? [], (number) =>
    t("paragraph", { number }),
   );
  }
  if (sourceType === "lesson") return transcriptEntries;
  if (sourceType === "library") {
   return selectedClip === undefined
    ? []
    : [externalDictationEntry(`tts:${selectedClip.id}`, selectedClip.text, selectedClip.title)];
  }
  return customDictationEntries(customText, t("pasted"), practiceStarted);
 }, [
  customText,
  currentReaderResource?.paragraphs,
  selectedReaderResource?.paragraphs,
  isReaderCoursePack,
  selectedClip,
  sourceType,
  transcriptEntries,
  practiceStarted,
  t,
 ]);

 return {
  setSelectedLessonId,
  setSelectedBookId,
  setSelectedVolumeId,
  selectedSectionId,
  setSelectedSectionId,
  setSelectedReaderDocumentId,
  sourceType,
  setSourceType,
  selectedClipId,
  setSelectedClipId,
  customText,
  setCustomText,
  ttsLibraryQuery,
  bookOptions,
  selectedBookId,
  selectedBook,
  isReaderCoursePack,
  selectedVolumeId,
  visibleLessons,
  selectedLessonId,
  selectedReaderDocumentId,
  selectedReaderResource,
  currentReaderResource,
  bundleQuery,
  selectedSection,
  effectiveSelectedClipId,
  selectedClip,
  sourceEntries,
 };
}

export type StudioDictationSourceState = ReturnType<typeof useStudioDictationSource>;
