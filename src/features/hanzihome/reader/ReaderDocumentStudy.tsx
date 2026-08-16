"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
 BookmarkPlus,
 BookOpenText,
 Check,
 ChevronLeft,
 ChevronRight,
 Info,
 Highlighter,
 Keyboard,
 Languages,
 List,
 NotebookPen,
 RotateCcw,
 Settings2,
 Square,
 StickyNote,
 Type,
 Volume2,
 X,
 type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuShortcut,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createClient } from "@/lib/supabase/client";
import { ContextualReaderText } from "@/features/hanzihome/reader/ContextualReaderText";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { getActiveCharacterIndex } from "@/features/hanzihome/components/lesson-overview/ProgressiveStudyText";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 analyzeContextualPronunciation,
 formatContextualPinyinRange,
 formatContextualReading,
 formatContextualSpokenPinyin,
 type ContextualPronunciationGlyph,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import {
 fetchDailyReadingState,
 fetchPersonalLearningState,
 fetchReaderState,
 ReaderProgressConflictError,
 saveDailyReadingState,
 savePersonalLearningState,
 saveReaderProgress,
} from "./reader-state-api";
import type { ReaderDocumentResource } from "./reader-content-api";
import { readerFeatureStateSchema } from "./reader-state.schemas";
import type { ReaderAnswerState, ReaderDocumentRow } from "./reader.schemas";
import {
 createReaderAnnotation,
 deleteReaderAnnotation,
 fetchReaderAnnotations,
} from "./reader-annotation-api";
import {
 deleteReaderPronunciationOverride,
 fetchReaderPronunciationOverrides,
 saveReaderPronunciationOverride,
} from "./reader-pronunciation-api";
import {
 createReaderAutosaveController,
 emptyReaderSessionState,
 hasPendingReaderStateChange,
 moveReaderParagraph,
 readerFeatureStateEqual,
 readerFeatureStateFromSession,
 resolveReaderPlaybackEnd,
 toggleReaderAutoAdvance,
 toggleReaderLoop,
 type ReaderAutosaveController,
 type ReaderFeatureState,
 type ReaderSessionState,
} from "./reader-session";
import { hanzihomeQueryKeys } from "../query-keys";
import { ReaderExercisePanel } from "./ReaderExercisePanel";
import { ReaderTranslationPracticePanel } from "./ReaderTranslationPracticePanel";
import { ReaderHeaderContextBridge } from "./ReaderHeaderContextBridge";
import { ReaderVocabularyPanel } from "./ReaderVocabularyPanel";
import { ShadowingPracticePanel } from "./ShadowingPracticePanel";
import { savePracticeAttempt } from "../practice/practice-attempt-api";
import { upsertLearningLoopItem } from "../learning-loop/learning-loop-api";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 translationReferenceText,
 type TranslationDirection,
} from "../practice/translation-practice";

type ReaderProgressOwner = "reader" | "daily" | "personal";
type ReaderSelectionMode = "quick" | "note";
type ReaderWorkspaceTab =
 | "reader"
 | "overview"
 | "exercises"
 | "vocabulary"
 | "translation"
 | "dictation"
 | "analysis"
 | "summary"
 | "notes";

const readerPinyinModeSchema = z.enum(["off", "focus", "contextual", "full"]);
type ReaderPinyinMode = z.output<typeof readerPinyinModeSchema>;

const readerPinyinModeLabels: Record<ReaderPinyinMode, string> = {
 off: "Tắt",
 focus: "Câu hiện tại",
 contextual: "Pinyin theo ngữ cảnh",
 full: "Toàn bài",
};

const readerWorkspaceTabs: ReadonlyArray<{
 id: ReaderWorkspaceTab;
 label: string;
 icon: LucideIcon;
}> = [
 { id: "overview", label: "Tổng quan", icon: Info },
 { id: "reader", label: "Đọc bài", icon: BookOpenText },
 { id: "exercises", label: "Bài tập", icon: Check },
 { id: "vocabulary", label: "Từ vựng", icon: Type },
 { id: "translation", label: "Luyện dịch", icon: Languages },
 { id: "dictation", label: "Chép chính tả", icon: Keyboard },
 { id: "analysis", label: "Mạch bài", icon: List },
 { id: "summary", label: "Tóm tắt", icon: List },
 { id: "notes", label: "Ghi chú", icon: NotebookPen },
];

const readerRateOptions = [0.75, 0.9, 1, 1.1, 1.25];

const defaultReaderDocumentState: ReaderSessionState = {
 ...emptyReaderSessionState,
 showPinyin: true,
};

function readMetadataString(
 metadata: ReaderDocumentResource["document"]["source_metadata"],
 key: string,
) {
 const value = metadata[key];
 return typeof value === "string" ? value : null;
}

function readMetadataStrings(
 metadata: ReaderDocumentResource["document"]["source_metadata"],
 key: string,
): string[] {
 const parsed = z.array(z.string()).safeParse(metadata[key]);
 return parsed.success ? parsed.data : [];
}

function readMetadataNumber(
 metadata: ReaderDocumentResource["document"]["source_metadata"],
 key: string,
) {
 const value = metadata[key];
 if (typeof value === "number") return value;
 const counts = z.record(z.string(), z.number()).safeParse(metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

function formatPlaybackTime(seconds: number) {
 const totalSeconds = Math.max(0, Math.floor(seconds));
 const minutes = Math.floor(totalSeconds / 60);
 const remainder = String(totalSeconds % 60).padStart(2, "0");
 return `${minutes}:${remainder}`;
}

export function ReaderDocumentStudy({
 resource,
 stateOwner = "reader",
 backHref = "/reader",
 backLabel = "Danh sách Reader",
 navigationDocuments = [],
}: {
 resource: ReaderDocumentResource;
 stateOwner?: ReaderProgressOwner;
 backHref?: string;
 backLabel?: string;
 navigationDocuments?: ReadonlyArray<ReaderDocumentRow>;
}) {
 const tts = useSharedMandarinTts();
 const { openInspector } = useVocabInspector();
 const stopTts = tts.stop;
 const queryClient = useQueryClient();
 const paragraphs = resource.paragraphs;
 const [localState, setLocalState] = useState<ReaderSessionState | null>(null);
 const [selectedText, setSelectedText] = useState("");
 const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
 const [selectedGlyph, setSelectedGlyph] = useState<ContextualPronunciationGlyph | null>(null);
 const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
 const [speechText, setSpeechText] = useState("");
 const [speechStartIndex, setSpeechStartIndex] = useState(0);
 const [speechParagraphId, setSpeechParagraphId] = useState("");
 const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
 const [selectionMode, setSelectionMode] = useState<ReaderSelectionMode>("quick");
 const [pinyinModeOverride, setPinyinModeOverride] = useState<ReaderPinyinMode | null>(null);
 const [noteDraft, setNoteDraft] = useState("");
 const [workspaceTab, setWorkspaceTab] = useState<ReaderWorkspaceTab>("reader");
 const [translationDirection, setTranslationDirection] = useState<TranslationDirection>("zh-vi");
 const [translationDrafts, setTranslationDrafts] = useState<Record<string, string>>({});
 const [translationChecked, setTranslationChecked] = useState<Record<string, boolean>>({});
 const [translationStartedAt, setTranslationStartedAt] = useState<Record<string, number>>({});
 const [saveError, setSaveError] = useState("");
 const revisionRef = useRef(0);
 const saveQueueRef = useRef(Promise.resolve());
 const stateChangeVersionRef = useRef(0);
 const persistedStateChangeVersionRef = useRef(0);
 const readerPersistedSnapshotRef = useRef<ReaderFeatureState | null>(null);
 const readerAutosaveLatestRef = useRef<{
  snapshot: ReaderFeatureState;
  changeVersion: number;
 } | null>(null);
 const readerAutosaveControllerRef = useRef<ReaderAutosaveController | null>(null);
 const playbackRunRef = useRef(0);
 const playbackStateRef = useRef(defaultReaderDocumentState);
 const supabase = useMemo(() => createClient(), []);
 const sessionQuery = useQuery({
  queryKey: ["hanzihome", "reader-session-user"],
  queryFn: () => getClientSessionUser(supabase),
  enabled: true,
  staleTime: 60_000,
 });
 const readerStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerState(resource.document.id),
  queryFn: () => fetchReaderState(resource.document.id),
  enabled: stateOwner === "reader" && sessionQuery.data !== undefined && sessionQuery.data !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const readerStateRefetchRef = useRef(readerStateQuery.refetch);
 useEffect(() => {
  readerStateRefetchRef.current = readerStateQuery.refetch;
 }, [readerStateQuery.refetch]);
 const hasSession = sessionQuery.data !== null && sessionQuery.data !== undefined;
 const dailyPublishedDate =
  stateOwner === "daily"
   ? readMetadataString(resource.document.source_metadata, "published_date")
   : null;
 const personalNodeId =
  stateOwner === "personal"
   ? readMetadataString(resource.document.source_metadata, "knowledge_node_id")
   : null;
 const dailyTopic = readMetadataString(resource.document.source_metadata, "topic");
 const dailyLevel = readMetadataString(resource.document.source_metadata, "level");
 const dailyAdaptationNotice = readMetadataString(
  resource.document.source_metadata,
  "adaptation_notice_vi",
 );
 const personalMasteryChecklist = readMetadataStrings(
  resource.document.source_metadata,
  "mastery_checklist_vi",
 );
 const personalSourceIds = readMetadataStrings(resource.document.source_metadata, "source_ids");
 const personalEssentialQuestion = readMetadataString(
  resource.document.source_metadata,
  "essential_question_vi",
 );
 const personalKeyIdea = readMetadataString(resource.document.source_metadata, "key_idea_vi");
 const dailyStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerDailyState(dailyPublishedDate ?? ""),
  queryFn: () => fetchDailyReadingState(dailyPublishedDate ?? ""),
  enabled: hasSession && stateOwner === "daily" && dailyPublishedDate !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const personalStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPersonalState(personalNodeId ?? ""),
  queryFn: () => fetchPersonalLearningState(personalNodeId ?? ""),
  enabled: hasSession && stateOwner === "personal" && personalNodeId !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const stateQueryPending =
  (stateOwner === "reader"
   ? sessionQuery.isPending || (hasSession && readerStateQuery.isPending)
   : sessionQuery.isPending) ||
  (hasSession &&
   (stateOwner === "reader"
    ? false
    : stateOwner === "daily"
      ? dailyPublishedDate === null || dailyStateQuery.isPending
      : personalNodeId === null || personalStateQuery.isPending));
 const stateQueryError =
  stateOwner === "reader"
   ? readerStateQuery.error
   : stateOwner === "daily"
     ? dailyStateQuery.error
     : personalStateQuery.error;
 const remoteState = useMemo(() => {
  if (stateOwner === "reader") {
   return readerStateQuery.data?.progress
    ? {
       ...defaultReaderDocumentState,
       showPinyin: readerStateQuery.data.progress.show_pinyin,
       showMeaning: readerStateQuery.data.progress.show_meaning,
       completed: readerStateQuery.data.progress.completed,
       summaryText: readerStateQuery.data.progress.summary_text,
       answers: readerStateQuery.data.progress.answers,
      }
    : null;
  }
  const rowState =
   stateOwner === "daily" ? dailyStateQuery.data?.state : personalStateQuery.data?.state;
  const parsed = readerFeatureStateSchema.safeParse(rowState);
  return parsed.success ? { ...defaultReaderDocumentState, ...parsed.data } : null;
 }, [dailyStateQuery.data, personalStateQuery.data, readerStateQuery.data, stateOwner]);
 const state = useMemo(
  () => localState ?? remoteState ?? defaultReaderDocumentState,
  [localState, remoteState],
 );
 const featureState = useMemo(() => readerFeatureStateFromSession(state), [state]);
 const pinyinMode = pinyinModeOverride ?? (state.showPinyin ? "focus" : "off");
 useEffect(() => {
  playbackStateRef.current = state;
 }, [state]);
 const setState = useCallback(
  (updater: SetStateAction<ReaderSessionState>) => {
   stateChangeVersionRef.current += 1;
   setLocalState((current) => {
    const base = current ?? state;
    return typeof updater === "function" ? updater(base) : updater;
   });
  },
  [state],
 );
 const updatePinyinMode = (nextMode: ReaderPinyinMode) => {
  setPinyinModeOverride(nextMode);
  setState((current) => ({ ...current, showPinyin: nextMode !== "off" }));
 };
 useEffect(
  () => () => {
   playbackRunRef.current += 1;
   stopTts();
  },
  [stopTts],
 );
 const annotationsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(resource.document.id),
  queryFn: () => fetchReaderAnnotations(resource.document.id),
  enabled: hasSession && stateOwner !== "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const pronunciationOverridesQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPronunciationOverrides(resource.document.id),
  queryFn: () => fetchReaderPronunciationOverrides(resource.document.id),
  enabled: hasSession && stateOwner !== "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const pronunciationDictionary = useMemo(
  () =>
   resource.vocabulary.map((vocabulary, index) => ({
    id: vocabulary.id,
    text: vocabulary.word,
    pinyin: vocabulary.pinyin,
    priority: resource.vocabulary.length - index,
   })),
  [resource.vocabulary],
 );

 const analyses = useMemo(
  () =>
   paragraphs.map((paragraph) =>
    analyzeContextualPronunciation(
     {
      text: paragraph.zh,
      sourcePinyin: paragraph.pinyin || null,
      overrides: (stateOwner === "reader"
       ? readerStateQuery.data?.overrides
       : pronunciationOverridesQuery.data
      )
       ?.filter((override) => override.paragraph_id === paragraph.id)
       .map((override) => ({
        id: override.id,
        text: override.text,
        readings: override.readings,
        scope: override.scope,
        sentenceText: override.sentence_text,
        start: override.start_offset,
        end: override.end_offset,
        updatedAt: override.updated_at,
       })),
     },
     pronunciationDictionary,
    ),
   ),
  [
   paragraphs,
   pronunciationDictionary,
   pronunciationOverridesQuery.data,
   readerStateQuery.data?.overrides,
   stateOwner,
  ],
 );
 const activeIndex = Math.min(state.activeParagraphIndex, Math.max(0, paragraphs.length - 1));
 const activeParagraph = paragraphs[activeIndex];
 const activeAnalysis = analyses[activeIndex];
 const selectedParagraph = paragraphs.find((paragraph) => paragraph.id === selectedParagraphId);
 const selectedAnalysis =
  selectedParagraphId === null
   ? activeAnalysis
   : analyses[paragraphs.findIndex((paragraph) => paragraph.id === selectedParagraphId)];
 const selectedVocabulary = resource.vocabulary.find(
  (vocabulary) => vocabulary.word === selectedText,
 );
 const selectedPinyin =
  selectedAnalysis !== undefined && selectedRange !== null
   ? formatContextualPinyinRange(selectedAnalysis, selectedRange.start, selectedRange.end)
   : "";
 const selectionAnchor = useCallback(
  () =>
   selectionRect
    ? {
       getBoundingClientRect: () => selectionRect,
       contextElement: document.body,
      }
    : null,
  [selectionRect],
 );
 const activeAnnotations = (
  stateOwner === "reader"
   ? (readerStateQuery.data?.annotations ?? [])
   : (annotationsQuery.data ?? [])
 ).filter((annotation) => annotation.paragraph_id === activeParagraph?.id);
 const translationSegments = useMemo(
  () =>
   paragraphs
    .filter((paragraph) => paragraph.zh.trim().length > 0 && paragraph.vi.trim().length > 0)
    .map((paragraph, index) => ({
     id: paragraph.id,
     order: index + 1,
     zh: paragraph.zh,
     pinyin: paragraph.pinyin,
     vi: paragraph.vi,
    })),
  [paragraphs],
 );
 const translationSegment =
  translationSegments.find((segment) => segment.id === activeParagraph?.id) ??
  translationSegments[0];
 const translationKey = translationSegment
  ? `${translationSegment.id}:${translationDirection}`
  : "";
 const translationDraft = translationKey ? (translationDrafts[translationKey] ?? "") : "";
 const translationIsChecked = translationKey ? translationChecked[translationKey] === true : false;
 const translationScore =
  translationSegment && translationIsChecked
   ? scoreTranslationAttempt(translationSegment, translationDirection, translationDraft)
   : null;
 const selectedOverride =
  selectedGlyph === null || activeParagraph === undefined
   ? undefined
   : (stateOwner === "reader"
      ? (readerStateQuery.data?.overrides ?? [])
      : (pronunciationOverridesQuery.data ?? [])
     ).find(
      (override) =>
       override.paragraph_id === activeParagraph.id &&
       override.scope === "sentence-instance" &&
       override.start_offset === selectedGlyph.start &&
       override.end_offset === selectedGlyph.end,
     );
 const isActiveSpeech =
  activeParagraph !== undefined &&
  speechParagraphId === activeParagraph.id &&
  tts.speakingText === speechText &&
  (tts.isSpeaking || tts.isPaused);
 const activeCharacterIndex =
  isActiveSpeech && activeParagraph !== undefined
   ? getActiveCharacterIndex(
      Array.from(activeParagraph.zh).length,
      speechStartIndex,
      Array.from(activeParagraph.zh).length - speechStartIndex,
      tts.progress,
     )
   : -1;
 const displayMode = useMemo<LessonDisplayMode>(
  () => ({
   ...DEFAULT_LESSON_DISPLAY_MODE,
   hanziSize: "2xl",
   showPinyin: pinyinMode !== "off",
   showMeaning: state.showMeaning,
  }),
  [pinyinMode, state.showMeaning],
 );
 const remoteRevision =
  stateOwner === "reader"
   ? (readerStateQuery.data?.progress?.revision ?? 0)
   : stateOwner === "daily"
     ? (dailyStateQuery.data?.revision ?? 0)
     : (personalStateQuery.data?.revision ?? 0);

 const readerRemoteFeatureState = useMemo(() => {
  const progress = readerStateQuery.data?.progress;
  return progress === null || progress === undefined
   ? readerFeatureStateFromSession(defaultReaderDocumentState)
   : {
      showPinyin: progress.show_pinyin,
      showMeaning: progress.show_meaning,
      completed: progress.completed,
      summaryText: progress.summary_text,
      answers: progress.answers,
     };
 }, [readerStateQuery.data]);

 const recoverReaderProgressConflict = useCallback(async () => {
  const refreshed = await readerStateRefetchRef.current();
  return refreshed.data?.progress?.revision ?? null;
 }, []);

 const readerAutosaveOnSaved = useCallback((snapshot: ReaderFeatureState) => {
  const latest = readerAutosaveLatestRef.current;
  if (latest !== null && readerFeatureStateEqual(latest.snapshot, snapshot)) {
   persistedStateChangeVersionRef.current = Math.max(
    persistedStateChangeVersionRef.current,
    latest.changeVersion,
   );
   readerPersistedSnapshotRef.current = snapshot;
   readerAutosaveLatestRef.current = null;
  }
  setSaveError("");
 }, []);

 const readerAutosaveOnError = useCallback((error: Error) => {
  setSaveError(error.message);
 }, []);

 useEffect(() => {
  stateChangeVersionRef.current = 0;
  persistedStateChangeVersionRef.current = 0;
  readerPersistedSnapshotRef.current = null;
  readerAutosaveLatestRef.current = null;
 }, [resource.document.id, stateOwner]);

 useEffect(() => {
  if (stateOwner !== "reader") return;
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save: (snapshot, expectedRevision, signal) =>
    saveReaderProgress(
     {
      documentId: resource.document.id,
      ...snapshot,
      expectedRevision,
     },
     { signal },
    ),
   recoverConflict: recoverReaderProgressConflict,
   isConflict: (error) => error instanceof ReaderProgressConflictError,
   onSaved: readerAutosaveOnSaved,
   onError: readerAutosaveOnError,
  });
  readerAutosaveControllerRef.current = controller;
  return () => {
   controller.dispose();
   if (readerAutosaveControllerRef.current === controller) {
    readerAutosaveControllerRef.current = null;
   }
  };
 }, [
  readerAutosaveOnError,
  readerAutosaveOnSaved,
  recoverReaderProgressConflict,
  resource.document.id,
  stateOwner,
 ]);

 useEffect(() => {
  if (!stateQueryPending) revisionRef.current = remoteRevision;
 }, [remoteRevision, stateQueryPending]);

 useEffect(() => {
  if (stateOwner !== "reader") return;
  readerAutosaveControllerRef.current?.updateRevision(remoteRevision);
 }, [remoteRevision, stateOwner]);

 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || stateQueryPending || stateQueryError) return;
  const controller = readerAutosaveControllerRef.current;
  if (controller === null) return;
  if (readerPersistedSnapshotRef.current === null) {
   readerPersistedSnapshotRef.current = readerRemoteFeatureState;
  }
  controller.setPersistedSnapshot(readerPersistedSnapshotRef.current);
 }, [hasSession, readerRemoteFeatureState, stateOwner, stateQueryError, stateQueryPending]);

 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || stateQueryPending || stateQueryError) return;
  const controller = readerAutosaveControllerRef.current;
  if (controller === null) return;
  const changeVersion = stateChangeVersionRef.current;
  if (!hasPendingReaderStateChange(changeVersion, persistedStateChangeVersionRef.current)) return;

  const latest = readerAutosaveLatestRef.current;
  if (latest !== null && readerFeatureStateEqual(latest.snapshot, featureState)) {
   readerAutosaveLatestRef.current = { snapshot: latest.snapshot, changeVersion };
   return;
  }
  readerAutosaveLatestRef.current = { snapshot: featureState, changeVersion };
  controller.schedule(featureState);
  if (
   readerPersistedSnapshotRef.current !== null &&
   readerFeatureStateEqual(featureState, readerPersistedSnapshotRef.current)
  ) {
   persistedStateChangeVersionRef.current = Math.max(
    persistedStateChangeVersionRef.current,
    changeVersion,
   );
  }
 }, [featureState, hasSession, stateOwner, stateQueryError, stateQueryPending]);

 useEffect(() => {
  if (stateOwner === "reader" || !hasSession || stateQueryPending || stateQueryError) return;
  const changeVersion = stateChangeVersionRef.current;
  if (!hasPendingReaderStateChange(changeVersion, persistedStateChangeVersionRef.current)) return;
  const snapshot = state;
  const featureState = readerFeatureStateSchema.parse({
   showPinyin: snapshot.showPinyin,
   showMeaning: snapshot.showMeaning,
   completed: snapshot.completed,
   summaryText: snapshot.summaryText,
   answers: snapshot.answers,
  });
  saveQueueRef.current = saveQueueRef.current
   .catch(() => undefined)
   .then(async () => {
    if (changeVersion !== stateChangeVersionRef.current) return;
    try {
     const saved =
      stateOwner === "daily" && dailyPublishedDate !== null
       ? await saveDailyReadingState({
          publishedDate: dailyPublishedDate,
          state: featureState,
          expectedRevision: revisionRef.current,
         })
       : stateOwner === "personal" && personalNodeId !== null
         ? await savePersonalLearningState({
            nodeId: personalNodeId,
            state: featureState,
            expectedRevision: revisionRef.current,
           })
         : null;
     revisionRef.current = saved?.revision ?? revisionRef.current;
     persistedStateChangeVersionRef.current = Math.max(
      persistedStateChangeVersionRef.current,
      changeVersion,
     );
     setSaveError("");
    } catch (error) {
     setSaveError(error instanceof Error ? error.message : "Không lưu được tiến độ Reader.");
    }
   });
 }, [
  dailyPublishedDate,
  personalNodeId,
  resource.document.id,
  hasSession,
  state,
  stateOwner,
  stateQueryError,
  stateQueryPending,
 ]);

 useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
   const target = event.target;
   if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.isComposing ||
    (target instanceof HTMLElement &&
     target.closest(
      "a, button, input, textarea, select, [contenteditable='true'], [role='button'], [role='combobox'], [role='menuitem'], [role='option'], [role='tab']",
     ))
   )
    return;
   if (event.key === "ArrowLeft") {
    event.preventDefault();
    setState((current) => moveReaderParagraph(current, activeIndex - 1, paragraphs.length));
   }
   if (event.key === "ArrowRight") {
    event.preventDefault();
    setState((current) => moveReaderParagraph(current, activeIndex + 1, paragraphs.length));
   }
   if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    setState((current) => ({ ...current, showPinyin: !current.showPinyin }));
   }
   if (event.key.toLowerCase() === "m") {
    event.preventDefault();
    setState((current) => ({ ...current, showMeaning: !current.showMeaning }));
   }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
 }, [activeIndex, paragraphs.length, setState]);

 if (activeParagraph === undefined || activeAnalysis === undefined) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography as="p" variant="bodySmall" tone="danger">
     Tài liệu Reader chưa có đoạn đọc hợp lệ.
    </Typography>
   </Card>
  );
 }

 const playParagraphAt = (startIndex: number, startCharacterIndex = 0) => {
  playbackRunRef.current += 1;
  const runId = playbackRunRef.current;
  const playParagraph = (paragraphIndex: number, characterIndex: number): void => {
   const paragraph = paragraphs[paragraphIndex];
   if (paragraph === undefined || playbackRunRef.current !== runId) return;
   const characters = Array.from(paragraph.zh);
   const boundedCharacterIndex = Math.min(characters.length, Math.max(0, characterIndex));
   const textFromCharacter = characters.slice(boundedCharacterIndex).join("");
   if (!textFromCharacter.trim()) return;
   setSpeechText(textFromCharacter.trim());
   setSpeechStartIndex(boundedCharacterIndex);
   setSpeechParagraphId(paragraph.id);
   tts.speakSequence([textFromCharacter], () => {
    if (playbackRunRef.current !== runId) return;
    const current = playbackStateRef.current;
    if (current.loopCurrent) {
     playParagraph(paragraphIndex, boundedCharacterIndex);
     return;
    }
    if (current.autoAdvance && paragraphIndex < paragraphs.length - 1) {
     const nextIndex = paragraphIndex + 1;
     setState((next) => moveReaderParagraph(next, nextIndex, paragraphs.length));
     playParagraph(nextIndex, 0);
     return;
    }
    setState((next) => resolveReaderPlaybackEnd(next, paragraphs.length));
   });
  };
  playParagraph(startIndex, startCharacterIndex);
 };

 const playCurrent = () => playParagraphAt(activeIndex);
 const playContinuous = () => {
  setState((current) => ({ ...current, autoAdvance: true, loopCurrent: false }));
  playParagraphAt(activeIndex);
 };

 const clearSelection = () => {
  setSelectedGlyph(null);
  setSelectedText("");
  setSelectedRange(null);
  setSelectedParagraphId(null);
  setSelectionRect(null);
  setSelectionMode("quick");
  window.getSelection()?.removeAllRanges();
 };

 const move = (nextIndex: number) => {
  playbackRunRef.current += 1;
  tts.stop();
  clearSelection();
  setState((current) => moveReaderParagraph(current, nextIndex, paragraphs.length));
 };

 const saveAnnotation = (annotationType: "highlight" | "note") => {
  if (!selectedText || !selectedRange) return;
  const paragraph = selectedParagraph ?? activeParagraph;
  void createReaderAnnotation({
   documentId: resource.document.id,
   paragraphId: paragraph.id,
   assetId: null,
   annotationType,
   pageNumber: null,
   startOffset: selectedRange.start,
   endOffset: selectedRange.end,
   selectedText,
   noteText: annotationType === "note" ? noteDraft : "",
   color: annotationType === "note" ? "yellow" : "green",
   payload: {},
  })
   .then(() => {
    setNoteDraft("");
    clearSelection();
    if (annotationType === "highlight") {
     const now = new Date().toISOString();
     void upsertLearningLoopItem({
      id: `reader-bookmark:${resource.document.id}:${paragraph.id}:${selectedRange.start}`,
      stable_key: `reader-bookmark:${resource.document.id}:${paragraph.id}:${selectedRange.start}`,
      kind: "reading_bookmark",
      source_id: resource.document.id,
      source_href: `/reader?document=${encodeURIComponent(resource.document.id)}`,
      title_zh: resource.document.title_zh,
      title_vi: resource.document.title_vi,
      prompt_zh: selectedText,
      pinyin: "",
      meaning_vi: "",
      user_answer: "",
      error_key: "",
      state: "new",
      due_at: now,
      interval_days: 0,
      correct_streak: 0,
      lapse_count: 0,
      revision: 0,
     }).catch((error: Error) => setSaveError(error.message));
    }
    return queryClient.invalidateQueries({
     queryKey:
      stateOwner === "reader"
       ? hanzihomeQueryKeys.readerState(resource.document.id)
       : hanzihomeQueryKeys.readerAnnotations(resource.document.id),
    });
   })
   .catch((error: Error) => setSaveError(error.message));
 };

 const removeAnnotation = (annotationId: string, revision: number) => {
  void deleteReaderAnnotation(annotationId, revision)
   .then(() =>
    queryClient.invalidateQueries({
     queryKey:
      stateOwner === "reader"
       ? hanzihomeQueryKeys.readerState(resource.document.id)
       : hanzihomeQueryKeys.readerAnnotations(resource.document.id),
    }),
   )
   .catch((error: Error) => setSaveError(error.message));
 };

 const addSelectionToReview = () => {
  if (!selectedText || !selectedRange) return;
  const paragraph = selectedParagraph ?? activeParagraph;
  const now = new Date().toISOString();
  void upsertLearningLoopItem({
   id: `reader-selection:${resource.document.id}:${paragraph.id}:${selectedRange.start}`,
   stable_key: `reader-selection:${resource.document.id}:${paragraph.id}:${selectedRange.start}`,
   kind: selectedVocabulary === undefined ? "reading_bookmark" : "vocabulary",
   source_id: resource.document.id,
   source_href: `/reader?document=${encodeURIComponent(resource.document.id)}`,
   title_zh: resource.document.title_zh,
   title_vi: resource.document.title_vi,
   prompt_zh: selectedText,
   pinyin: selectedVocabulary?.pinyin || selectedPinyin,
   meaning_vi: selectedVocabulary?.meaning || "",
   user_answer: "",
   error_key: "",
   state: "new",
   due_at: now,
   interval_days: 0,
   correct_streak: 0,
   lapse_count: 0,
   revision: 0,
  })
   .then(() => setSaveError(""))
   .catch((error: Error) => setSaveError(error.message));
  clearSelection();
 };

 const savePronunciationOverride = (readingKey: string) => {
  if (selectedGlyph === null) return;
  void saveReaderPronunciationOverride({
   id: selectedOverride?.id ?? crypto.randomUUID(),
   documentId: resource.document.id,
   paragraphId: activeParagraph.id,
   text: selectedGlyph.text,
   readings: [readingKey],
   scope: "sentence-instance",
   sentenceText: activeParagraph.zh,
   startOffset: selectedGlyph.start,
   endOffset: selectedGlyph.end,
   expectedRevision: selectedOverride?.revision ?? 0,
  })
   .then(() => {
    setSaveError("");
    return queryClient.invalidateQueries({
     queryKey:
      stateOwner === "reader"
       ? hanzihomeQueryKeys.readerState(resource.document.id)
       : hanzihomeQueryKeys.readerPronunciationOverrides(resource.document.id),
    });
   })
   .catch((error: Error) => setSaveError(error.message));
 };

 const removePronunciationOverride = () => {
  if (selectedOverride === undefined) return;
  void deleteReaderPronunciationOverride({
   id: selectedOverride.id,
   expectedRevision: selectedOverride.revision,
  })
   .then(() => {
    setSaveError("");
    return queryClient.invalidateQueries({
     queryKey:
      stateOwner === "reader"
       ? hanzihomeQueryKeys.readerState(resource.document.id)
       : hanzihomeQueryKeys.readerPronunciationOverrides(resource.document.id),
    });
   })
   .catch((error: Error) => setSaveError(error.message));
 };

 const captureSelection = (
  index: number,
  paragraph: (typeof paragraphs)[number],
  analysis: (typeof analyses)[number],
 ) => {
  const selection = window.getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const container = selection.anchorNode?.parentElement?.closest<HTMLElement>(
   "[data-reader-selection-paragraph]",
  );
  if (
   container === null ||
   container === undefined ||
   container.dataset.readerSelectionParagraph !== paragraph.id
  )
   return;
  const startRange = document.createRange();
  startRange.selectNodeContents(container);
  startRange.setEnd(range.startContainer, range.startOffset);
  const endRange = document.createRange();
  endRange.selectNodeContents(container);
  endRange.setEnd(range.endContainer, range.endOffset);
  const start = Math.min(startRange.toString().length, endRange.toString().length);
  const end = Math.max(startRange.toString().length, endRange.toString().length);
  const text = paragraph.zh.slice(start, end);
  if (!text) return;
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;
  if (index !== activeIndex) move(index);
  setSelectedText(text);
  setSelectedRange({ start, end });
  setSelectedParagraphId(paragraph.id);
  setSelectionRect(rect);
  setSelectionMode("quick");
  setSelectedGlyph(
   analysis.glyphs.find((glyph) => glyph.start === start && glyph.end === end) ?? null,
  );
 };

 const saveExerciseAnswer = (itemId: string, answer: ReaderAnswerState) => {
  setState((current) => ({
   ...current,
   answers: { ...current.answers, [itemId]: answer },
  }));
  if (stateOwner !== "personal") return;
  void savePracticeAttempt({
   surface: "personal-learning",
   contentId: itemId,
   direction: null,
   answer: {
    answer: answer.answer,
    completed: answer.completed,
   },
   scorePercent: answer.score === null ? null : Math.round(answer.score * 100),
   responseMs: answer.responseMs,
  }).catch((error: Error) => setSaveError(error.message));
 };

 const checkTranslation = () => {
  if (translationSegment === undefined || !translationKey || !translationDraft.trim()) return;
  const startedAt = translationStartedAt[translationKey];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(
   translationSegment,
   translationDirection,
   translationDraft,
   responseMs,
  );
  setTranslationStartedAt((current) => {
   const next = { ...current };
   delete next[translationKey];
   return next;
  });
  setTranslationChecked((current) => ({ ...current, [translationKey]: true }));
  void savePracticeAttempt({
   surface: "translation",
   contentId: translationSegment.id,
   direction: translationDirection,
   answer: {
    answer: attempt.answer,
    reference: translationReferenceText(translationSegment, translationDirection),
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => setSaveError(error.message));
 };

 const updateTranslationDraft = (value: string) => {
  if (!translationKey) return;
  if (value.trim() && translationStartedAt[translationKey] === undefined) {
   setTranslationStartedAt((current) => ({ ...current, [translationKey]: Date.now() }));
  }
  setTranslationDrafts((current) => ({ ...current, [translationKey]: value }));
  setTranslationChecked((current) => ({ ...current, [translationKey]: false }));
 };

 const workspaceTabsEnabled = stateOwner === "reader";
 const showDocumentHeader = stateOwner === "reader";
 const isHskDocument = resource.document.kind === "hsk";
 const readerUnitNumber = resource.document.unit_id?.replace(/^U/u, "") ?? "";
 const readerLessonLabel =
  readMetadataString(resource.document.source_metadata, "reading_label_vi") ??
  (resource.document.reading_number === null
   ? "Bài đọc"
   : `Bài ${resource.document.reading_number}`);
 const showReaderTab = !workspaceTabsEnabled || workspaceTab === "reader";
 const showOverviewTab = !workspaceTabsEnabled || workspaceTab === "overview";
 const showExercisesTab = !workspaceTabsEnabled || workspaceTab === "exercises";
 const showVocabularyTab = !workspaceTabsEnabled || workspaceTab === "vocabulary";
 const showTranslationTab = !workspaceTabsEnabled || workspaceTab === "translation";
 const showDictationTab = !workspaceTabsEnabled || workspaceTab === "dictation";
 const showAnalysisTab = !workspaceTabsEnabled || workspaceTab === "analysis";
 const showSummaryTab = !workspaceTabsEnabled || workspaceTab === "summary";
 const showNotesTab = !workspaceTabsEnabled || workspaceTab === "notes";
 return (
  <div className={state.focusMode ? "mx-auto grid min-w-0 max-w-4xl gap-3" : "grid min-w-0 gap-3"}>
   <ReaderHeaderContextBridge
    backHref={backHref}
    backLabel={backLabel}
    navigationDocuments={navigationDocuments}
    selectedDocument={resource.document}
   />
   {!isHskDocument && showDocumentHeader ? (
    <div className="grid min-w-0 gap-3 border-b border-border-default pb-4 sm:pb-5">
     <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="grid min-w-0 gap-1">
       <div className="flex flex-wrap gap-2">
        <Badge variant="success" casing="natural">
         {readerLessonLabel}
        </Badge>
        {readerUnitNumber ? (
         <Badge variant="accent" casing="natural">
          Đơn nguyên {readerUnitNumber}
         </Badge>
        ) : null}
       </div>
       {resource.document.kind !== "core" ? (
        <Badge variant="purple" className="justify-self-start">
         {resource.document.kind.toUpperCase()}
        </Badge>
       ) : null}
       <Typography
        as="h1"
        variant="sectionTitle"
        weight="black"
        clamp="two"
        className="text-2xl sm:text-3xl"
       >
        {resource.document.title_zh}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted">
        {resource.document.title_pinyin ? (
         <PinyinText as="span" variant="caption" tone="accent">
          {resource.document.title_pinyin}
         </PinyinText>
        ) : null}
        {resource.document.title_pinyin ? " · " : ""}
        {resource.document.title_vi || resource.document.genre_vi || "Bài đọc"}
       </Typography>
      </div>
      <div className="flex min-w-0 flex-wrap justify-end gap-2">
       {resource.document.genre_vi ? <Badge>{resource.document.genre_vi}</Badge> : null}
       <Badge>
        {readMetadataNumber(resource.document.source_metadata, "paragraphs") ?? paragraphs.length}{" "}
        đoạn
       </Badge>
       <Badge>
        {readMetadataNumber(resource.document.source_metadata, "vocabulary") ??
         resource.vocabulary.length}{" "}
        từ/cụm
       </Badge>
       <Badge>
        {readMetadataNumber(resource.document.source_metadata, "exercises") ??
         resource.exerciseItems.length}{" "}
        mục bài tập
       </Badge>
      </div>
     </div>
    </div>
   ) : null}

   {stateQueryPending ? (
    <Typography variant="caption" tone="muted">
     Đang tải tiến độ Reader; nội dung tĩnh vẫn sẵn sàng để đọc.
    </Typography>
   ) : null}
   {stateQueryError ? (
    <Card variant="subtle" padding="sm">
     <Typography variant="caption" tone="warning">
      Không tải được tiến độ Reader. Bạn vẫn có thể đọc; thay đổi mới sẽ được lưu khi kết nối được
      khôi phục.
     </Typography>
    </Card>
   ) : null}

   <Tabs
    value={workspaceTab}
    items={
     workspaceTabsEnabled && !isHskDocument
      ? [...readerWorkspaceTabs].map((tab) => ({
         key: tab.id,
         label: tab.label,
         icon: tab.icon,
        }))
      : []
    }
    onValueChange={setWorkspaceTab}
    aria-label="Các phần của bài Reader"
   >
    <TabsContent value={workspaceTab} className="pt-4 sm:pt-5">
     <div
      className={
       state.focusMode
        ? "grid min-w-0 content-start gap-3"
        : "grid min-w-0 content-start items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]"
      }
     >
      <div className="grid min-w-0 content-start gap-3">
       {showReaderTab ? (
        <Card
         variant="subtle"
         padding="sm"
         className="sticky top-3 z-10 flex min-w-0 flex-wrap items-center gap-2"
         role="region"
         aria-label="Điều khiển nghe bài đọc"
        >
         <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-1">
          <Typography variant="caption" tone="muted" weight="black">
           <span className="block">
            Đoạn {activeIndex + 1} / {paragraphs.length}
           </span>
           {isActiveSpeech ? (
            <span className="font-normal tabular-nums">
             {formatPlaybackTime(tts.currentTimeSeconds)} /{" "}
             {formatPlaybackTime(tts.durationSeconds)}
            </span>
           ) : null}
          </Typography>
          {isActiveSpeech ? (
           <Typography variant="caption" tone="accent" weight="black" aria-live="polite">
            {tts.isPaused ? "Đã tạm dừng" : "Đang đọc"} · {Math.round(tts.progress * 100)}%
           </Typography>
          ) : null}
         </div>
         {isActiveSpeech ? (
          <div
           className="h-1 overflow-hidden rounded-full bg-bg-subtle"
           role="progressbar"
           aria-label="Tiến độ đọc"
           aria-valuemin={0}
           aria-valuemax={100}
           aria-valuenow={Math.round(tts.progress * 100)}
          >
           <div
            className="h-full rounded-full bg-accent transition-[width] duration-150"
            style={{ width: `${Math.round(tts.progress * 100)}%` }}
           />
          </div>
         ) : null}
         <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <Button
           type="button"
           size="icon-sm"
           variant="outline"
           aria-label="Đoạn trước"
           disabled={activeIndex === 0}
           onClick={() => move(activeIndex - 1)}
          >
           <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
           type="button"
           size="sm"
           disabled={tts.isLoading}
           onClick={() => {
            if (tts.isPaused) tts.resume();
            else playContinuous();
           }}
          >
           {tts.isPaused ? "Tiếp tục" : tts.isSpeaking ? "Đang đọc" : "Nghe bài"}
          </Button>
          <Button
           type="button"
           size="icon-sm"
           variant="outline"
           aria-label="Nghe lại đoạn"
           onClick={playCurrent}
          >
           <RotateCcw aria-hidden="true" />
          </Button>
          <Button
           type="button"
           size="icon-sm"
           variant="outline"
           aria-label="Dừng đoạn"
           disabled={!tts.isSpeaking && !tts.isPaused && !tts.isLoading}
           onClick={() => {
            playbackRunRef.current += 1;
            tts.stop();
           }}
          >
           <Square aria-hidden="true" />
          </Button>
          <Button
           type="button"
           size="icon-sm"
           variant="outline"
           aria-label="Đoạn sau"
           disabled={activeIndex >= paragraphs.length - 1}
           onClick={() => move(activeIndex + 1)}
          >
           <ChevronRight aria-hidden="true" />
          </Button>
         </div>
         <div
          className="flex min-w-0 flex-wrap items-center justify-end gap-2"
          role="group"
          aria-label="Công cụ và giọng Reader"
         >
          <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline">
             <Volume2 data-icon="inline-start" />
             Giọng và tốc độ
             <Typography as="span" variant="caption" tone="muted">
              {tts.rate.toFixed(2)}×
             </Typography>
            </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent width="md">
            <DropdownMenuLabel>Giọng và tốc độ</DropdownMenuLabel>
            {tts.voices.length > 0 ? (
             <div className="px-2.5 py-1.5">
              <Select value={tts.selectedVoiceName} onValueChange={tts.setSelectedVoiceName}>
               <SelectTrigger size="sm" aria-label="Chọn giọng Reader" className="w-full">
                <SelectValue placeholder="Chọn giọng Mandarin" />
               </SelectTrigger>
               <SelectContent>
                <SelectGroup>
                 {tts.voices.map((voice) => (
                  <SelectItem key={voice.shortName} value={voice.shortName}>
                   {voice.name} · {voice.gender}
                  </SelectItem>
                 ))}
                </SelectGroup>
               </SelectContent>
              </Select>
             </div>
            ) : null}
            <div className="px-2.5 py-1.5">
             <Select
              value={String(tts.rate)}
              onValueChange={(value) => {
               const nextRate = Number(value);
               if (readerRateOptions.includes(nextRate)) tts.setRate(nextRate);
              }}
             >
              <SelectTrigger size="sm" aria-label="Chọn tốc độ Reader" className="w-full">
               <SelectValue />
              </SelectTrigger>
              <SelectContent>
               <SelectGroup>
                {readerRateOptions.map((rate) => (
                 <SelectItem key={rate} value={String(rate)}>
                  {rate}×
                 </SelectItem>
                ))}
               </SelectGroup>
              </SelectContent>
             </Select>
            </div>
           </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline">
             <Settings2 data-icon="inline-start" />
             Công cụ học
            </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent width="md">
            <DropdownMenuLabel>Phát bài</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
             checked={state.loopCurrent}
             onCheckedChange={() => setState((current) => toggleReaderLoop(current))}
            >
             Lặp đoạn
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
             checked={state.autoAdvance}
             onCheckedChange={() => setState((current) => toggleReaderAutoAdvance(current))}
            >
             Tự chuyển
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Hiển thị và luyện tập</DropdownMenuLabel>
            <DropdownMenuSub>
             <DropdownMenuSubTrigger>
              <Languages data-icon="inline-start" />
              Chế độ pinyin
              <DropdownMenuShortcut>{readerPinyinModeLabels[pinyinMode]}</DropdownMenuShortcut>
             </DropdownMenuSubTrigger>
             <DropdownMenuSubContent width="md">
              <DropdownMenuLabel>Chế độ pinyin</DropdownMenuLabel>
              <DropdownMenuRadioGroup
               value={pinyinMode}
               onValueChange={(value) => {
                const parsed = readerPinyinModeSchema.safeParse(value);
                if (parsed.success) updatePinyinMode(parsed.data);
               }}
              >
               {readerPinyinModeSchema.options.map((mode) => (
                <DropdownMenuRadioItem
                 key={mode}
                 value={mode}
                 onSelect={(event) => event.preventDefault()}
                >
                 {readerPinyinModeLabels[mode]}
                </DropdownMenuRadioItem>
               ))}
              </DropdownMenuRadioGroup>
             </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
             checked={state.showMeaning}
             onCheckedChange={() =>
              setState((current) => ({ ...current, showMeaning: !current.showMeaning }))
             }
            >
             Nghĩa Việt
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
             checked={state.focusMode}
             onCheckedChange={() =>
              setState((current) => ({ ...current, focusMode: !current.focusMode }))
             }
            >
             Tập trung
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
             checked={state.shadowing}
             onCheckedChange={() =>
              setState((current) => ({ ...current, shadowing: !current.shadowing }))
             }
            >
             Shadowing
            </DropdownMenuCheckboxItem>
           </DropdownMenuContent>
          </DropdownMenu>
         </div>
        </Card>
       ) : null}

       {showOverviewTab && !state.focusMode ? (
        <div className="grid gap-4 lg:grid-cols-2">
         <Card variant="subtle" padding="lg" className="grid content-start gap-3">
          <Typography as="h2" variant="cardTitle" weight="black">
           Bài này là gì?
          </Typography>
          <Typography variant="bodySmall" weight="black">
           {resource.document.genre_vi || readerLessonLabel}
          </Typography>
          <Typography variant="bodySmall" tone="muted">
           {resource.document.analysis.mainIdeaVi ||
            "Đọc để nắm nội dung chính và cách triển khai của văn bản."}
          </Typography>
         </Card>
         <Card variant="subtle" padding="lg" className="grid content-start gap-3">
          <Typography as="h2" variant="cardTitle" weight="black">
           Mục tiêu bài học
          </Typography>
          {resource.document.objectives_vi.length > 0 ? (
           <ul className="grid gap-2 pl-5 text-sm text-foreground-muted">
            {resource.document.objectives_vi.map((objective) => (
             <li key={objective}>{objective}</li>
            ))}
           </ul>
          ) : (
           <Typography variant="bodySmall" tone="muted">
            Đọc hiểu nội dung, nhận diện từ vựng trọng tâm và diễn đạt lại ý chính.
           </Typography>
          )}
         </Card>
         <Card variant="subtle" padding="lg" className="grid content-start gap-3">
          <Typography as="h2" variant="cardTitle" weight="black">
           Trước khi đọc
          </Typography>
          <ol className="grid gap-2 pl-5 text-sm text-foreground-muted">
           <li>Đọc lướt tiêu đề và xác định chủ đề trước khi mở pinyin.</li>
           <li>Đánh dấu câu hoặc cụm chưa chắc thay vì tra ngay từng từ.</li>
           <li>Thử tóm tắt mỗi đoạn bằng một ý ngắn sau lần đọc đầu.</li>
          </ol>
         </Card>
         <Card variant="subtle" padding="lg" className="grid content-start gap-3">
          <Typography as="h2" variant="cardTitle" weight="black">
           Nhịp học gợi ý
          </Typography>
          <ol className="grid gap-2 pl-5 text-sm text-foreground-muted">
           <li>Đọc bài và nghe từng đoạn.</li>
           <li>Làm bài tập khi nội dung còn mới.</li>
           <li>Ôn từ vựng theo ngữ cảnh của bài.</li>
           <li>Luyện dịch để kiểm tra khả năng diễn đạt.</li>
           <li>Chép chính tả hoặc shadowing để củng cố nghe nói.</li>
          </ol>
         </Card>
        </div>
       ) : null}

       {stateOwner === "daily" ? (
        <Card variant="subtle" padding="md" className="grid gap-2">
         <Typography as="h3" variant="cardTitle" weight="black">
          Thông tin bài đọc
         </Typography>
         <div className="flex flex-wrap gap-2">
          {dailyPublishedDate ? <Badge>{dailyPublishedDate}</Badge> : null}
          {dailyTopic ? <Badge>{dailyTopic}</Badge> : null}
          {dailyLevel ? <Badge>{dailyLevel}</Badge> : null}
         </div>
         {dailyAdaptationNotice ? (
          <Typography as="p" variant="bodySmall" tone="muted">
           {dailyAdaptationNotice}
          </Typography>
         ) : null}
        </Card>
       ) : null}

       {stateOwner === "personal" ? (
        <Card variant="subtle" padding="md" className="grid gap-2">
         <Typography as="h3" variant="cardTitle" weight="black">
          Bản đồ học cá nhân
         </Typography>
         {personalEssentialQuestion ? (
          <Typography as="p" variant="bodySmall" weight="black">
           Câu hỏi trọng tâm: {personalEssentialQuestion}
          </Typography>
         ) : null}
         {personalKeyIdea ? (
          <Typography as="p" variant="bodySmall" tone="muted">
           Ý chính: {personalKeyIdea}
          </Typography>
         ) : null}
         {personalMasteryChecklist.length > 0 ? (
          <ul className="grid gap-1 pl-5 text-sm text-foreground-muted">
           {personalMasteryChecklist.map((item) => (
            <li key={item}>{item}</li>
           ))}
          </ul>
         ) : null}
         {personalSourceIds.length > 0 ? (
          <Typography as="p" variant="caption" tone="muted">
           Nguồn: {personalSourceIds.join(", ")}
          </Typography>
         ) : null}
        </Card>
       ) : null}

       {showReaderTab ? (
        <>
         <Card variant="section" padding="md">
          <article className="grid gap-4">
           <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography
             as="p"
             variant="caption"
             tone="muted"
             weight="black"
             tracking="medium"
             transform="uppercase"
            >
             Đoạn {activeParagraph.paragraph_order}
            </Typography>
            <Button
             type="button"
             size="icon-sm"
             variant="ghost"
             aria-label={`Nghe đoạn ${activeParagraph.paragraph_order}`}
             title="Nghe đoạn này"
             onClick={() => playParagraphAt(activeIndex)}
            >
             <Volume2 aria-hidden="true" />
            </Button>
           </div>
           <div
            data-no-inspector
            data-reader-selection-paragraph={activeParagraph.id}
            onMouseUp={() => captureSelection(activeIndex, activeParagraph, activeAnalysis)}
            onPointerUp={() => captureSelection(activeIndex, activeParagraph, activeAnalysis)}
            onTouchEnd={() => captureSelection(activeIndex, activeParagraph, activeAnalysis)}
           >
            <ContextualReaderText
             analysis={activeAnalysis}
             displayMode={displayMode}
             activeCharacterIndex={isActiveSpeech ? activeCharacterIndex : -1}
             showPinyin={pinyinMode === "contextual" || pinyinMode === "focus"}
             pinyinPresentation={
              pinyinMode === "contextual" || pinyinMode === "focus" ? "ruby" : "paragraph"
             }
             sourcePinyin={activeParagraph.pinyin}
             onGlyphClick={(start) => {
              const characterIndex = Array.from(
               activeAnalysis.normalizedText.slice(0, start),
              ).length;
              playParagraphAt(activeIndex, characterIndex);
             }}
            />
           </div>
           {pinyinMode === "full" ? (
            <div className="grid gap-1 border-l-2 border-border-strong pl-3">
             <Typography as="h3" variant="caption" tone="muted" weight="black">
              Pinyin
             </Typography>
             <PinyinText variant="bodySmall" tone="muted" wrapping="preWrap">
              {activeAnalysis.sourcePinyinStatus === "aligned" && activeParagraph.pinyin
               ? activeParagraph.pinyin
               : formatContextualSpokenPinyin(activeAnalysis)}
             </PinyinText>
            </div>
           ) : null}
           {state.showMeaning && activeParagraph.vi ? (
            <TranslationText variant="bodySmall" tone="muted" wrapping="preWrap">
             {activeParagraph.vi}
            </TranslationText>
           ) : null}
          </article>
         </Card>

         {state.shadowing ? (
          <ShadowingPracticePanel
           key={activeParagraph.id}
           paragraph={activeParagraph}
           activeIndex={activeIndex}
           total={paragraphs.length}
           onPrevious={() => move(activeIndex - 1)}
           onNext={() => move(activeIndex + 1)}
          />
         ) : null}
        </>
       ) : null}

       {showExercisesTab ? (
        <ReaderExercisePanel
         resource={resource}
         answers={state.answers}
         onAnswer={saveExerciseAnswer}
        />
       ) : null}

       {selectedText ? (
        <Popover.Root
         open
         modal={false}
         onOpenChange={(open) => {
          if (!open) clearSelection();
         }}
        >
         <Popover.Portal>
          <BasePopoverPositioner
           anchor={selectionAnchor}
           side="top"
           align="center"
           sideOffset={10}
           collisionPadding={8}
           positionMethod="fixed"
          >
           <BasePopoverPopup
            variant="lookup"
            data-no-inspector
            onMouseDown={(event) => event.preventDefault()}
           >
            <div className="grid gap-3 p-3">
             <div className="flex items-start justify-between gap-2">
              <div className="grid min-w-0 gap-0.5">
               <Typography as="strong" variant="cardTitle" lang="zh-CN" clamp="one">
                {selectedText}
               </Typography>
               <PinyinText variant="caption" tone="muted">
                {selectedPinyin || "Chưa xác định pinyin"}
               </PinyinText>
              </div>
              <Button
               type="button"
               size="icon-sm"
               variant="ghost"
               aria-label="Đóng thanh công cụ"
               onClick={clearSelection}
              >
               <X aria-hidden="true" />
              </Button>
             </div>
             {selectionMode === "quick" ? (
              <>
               <Typography variant="bodySmall" tone="muted">
                {selectedVocabulary?.meaning || "Chưa có nghĩa offline chính xác cho cụm này."}
               </Typography>
               <div
                className="grid grid-cols-3 gap-1"
                role="toolbar"
                aria-label="Thao tác đoạn chọn"
               >
                <Button
                 type="button"
                 size="sm"
                 variant="ghost"
                 onClick={() => {
                  openInspector(selectedText, { anchorRect: selectionRect ?? undefined });
                  clearSelection();
                 }}
                >
                 <Languages data-icon="inline-start" />
                 Tra từ
                </Button>
                <Button
                 type="button"
                 size="sm"
                 variant="ghost"
                 onClick={() => saveAnnotation("highlight")}
                >
                 <Highlighter data-icon="inline-start" />
                 Đánh dấu
                </Button>
                <Button
                 type="button"
                 size="sm"
                 variant="ghost"
                 onClick={() => setSelectionMode("note")}
                >
                 <StickyNote data-icon="inline-start" />
                 Ghi chú
                </Button>
               </div>
              </>
             ) : (
              <>
               {selectedGlyph !== null ? (
                <Card variant="subtle" padding="sm" className="grid gap-2">
                 <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography as="p" variant="caption" tone="muted" weight="black">
                   Cách đọc theo ngữ cảnh
                  </Typography>
                  <Badge
                   variant={
                    selectedGlyph.evidence.includes("manual-override") ? "success" : "purple"
                   }
                  >
                   {selectedGlyph.evidence.join(" · ")}
                  </Badge>
                 </div>
                 <div className="flex flex-wrap gap-2" aria-label="Chọn cách đọc pinyin">
                  {selectedGlyph.alternatives.map((readingKey) => (
                   <Button
                    key={readingKey}
                    type="button"
                    size="sm"
                    variant={selectedGlyph.lexicalReadingKey === readingKey ? "active" : "outline"}
                    onClick={() => savePronunciationOverride(readingKey)}
                   >
                    {formatContextualReading(readingKey)}
                   </Button>
                  ))}
                 </div>
                 {selectedOverride !== undefined ? (
                  <Button
                   type="button"
                   size="sm"
                   variant="ghost"
                   onClick={removePronunciationOverride}
                  >
                   Bỏ cách đọc tuỳ chỉnh
                  </Button>
                 ) : null}
                </Card>
               ) : null}
               <Textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Ghi chú cho đoạn chọn…"
                aria-label="Ghi chú cho đoạn chọn"
                rows={2}
               />
               <div className="flex justify-end gap-2">
                <Button
                 type="button"
                 size="sm"
                 variant="ghost"
                 onClick={() => setSelectionMode("quick")}
                >
                 Huỷ
                </Button>
                <Button
                 type="button"
                 size="sm"
                 disabled={!noteDraft.trim()}
                 onClick={() => saveAnnotation("note")}
                >
                 Lưu ghi chú
                </Button>
               </div>
              </>
             )}
             <div className="flex flex-wrap gap-1 border-t border-border-default pt-2">
              <Button
               type="button"
               size="sm"
               variant="ghost"
               onClick={() => {
                if (tts.isSpeaking) tts.stop();
                else tts.speakSequence([selectedText]);
               }}
              >
               <Volume2 data-icon="inline-start" />
               Nghe
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={addSelectionToReview}>
               <BookmarkPlus data-icon="inline-start" />
               Ôn lại
              </Button>
              <Button
               type="button"
               size="sm"
               variant="ghost"
               onClick={() => {
                openInspector(selectedText, { anchorRect: selectionRect ?? undefined });
                clearSelection();
               }}
              >
               <Info data-icon="inline-start" />
               Hiểu sâu
              </Button>
             </div>
            </div>
           </BasePopoverPopup>
          </BasePopoverPositioner>
         </Popover.Portal>
        </Popover.Root>
       ) : null}

       {showNotesTab && activeAnnotations.length > 0 ? (
        <Card variant="subtle" padding="md" className="grid gap-2">
         <Typography as="h2" variant="cardTitle" weight="black">
          Ghi chú của đoạn này
         </Typography>
         {activeAnnotations.map((annotation) => (
          <Card
           key={annotation.id}
           variant="default"
           padding="sm"
           className="flex min-w-0 items-start justify-between gap-2"
          >
           <div className="grid min-w-0 gap-1">
            <Typography as="p" variant="bodySmall" lang="zh-CN">
             {annotation.selected_text || "Đoạn đánh dấu"}
            </Typography>
            {annotation.note_text ? (
             <Typography as="p" variant="caption" tone="muted">
              {annotation.note_text}
             </Typography>
            ) : null}
           </div>
           <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => removeAnnotation(annotation.id, annotation.revision)}
           >
            Xoá
           </Button>
          </Card>
         ))}
        </Card>
       ) : null}

       {showVocabularyTab ? <ReaderVocabularyPanel vocabulary={resource.vocabulary} /> : null}

       {showTranslationTab ? (
        <ReaderTranslationPracticePanel
         activeIndex={activeIndex}
         checked={translationIsChecked}
         completedCount={
          translationSegments.filter(
           (candidate) => translationChecked[`${candidate.id}:${translationDirection}`] === true,
          ).length
         }
         direction={translationDirection}
         displayMode={displayMode}
         draft={translationDraft}
         score={translationScore}
         segment={translationSegment}
         segments={translationSegments}
         onCheck={checkTranslation}
         onDirectionChange={setTranslationDirection}
         onDraftChange={updateTranslationDraft}
         onNext={() => move(activeIndex + 1)}
         onPrevious={() => move(activeIndex - 1)}
         onSelect={(segmentId) => {
          const paragraphIndex = paragraphs.findIndex((paragraph) => paragraph.id === segmentId);
          if (paragraphIndex >= 0) move(paragraphIndex);
         }}
        />
       ) : null}

       {showDictationTab ? (
        <Card variant="section" padding="md" className="grid gap-3">
         <Badge variant="purple" className="justify-self-start">
          Luyện nghe chép
         </Badge>
         <Typography as="h3" variant="sectionTitle" weight="black">
          Nghe và chép lại bài đọc
         </Typography>
         <Typography variant="bodySmall" tone="muted">
          Mở workspace Dictation với toàn bộ đoạn đọc hiện tại và giữ nguyên flow chọn chế độ của
          Studio.
         </Typography>
         <div className="flex flex-wrap gap-2">
          <Button type="button" asChild>
           <Link
            href={`/dictation?documentId=${encodeURIComponent(resource.document.id)}`}
            prefetch={false}
           >
            Mở chép chính tả →
           </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
           <Link
            href={`/tts?text=${encodeURIComponent(paragraphs.map((paragraph) => paragraph.zh).join("\n"))}`}
            prefetch={false}
           >
            Mở tạo giọng đọc
           </Link>
          </Button>
         </div>
        </Card>
       ) : null}

       {showAnalysisTab ? (
        <Card variant="section" padding="md" className="grid gap-3">
         <Typography as="h3" variant="sectionTitle" weight="black">
          Phân tích bài đọc
         </Typography>
         <Typography variant="bodySmall" tone="muted">
          {resource.document.analysis.mainIdeaVi || "Chưa có mô tả phân tích chính."}
         </Typography>
         {resource.document.analysis.paragraphStructureVi.length > 0 ? (
          <ul className="grid gap-1 pl-5 text-sm text-foreground-muted">
           {resource.document.analysis.paragraphStructureVi.map((item) => (
            <li key={item}>{item}</li>
           ))}
          </ul>
         ) : null}
         {resource.document.analysis.logicChainVi.length > 0 ? (
          <Typography variant="bodySmall" tone="muted" wrapping="preWrap">
           {resource.document.analysis.logicChainVi.join("\n")}
          </Typography>
         ) : null}
         <div className="grid gap-2 border-t border-border-default pt-3">
          <Typography as="strong" variant="caption" tone="accent">
           Pinyin theo ngữ cảnh
          </Typography>
          {analyses.map((analysis, index) => (
           <div key={paragraphs[index]?.id ?? index} className="flex flex-wrap items-center gap-2">
            <Typography as="span" variant="caption" tone="muted">
             Đoạn {index + 1}
            </Typography>
            <Badge variant={analysis.sourcePinyinStatus === "rejected" ? "warning" : "purple"}>
             {analysis.sourcePinyinStatus === "aligned"
              ? "Pinyin nguồn đã căn"
              : analysis.sourcePinyinStatus === "rejected"
                ? "Pinyin nguồn bị từ chối"
                : "Pinyin sinh theo ngữ cảnh"}
            </Badge>
            {analysis.unresolved.length > 0 ? (
             <Typography as="span" variant="caption" tone="danger">
              Chưa nhận diện: {analysis.unresolved.map((item) => item.text).join(" ")}
             </Typography>
            ) : null}
           </div>
          ))}
         </div>
        </Card>
       ) : null}

       {showSummaryTab ? (
        <Card variant="section" padding="md" className="grid gap-3">
         <Typography as="h3" variant="sectionTitle" weight="black">
          Tóm tắt
         </Typography>
         {resource.document.summary.modelZh ? (
          <Typography variant="body" lang="zh-CN" wrapping="preWrap">
           {resource.document.summary.modelZh}
          </Typography>
         ) : null}
         {resource.document.summary.rubricVi.length > 0 ? (
          <ul className="grid gap-1 pl-5 text-sm text-foreground-muted">
           {resource.document.summary.rubricVi.map((criterion) => (
            <li key={criterion}>{criterion}</li>
           ))}
          </ul>
         ) : null}
         {!resource.document.summary.modelZh && resource.document.summary.rubricVi.length === 0 ? (
          <Typography variant="bodySmall" tone="muted">
           Bài này chưa có summary được review.
          </Typography>
         ) : null}
        </Card>
       ) : null}

       {saveError ? (
        <Typography as="p" variant="caption" tone="danger">
         {saveError}
        </Typography>
       ) : null}
      </div>
      {!state.focusMode ? (
       <aside className="grid content-start gap-3 xl:sticky xl:top-3 xl:self-start">
        <Card variant="section" padding="md" className="grid gap-3">
         <Typography
          as="h2"
          variant="caption"
          tone="muted"
          weight="black"
          tracking="medium"
          transform="uppercase"
         >
          Mục lục đoạn
         </Typography>
         <nav aria-label="Chọn đoạn để nghe" className="grid gap-1">
          {paragraphs.map((paragraph, index) => (
           <Button
            key={paragraph.id}
            type="button"
            variant={index === activeIndex ? "active" : "ghost"}
            align="start"
            className="justify-start gap-2"
            onClick={() => move(index)}
           >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-xs font-bold">
             {index + 1}
            </span>
            <Typography as="span" variant="caption" tone="muted">
             Đoạn {paragraph.paragraph_order}
            </Typography>
           </Button>
          ))}
         </nav>
        </Card>
        <Card variant="section" padding="md" className="grid gap-2">
         <Typography
          as="h2"
          variant="caption"
          tone="muted"
          weight="black"
          tracking="medium"
          transform="uppercase"
         >
          Thông tin bài
         </Typography>
         <dl className="grid gap-2 text-sm">
          <div>
           <dt className="text-text-muted">Thể loại</dt>
           <dd>{resource.document.genre_vi || "Reader"}</dd>
          </div>
          <div>
           <dt className="text-text-muted">Số đoạn</dt>
           <dd>{paragraphs.length}</dd>
          </div>
          <div>
           <dt className="text-text-muted">Từ vựng</dt>
           <dd>{resource.vocabulary.length}</dd>
          </div>
          <div>
           <dt className="text-text-muted">Bài tập</dt>
           <dd>{resource.exerciseItems.length}</dd>
          </div>
          {resource.document.unit_id ? (
           <div>
            <dt className="text-text-muted">Đơn nguyên</dt>
            <dd>{resource.document.unit_id.replace(/^U/u, "")}</dd>
           </div>
          ) : null}
         </dl>
        </Card>
       </aside>
      ) : null}
     </div>
    </TabsContent>
   </Tabs>
  </div>
 );
}
