"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { pinyin as getPinyin } from "pinyin-pro";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { useHanziHomeListeningLesson } from "@/features/hanzihome/listening/useHanziHomeListeningLesson";
import { useListeningHotkeys } from "@/features/hanzihome/listening/useListeningHotkeys";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import type { DictationAttempt } from "@/features/hanzihome/practice/dictation-session";
import { StudioDictationPracticePanel } from "@/features/hanzihome/practice/StudioDictationPracticePanel";
import type { StudioDictationScriptMode } from "@/features/hanzihome/practice/StudioDictationSettingsMenu";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
 type ListeningTranscriptEntry,
} from "@/features/hanzihome/listening/listening.view-model";
import { ttsLibraryResponseSchema } from "@/features/hanzihome/tts/tts-studio.schemas";
import type { ReaderDocumentResource } from "@/features/hanzihome/reader/reader-content-api";
import type { ReaderDocumentRow } from "@/features/hanzihome/reader/reader.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const READER_DICTATION_BOOK_ID = "hanzihome-reader-course";
type DictationSource = "lesson" | "library" | "custom" | "reader";

function dictationEntryText(entry: ListeningTranscriptEntry) {
 const spokenLines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return spokenLines.length > 0 ? spokenLines.join("\n") : entry.transcript.full.zh;
}

function dictationLessonLabel(lesson: HanziHomeLesson) {
 const textMatch = lesson.id.match(/-text-(\d+)$/u);
 if (textMatch !== null) {
  return `第${lesson.lessonNumber}课 · 课文 ${textMatch[1]} · ${lesson.titleZh}`;
 }
 return `第${lesson.lessonNumber}课 · ${lesson.titleZh}`;
}

function externalDictationEntry(
 id: string,
 text: string,
 title: string,
 pinyin = getPinyin(text, { toneType: "symbol" }),
): ListeningTranscriptEntry {
 return {
  id,
  title,
  transcript: {
   mode: "monologue",
   speakers: [{ id: "learner-source", labelZh: "练习", labelVi: "Bài luyện", voice: "neutral" }],
   lines: [{ order: 1, speakerId: "learner-source", zh: text, pinyin }],
   full: { zh: text, pinyin },
  },
 };
}

export function StudioDictationWorkspace({
 initialReaderDocuments,
 initialReaderResource,
 initialReaderCourseResource,
 initialDictationLessons,
}: {
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialReaderResource: ReaderDocumentResource | null;
 initialReaderCourseResource: ReaderDocumentResource | null;
 initialDictationLessons: ReadonlyArray<HanziHomeLesson>;
}) {
 const tts = useSharedMandarinTts();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const requestedDocumentId = searchParams.get("documentId") ?? "";
 const requestedReaderDocumentId = searchParams.get("readerDocumentId") ?? "";
 const [selectedLessonIdState, setSelectedLessonId] = useState("");
 const [selectedBookIdState, setSelectedBookId] = useState("");
 const [selectedVolumeIdState, setSelectedVolumeId] = useState("");
 const [selectedSectionId, setSelectedSectionId] = useState("");
 const [selectedReaderDocumentIdState, setSelectedReaderDocumentId] = useState("");
 const [sourceType, setSourceType] = useState<DictationSource>(
  requestedDocumentId.length > 0 ? "reader" : "lesson",
 );
 const [selectedClipId, setSelectedClipId] = useState("");
 const [customText, setCustomText] = useState("");
 const [playbackMode, setPlaybackMode] = useState<"sentence" | "paragraph" | "passage">("sentence");
 const [modeConfirmed, setModeConfirmed] = useState(false);
 const [practiceStarted, setPracticeStarted] = useState(false);
 const [activeEntryId, setActiveEntryId] = useState("");
 const [checkedEntryIds, setCheckedEntryIds] = useState<Set<string>>(() => new Set());
 const [attemptSaveError, setAttemptSaveError] = useState("");
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [autoAdvance, setAutoAdvance] = useState(false);
 const [scriptMode, setScriptMode] = useState<StudioDictationScriptMode>("hidden");
 const loopCurrentRef = useRef(false);
 const autoAdvanceRef = useRef(false);
 const { loadVoices } = tts;
 useEffect(() => {
  void loadVoices();
 }, [loadVoices]);
 const ttsLibraryQuery = useQuery({
  queryKey: ["hanzihome", "tts", "library"],
  queryFn: async () => {
   const response = await fetch("/api/hanzihome/tts/library", { cache: "no-store" });
   const payload = await response.json().catch(() => null);
   if (!response.ok) throw new Error("Không tải được thư viện giọng đọc.");
   return ttsLibraryResponseSchema.parse(payload);
  },
  enabled: sourceType === "library",
  staleTime: 30_000,
 });
 const bookOptions = useMemo(() => {
  const books = new Map<
   string,
   { id: string; title: string; volumes: Array<{ id: string; title: string }> }
  >();
  for (const lesson of initialDictationLessons) {
   if (!lesson.bookId || !lesson.bookTitle) continue;
   const id = lesson.bookId.replace(/-volume-\d+$/u, "");
   const current = books.get(id) ?? {
    id,
    title: lesson.bookTitle.replace(/（[上下]）$/u, ""),
    volumes: [],
   };
   if (!current.volumes.some((volume) => volume.id === lesson.bookId)) {
    current.volumes.push({ id: lesson.bookId, title: lesson.bookTitle });
   }
   books.set(id, current);
  }
  return [
   ...books.values(),
   { id: READER_DICTATION_BOOK_ID, title: "Bài đọc giáo trình", volumes: [] },
  ]
   .map((book) => {
    const hskLevel = book.id.match(/:book:hsk([3-6])$/u)?.[1];
    return {
     ...book,
     title: hskLevel === undefined ? book.title : `HSK ${hskLevel}`,
     volumes: book.volumes.sort((left, right) => left.title.localeCompare(right.title)),
    };
   })
   .sort((left, right) => {
    const leftLevel = Number.parseInt(left.id.match(/:book:hsk([3-6])$/u)?.[1] ?? "99", 10);
    const rightLevel = Number.parseInt(right.id.match(/:book:hsk([3-6])$/u)?.[1] ?? "99", 10);
    return leftLevel - rightLevel || left.title.localeCompare(right.title);
   });
 }, [initialDictationLessons]);
 const selectedBookId = selectedBookIdState || bookOptions[0]?.id || "";
 const selectedBook = bookOptions.find((book) => book.id === selectedBookId);
 const isReaderCoursePack = selectedBookId === READER_DICTATION_BOOK_ID;
 const selectedVolumeId = isReaderCoursePack
  ? ""
  : selectedVolumeIdState || selectedBook?.volumes[0]?.id || "";
 const visibleLessons = initialDictationLessons.filter(
  (lesson) => lesson.bookId === selectedVolumeId,
 );
 const selectedLessonId = visibleLessons.some((lesson) => lesson.id === selectedLessonIdState)
  ? selectedLessonIdState
  : (visibleLessons[0]?.id ?? "");
 const selectedReaderDocumentId = initialReaderDocuments.some(
  (document) => document.id === selectedReaderDocumentIdState,
 )
  ? selectedReaderDocumentIdState
  : initialReaderDocuments.some((document) => document.id === requestedReaderDocumentId)
    ? requestedReaderDocumentId
    : (initialReaderDocuments[0]?.id ?? "");
 const selectedReaderResource =
  isReaderCoursePack && selectedReaderDocumentId === requestedReaderDocumentId
   ? initialReaderCourseResource
   : isReaderCoursePack && selectedReaderDocumentId === initialReaderDocuments[0]?.id
     ? initialReaderCourseResource
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
   return (initialReaderResource?.paragraphs ?? []).map((paragraph) =>
    externalDictationEntry(
     `reader:${paragraph.id}`,
     paragraph.zh,
     paragraph.vi || `Đoạn ${paragraph.paragraph_order}`,
     paragraph.pinyin,
    ),
   );
  }
  if (sourceType === "lesson" && isReaderCoursePack) {
   return (selectedReaderResource?.paragraphs ?? []).map((paragraph) =>
    externalDictationEntry(
     `reader:${paragraph.id}`,
     paragraph.zh,
     paragraph.vi || `Đoạn ${paragraph.paragraph_order}`,
     paragraph.pinyin,
    ),
   );
  }
  if (sourceType === "lesson") return transcriptEntries;
  if (sourceType === "library") {
   return selectedClip === undefined
    ? []
    : [externalDictationEntry(`tts:${selectedClip.id}`, selectedClip.text, selectedClip.title)];
  }
  const text = customText.trim();
  return text.length === 0
   ? []
   : [externalDictationEntry("custom:dictation", text, "Nội dung đã dán")];
 }, [
  customText,
  initialReaderResource?.paragraphs,
  selectedReaderResource?.paragraphs,
  isReaderCoursePack,
  selectedClip,
  sourceType,
  transcriptEntries,
 ]);
 const resetPracticeFlow = () => {
  tts.stop();
  loopCurrentRef.current = false;
  autoAdvanceRef.current = false;
  setLoopCurrent(false);
  setAutoAdvance(false);
  setScriptMode("hidden");
  setModeConfirmed(false);
  setPracticeStarted(false);
  setActiveEntryId("");
  setCheckedEntryIds(new Set());
 };

 const effectiveActiveEntryId = sourceEntries.some((entry) => entry.id === activeEntryId)
  ? activeEntryId
  : (sourceEntries[0]?.id ?? "");
 const effectiveActiveEntryIndex = Math.max(
  0,
  sourceEntries.findIndex((entry) => entry.id === effectiveActiveEntryId),
 );
 const selectTransportEntry = (index: number) => {
  const nextEntry = sourceEntries[index];
  if (!nextEntry) return;
  tts.stop();
  setActiveEntryId(nextEntry.id);
 };
 const playTransport = () => {
  const activeEntry = sourceEntries[effectiveActiveEntryIndex];
  const playbackTexts =
   playbackMode === "passage"
    ? sourceEntries.map(dictationEntryText).filter(Boolean)
    : activeEntry
      ? [dictationEntryText(activeEntry)].filter(Boolean)
      : [];
  if (playbackTexts.length === 0) return;

  const play = () => {
   tts.speakSequence(playbackTexts, () => {
    if (loopCurrentRef.current) {
     play();
     return;
    }
    if (autoAdvanceRef.current && effectiveActiveEntryIndex < sourceEntries.length - 1) {
     const nextIndex = effectiveActiveEntryIndex + 1;
     const nextEntry = sourceEntries[nextIndex];
     if (!nextEntry) return;
     setActiveEntryId(nextEntry.id);
     tts.speakSequence([dictationEntryText(nextEntry)]);
    }
   });
  };
  play();
 };
 const toggleTransportPlayback = () => {
  if (tts.isLoading) return;
  if (tts.isPaused) {
   tts.resume();
   return;
  }
  if (tts.isSpeaking) {
   tts.pause();
   return;
  }
  playTransport();
 };
 const changeTransportLoop = (next: boolean) => {
  loopCurrentRef.current = next;
  setLoopCurrent(next);
  if (next) {
   autoAdvanceRef.current = false;
   setAutoAdvance(false);
  }
 };
 const changeTransportAutoAdvance = (next: boolean) => {
  autoAdvanceRef.current = next;
  setAutoAdvance(next);
  if (next) {
   loopCurrentRef.current = false;
   setLoopCurrent(false);
  }
 };
 const toggleTransportLoop = () => changeTransportLoop(!loopCurrentRef.current);
 useListeningHotkeys({
  enabled: practiceStarted,
  onPrevious: () => selectTransportEntry(Math.max(0, effectiveActiveEntryIndex - 1)),
  onPlayToggle: toggleTransportPlayback,
  onRepeat: playTransport,
  onNext: () =>
   selectTransportEntry(Math.min(sourceEntries.length - 1, effectiveActiveEntryIndex + 1)),
  onToggleLoop: toggleTransportLoop,
  onStop: tts.stop,
 });

 const persistAttempt = (attempt: DictationAttempt) => {
  setCheckedEntryIds((current) => new Set(current).add(attempt.entryId));
  setAttemptSaveError("");
  void savePracticeAttempt({
   surface: "dictation",
   contentId: attempt.entryId,
   direction: null,
   answer: {
    expectedText: attempt.expectedText,
    answer: attempt.answer,
    mistakeCount: attempt.mistakeCount,
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => setAttemptSaveError(error.message));
  if (attempt.mistakeCount > 0) {
   const now = new Date().toISOString();
   void upsertLearningLoopItem({
    id: `dictation:${attempt.entryId}`,
    stable_key: `dictation:${attempt.entryId}`,
    kind: "dictation_mistake",
    source_id: attempt.entryId,
    source_href: "/dictation",
    title_zh: "Dictation mistake",
    title_vi: "Ôn lại lỗi chính tả",
    prompt_zh: attempt.expectedText,
    pinyin: "",
    meaning_vi: "",
    user_answer: attempt.answer,
    error_key: `mistakes:${attempt.mistakeCount}`,
    state: "new",
    due_at: now,
    interval_days: 0,
    correct_streak: 0,
    lapse_count: 0,
    revision: 0,
   }).catch((error: Error) => setAttemptSaveError(error.message));
  }
 };

 const sourceOptions: SegmentedControlItem<DictationSource>[] = [
  { key: "lesson", label: "Bài học / bài đọc HSK" },
  { key: "library", label: "Từ thư viện giọng đọc" },
  { key: "custom", label: "Dán nội dung" },
 ];
 if (requestedDocumentId.length > 0) {
  sourceOptions.unshift({ key: "reader", label: "Bài đọc hiện tại" });
 }

 return (
  <div className="grid min-w-0 gap-4">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     Phòng chép chính tả
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     Chọn bài HSK 3–6 theo giáo trình, tập và bài; hoặc dùng bản giọng đọc đã lưu hay nội dung tự
     dán để luyện nghe chép chính tả.
    </Typography>
   </div>

   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="muted" className="block">
       {practiceStarted
        ? "Bước 3 · Luyện nghe chép"
        : modeConfirmed
          ? "Bước 2 · Chọn chế độ"
          : "Bước 1 · Chọn nội dung"}
      </Typography>
      <Typography as="h2" variant="cardTitle" weight="black">
       Chọn bài nghe chép
      </Typography>
     </div>
     {sourceType === "lesson" ? (
      <Badge casing="natural">
       {isReaderCoursePack ? initialReaderDocuments.length : visibleLessons.length} bài
      </Badge>
     ) : null}
    </div>
    <Typography variant="bodySmall" tone="muted">
     Chọn bộ, tập và bài. Khu luyện chỉ mở sau khi xác nhận để giao diện không trộn phần chọn bài
     với phần học.
    </Typography>
    {initialDictationLessons.length === 0 ? (
     <Typography variant="bodySmall" tone="muted">
      Chưa có nội dung chép chính tả trong thư viện.
     </Typography>
    ) : (
     <div className="grid gap-3">
      <SegmentedControl<DictationSource>
       value={sourceType}
       items={sourceOptions}
       onChange={(value) => {
        setSourceType(value);
        resetPracticeFlow();
       }}
       aria-label="Nguồn nghe chép"
      />
      {sourceType === "lesson" ? (
       <>
        <div className="grid gap-2" aria-label="Chọn bộ nghe chép">
         <Typography variant="caption" tone="muted" weight="black">
          Bộ bài
         </Typography>
         <div className="flex flex-wrap gap-2">
          {bookOptions.map((book) => (
           <Button
            key={book.id}
            type="button"
            size="sm"
            variant={selectedBookId === book.id ? "active" : "outline"}
            onClick={() => {
             setSelectedBookId(book.id);
             setSelectedVolumeId(book.volumes[0]?.id ?? "");
             setSelectedLessonId("");
             setSelectedReaderDocumentId("");
             setSelectedSectionId("");
             resetPracticeFlow();
            }}
           >
            {book.title}
           </Button>
          ))}
         </div>
        </div>
        {selectedBook && selectedBook.volumes.length > 1 ? (
         <div className="flex flex-wrap gap-2" aria-label="Chọn tập nghe chép">
          {selectedBook.volumes.map((volume) => (
           <Button
            key={volume.id}
            type="button"
            size="sm"
            variant={selectedVolumeId === volume.id ? "active" : "outline"}
            onClick={() => {
             setSelectedVolumeId(volume.id);
             setSelectedLessonId("");
             setSelectedSectionId("");
             resetPracticeFlow();
            }}
           >
            {volume.title}
           </Button>
          ))}
         </div>
        ) : null}
        {isReaderCoursePack && initialReaderDocuments.length > 0 ? (
         <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
           <Typography variant="caption" tone="muted" weight="black">
            Chọn bài
           </Typography>
           <Typography variant="caption" tone="muted">
            {initialReaderDocuments.length} bài
           </Typography>
          </div>
          <Select
           value={selectedReaderDocumentId}
           onValueChange={(documentId) => {
            setSelectedReaderDocumentId(documentId);
            const next = new URLSearchParams(searchParams.toString());
            next.set("readerDocumentId", documentId);
            router.push(`${pathname}?${next.toString()}`, { scroll: false });
            resetPracticeFlow();
           }}
          >
           <SelectTrigger aria-label="Chọn bài đọc giáo trình để luyện chép chính tả">
            <SelectValue placeholder="Chọn bài" />
           </SelectTrigger>
           <SelectContent>
            <SelectGroup>
             {initialReaderDocuments.map((document) => (
              <SelectItem key={document.id} value={document.id}>
               Bài {document.reading_number ?? ""} · {document.title_zh} · {document.title_vi}
              </SelectItem>
             ))}
            </SelectGroup>
           </SelectContent>
          </Select>
         </div>
        ) : null}
        {!isReaderCoursePack && visibleLessons.length > 0 ? (
         <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
           <Typography variant="caption" tone="muted" weight="black">
            Chọn bài
           </Typography>
           <Typography variant="caption" tone="muted">
            {visibleLessons.length} bài
           </Typography>
          </div>
          <Select
           value={selectedLessonId || visibleLessons[0]?.id}
           onValueChange={(lessonId) => {
            setSelectedLessonId(lessonId);
            setSelectedSectionId("");
            resetPracticeFlow();
           }}
          >
           <SelectTrigger aria-label="Chọn bài luyện chép chính tả">
            <SelectValue placeholder="Chọn bài" />
           </SelectTrigger>
           <SelectContent>
            <SelectGroup>
             {visibleLessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
               {dictationLessonLabel(lesson)}
              </SelectItem>
             ))}
            </SelectGroup>
           </SelectContent>
          </Select>
         </div>
        ) : null}
       </>
      ) : null}
      {sourceType === "reader" ? (
       initialReaderResource === null ? (
        <Typography variant="bodySmall" tone="danger">
         Không tìm thấy bài đọc trong thư viện hiện tại.
        </Typography>
       ) : (
        <Typography variant="bodySmall" tone="muted">
         {initialReaderResource.document.title_zh} · {initialReaderResource.paragraphs.length} đoạn
        </Typography>
       )
      ) : null}
      {sourceType === "library" ? (
       ttsLibraryQuery.isPending ? (
        <Typography variant="bodySmall" tone="muted">
         Đang tải thư viện giọng đọc…
        </Typography>
       ) : ttsLibraryQuery.isError ? (
        <Typography variant="bodySmall" tone="danger">
         {ttsLibraryQuery.error.message}
        </Typography>
       ) : ttsLibraryQuery.data?.clips.length === 0 ? (
        <Typography variant="bodySmall" tone="muted">
         Chưa có bản ghi giọng đọc. Hãy tạo bản ghi trước khi luyện.
        </Typography>
       ) : (
        <Select
         value={selectedClipId || ttsLibraryQuery.data?.clips[0]?.id}
         onValueChange={(clipId) => {
          setSelectedClipId(clipId);
          resetPracticeFlow();
         }}
        >
         <SelectTrigger aria-label="Chọn bản ghi giọng đọc">
          <SelectValue placeholder="Chọn bản ghi" />
         </SelectTrigger>
         <SelectContent>
          <SelectGroup>
           {ttsLibraryQuery.data?.clips.map((clip) => (
            <SelectItem key={clip.id} value={clip.id}>
             {clip.title || clip.text.slice(0, 36)}
            </SelectItem>
           ))}
          </SelectGroup>
         </SelectContent>
        </Select>
       )
      ) : null}
      {sourceType === "custom" ? (
       <Textarea
        value={customText}
        onChange={(event) => {
         setCustomText(event.target.value);
         resetPracticeFlow();
        }}
        rows={5}
        lang="zh-CN"
        placeholder="Dán nội dung tiếng Trung để luyện nghe chép…"
        aria-label="Nội dung nghe chép tự dán"
       />
      ) : null}
      {sourceEntries.length > 0 && !modeConfirmed && !practiceStarted ? (
       <>
        <Typography variant="bodySmall" tone="muted">
         Sau khi vào luyện, bạn mới chọn chế độ theo câu, theo đoạn hoặc toàn bài.
        </Typography>
        <Button type="button" variant="default" onClick={() => setModeConfirmed(true)}>
         Vào luyện nghe chép
        </Button>
       </>
      ) : null}
     </div>
    )}
   </Card>

   {!isReaderCoursePack && bundleQuery.isPending ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      Đang tải bài nghe chép…
     </Typography>
    </Card>
   ) : null}
   {!isReaderCoursePack && bundleQuery.isError ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      {bundleQuery.error.message}
     </Typography>
    </Card>
   ) : null}
   {sourceEntries.length > 0 && modeConfirmed && !practiceStarted ? (
    <Card variant="section" padding="md" className="grid gap-4">
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" weight="black">
       Chọn chế độ luyện
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       Chọn cách chia đoạn nghe trước khi bắt đầu. Có thể đổi lại trong lúc luyện.
      </Typography>
     </div>
     <div className="grid gap-2 sm:grid-cols-3">
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "sentence" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("sentence")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        Theo câu
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        Nghe và chấm từng câu; phù hợp để bắt âm và sửa lỗi chi tiết.
       </Typography>
      </Button>
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "paragraph" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("paragraph")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        Theo đoạn
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        Nghe theo từng đoạn; luyện giữ mạch ý và cấu trúc dài hơn.
       </Typography>
      </Button>
      <Button
       type="button"
       size="lg"
       align="start"
       wrap="normal"
       layout="grid"
       variant={playbackMode === "passage" ? "active" : "surfaceCard"}
       onClick={() => setPlaybackMode("passage")}
      >
       <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
        Toàn bài
       </Typography>
       <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
        Nghe và chép toàn bộ bài trong một lượt.
       </Typography>
      </Button>
     </div>
     <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <Typography variant="caption" tone="muted">
       Đã chọn:{" "}
       {playbackMode === "sentence"
        ? "Theo câu"
        : playbackMode === "paragraph"
          ? "Theo đoạn"
          : "Toàn bài"}{" "}
       ·{" "}
       {initialReaderResource?.document.title_zh ??
        selectedReaderResource?.document.title_zh ??
        selectedSection?.titleZh ??
        selectedClip?.title ??
        "Nội dung tự chọn"}{" "}
       · {sourceEntries.length} câu
      </Typography>
      <div className="flex flex-wrap gap-2">
       <Button type="button" variant="outline" onClick={resetPracticeFlow}>
        Đổi bài / nguồn
       </Button>
       <Button type="button" variant="default" onClick={() => setPracticeStarted(true)}>
        Bắt đầu luyện
       </Button>
      </div>
     </div>
    </Card>
   ) : null}
   {sourceEntries.length > 0 && practiceStarted ? (
    <div className="grid gap-4">
     <section className="flex flex-col gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-1">
       <Typography variant="overline" tone="accent" weight="black">
        Bước 3 · Luyện nghe chép
       </Typography>
       <Typography as="h2" variant="sectionTitle" weight="black" clamp="one">
        {initialReaderResource?.document.title_zh ??
         selectedReaderResource?.document.title_zh ??
         selectedSection?.titleZh ??
         selectedClip?.title ??
         "Nội dung tự chọn"}
       </Typography>
       <Typography variant="bodySmall" tone="muted" clamp="one">
        {playbackMode === "sentence"
         ? "Theo câu"
         : playbackMode === "paragraph"
           ? "Theo đoạn"
           : "Toàn bài"}{" "}
        ·{" "}
        {initialReaderResource?.document.title_vi ||
         selectedReaderResource?.document.title_vi ||
         selectedSection?.titleVi ||
         selectedClip?.title ||
         "Nguồn tự chọn"}
       </Typography>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
       <Button type="button" variant="outline" onClick={() => setPracticeStarted(false)}>
        Đổi chế độ
       </Button>
       <Button type="button" variant="outline" onClick={resetPracticeFlow}>
        Đổi bài / nguồn
       </Button>
      </div>
     </section>

     <StudioDictationPracticePanel
      activeIndex={effectiveActiveEntryIndex}
      autoAdvance={autoAdvance}
      checkedCount={checkedEntryIds.size}
      entries={sourceEntries}
      isLoading={tts.isLoading}
      isPaused={tts.isPaused}
      isSpeaking={tts.isSpeaking}
      loopCurrent={loopCurrent}
      rate={tts.rate}
      scriptMode={scriptMode}
      selectedVoiceName={tts.selectedVoiceName}
      voices={tts.voices}
      onAttempt={persistAttempt}
      onAutoAdvanceChange={changeTransportAutoAdvance}
      onLoopCurrentChange={changeTransportLoop}
      onNext={() =>
       selectTransportEntry(Math.min(sourceEntries.length - 1, effectiveActiveEntryIndex + 1))
      }
      onPlayToggle={toggleTransportPlayback}
      onPrevious={() => selectTransportEntry(Math.max(0, effectiveActiveEntryIndex - 1))}
      onRateChange={(next) => {
       tts.stop();
       tts.setRate(next);
      }}
      onRepeat={playTransport}
      onScriptModeChange={setScriptMode}
      onSelect={selectTransportEntry}
      onStop={tts.stop}
      onVoiceChange={(next) => {
       tts.stop();
       tts.setSelectedVoiceName(next);
      }}
     />
     {attemptSaveError ? (
      <Typography variant="caption" tone="danger">
       {attemptSaveError}
      </Typography>
     ) : null}
    </div>
   ) : null}
  </div>
 );
}
