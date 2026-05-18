"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
 ActionButton,
 StudyCard,
 StudyProgress,
} from "@/features/vocabulary/components/VocabularyStudyPrimitives";
import {
 FlashcardFocusWorkspace,
 FlashcardMode,
 FlashFilterPanel,
 QuickWordChips,
} from "@/features/vocabulary/components/VocabularyFlashcardPanels";
import {
 LearningHeader,
 LearningShell,
 StatBox,
} from "@/features/vocabulary/components/VocabularyLearningShell";
import {
 AllWordsWorkspace,
 EmptyState,
 EntryEditDrawer,
 ImportLessonDrawer,
 LessonEditDrawer,
 LessonEditWorkspace,
 ShortcutHelp,
} from "@/features/vocabulary/components/VocabularyManagementPanels";
import {
 ExamplesMode,
 GuessMode,
 QuizMode,
 VocabListStudyMode,
 WriteMode,
} from "@/features/vocabulary/components/VocabularyStudyModes";
import {
 useVocabEntries,
 VocabSchemaMissingError,
} from "@/features/vocabulary/hooks/useVocabEntries";
import type {
 AutoplayBehavior,
 FlashFrontMode,
 FlashOrder,
 FlashStatus,
 FlashStatusFilter,
 ImportedEntryDraft,
 MainTab,
 StudyMode,
 WordFilter,
} from "@/features/vocabulary/types";
import {
 applyProgress,
 entryHasMissingData,
 getFlashLevel,
 getFlashStatus,
 getLessonNumber,
 hashForStudyOrder,
 isCoursePayload,
 matchesEntry,
 normalizeAnswer,
} from "@/features/vocabulary/utils/vocab-study";
import type {
 AiAnalysis,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";

type VocabularyLearningModuleProps = {
 courseId?: string | null;
 title?: string;
 description?: string;
 emptyTitle?: string;
 emptyDescription?: string;
 allowDocxReset?: boolean;
};

export default function VocabularyLearningModule({
 courseId,
 title = "Từ vựng Hán ngữ",
 description = "Học theo bài, ôn bằng flashcard, trắc nghiệm và chỉnh dữ liệu ngay khi cần.",
 emptyTitle = "Chưa có course từ vựng",
 emptyDescription = "Import file Vocabulary Compilation.docx để bắt đầu học theo bài.",
 allowDocxReset = true,
}: VocabularyLearningModuleProps = {}) {
 const queryClient = useQueryClient();
 const { data, isLoading, error } = useVocabEntries(courseId);
 const course = isCoursePayload(data) ? data : null;

 const [activeTab, setActiveTab] = useState<MainTab>("study");
 const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
 const [mode, setMode] = useState<StudyMode>("flashcard");
 const [wordFilter, setWordFilter] = useState<WordFilter>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [randomMode, setRandomMode] = useState(false);
 const [randomSeed, setRandomSeed] = useState(1);
 const [fromLesson, setFromLesson] = useState(11);
 const [toLesson, setToLesson] = useState(25);
 const [flashStatusFilter, setFlashStatusFilter] =
  useState<FlashStatusFilter>("all");
 const [levelFilter, setLevelFilter] = useState("all");
 const [flashOrder, setFlashOrder] = useState<FlashOrder>("lesson");
 const [frontMode, setFrontMode] = useState<FlashFrontMode>("hanzi");
 const [showExamples, setShowExamples] = useState(true);
 const [autoplayEnabled, setAutoplayEnabled] = useState(false);
 const [autoplayInterval, setAutoplayInterval] = useState(5);
 const [autoplayBehavior, setAutoplayBehavior] =
  useState<AutoplayBehavior>("flipNext");
 const [cardIndex, setCardIndex] = useState(0);
 const [revealed, setRevealed] = useState(false);
 const [guessInput, setGuessInput] = useState("");
 const [guessState, setGuessState] = useState<"idle" | "correct" | "wrong">(
  "idle",
 );
 const [hintLevel, setHintLevel] = useState(0);
 const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
 const [answerChecked, setAnswerChecked] = useState(false);
 const [writeCharIndex, setWriteCharIndex] = useState(0);
 const [mistakeQueue, setMistakeQueue] = useState<string[]>([]);
 const [sessionStats, setSessionStats] = useState({
  seen: 0,
  remembered: 0,
  missed: 0,
 });
 const [showShortcuts, setShowShortcuts] = useState(false);
 const [editingEntry, setEditingEntry] =
  useState<VocabEntryWithProgress | null>(null);
 const [editingLesson, setEditingLesson] =
  useState<VocabLessonWithStats | null>(null);
 const [importingLesson, setImportingLesson] =
  useState<VocabLessonWithStats | null>(null);
 const [resetting, setResetting] = useState(false);

 const lessons = useMemo(() => course?.lessons || [], [course?.lessons]);
 const activeLesson = useMemo(
  () =>
   lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null,
  [activeLessonId, lessons],
 );
 const activeLessonEntries = useMemo(
  () => activeLesson?.entries || [],
  [activeLesson?.entries],
 );

 const pauseAutoplay = useCallback(() => {
  setAutoplayEnabled(false);
 }, []);

 useEffect(() => {
  if (!activeLessonId && lessons[0]) setActiveLessonId(lessons[0].id);
 }, [activeLessonId, lessons]);

 useEffect(() => {
  if (!lessons.length) return;
  const lessonNumbers = lessons
   .map((lesson) => lesson.lesson_number)
   .filter((lessonNumber): lessonNumber is number => lessonNumber !== null);
  if (!lessonNumbers.length) return;

  const minLesson = Math.min(...lessonNumbers);
  const maxLesson = Math.max(...lessonNumbers);
  const low = Math.min(fromLesson, toLesson);
  const high = Math.max(fromLesson, toLesson);
  const rangeOverlapsCourse = lessonNumbers.some(
   (lessonNumber) => lessonNumber >= low && lessonNumber <= high,
  );

  if (!rangeOverlapsCourse) {
   setFromLesson(minLesson);
   setToLesson(maxLesson);
  }
 }, [fromLesson, lessons, toLesson]);

 const visibleEntries = useMemo(() => {
  const base = (
   activeTab === "all" ? course?.entries || [] : activeLessonEntries
  ).filter((entry) => matchesEntry(entry, searchQuery));
  return base.filter((entry) => {
   if (wordFilter === "all") return true;
   if (wordFilter === "examples")
    return Boolean(entry.ai_analysis.examples?.length);
   if (wordFilter === "missing") return entryHasMissingData(entry);
   return entry.status === wordFilter;
  });
 }, [activeLessonEntries, activeTab, course?.entries, searchQuery, wordFilter]);

 const rangeEntries = useMemo(() => {
  const low = Math.min(fromLesson, toLesson);
  const high = Math.max(fromLesson, toLesson);
  return (course?.entries || []).filter((entry) => {
   const lessonNumber = getLessonNumber(entry);
   return lessonNumber >= low && lessonNumber <= high;
  });
 }, [course?.entries, fromLesson, toLesson]);

 const flashLevels = useMemo(
  () =>
   Array.from(new Set(rangeEntries.map(getFlashLevel)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "vi")),
  [rangeEntries],
 );

 const filteredFlashEntries = useMemo(() => {
  const filtered = rangeEntries
   .filter((entry) => matchesEntry(entry, searchQuery))
   .filter((entry) =>
    flashStatusFilter === "all"
     ? true
     : getFlashStatus(entry) === flashStatusFilter,
   )
   .filter((entry) =>
    levelFilter === "all" ? true : getFlashLevel(entry) === levelFilter,
   );

  if (flashOrder === "random") {
   return [...filtered].sort(
    (a, b) =>
     hashForStudyOrder(`${a.id}:${randomSeed}`) -
     hashForStudyOrder(`${b.id}:${randomSeed}`),
   );
  }
  if (flashOrder === "hardFirst") {
   const rank: Record<FlashStatus, number> = {
    again: 0,
    hard: 1,
    new: 2,
    known: 3,
   };
   return [...filtered].sort(
    (a, b) =>
     rank[getFlashStatus(a)] - rank[getFlashStatus(b)] ||
     getLessonNumber(a) - getLessonNumber(b) ||
     a.row_number - b.row_number,
   );
  }
  return [...filtered].sort(
   (a, b) =>
    getLessonNumber(a) - getLessonNumber(b) || a.row_number - b.row_number,
  );
 }, [
  flashOrder,
  flashStatusFilter,
  levelFilter,
  randomSeed,
  rangeEntries,
  searchQuery,
 ]);

 const flashStats = useMemo(() => {
  const count = (status: FlashStatus) =>
   rangeEntries.filter((entry) => getFlashStatus(entry) === status).length;
  return {
   range: rangeEntries.length,
   filtered: filteredFlashEntries.length,
   known: count("known"),
   hard: count("hard"),
   again: count("again"),
  };
 }, [filteredFlashEntries.length, rangeEntries]);

 const studyQueue = useMemo(() => {
  const mistakeEntries = mistakeQueue
   .map((id) => filteredFlashEntries.find((entry) => entry.id === id))
   .filter((entry): entry is VocabEntryWithProgress => Boolean(entry));
  const mistakeIds = new Set(mistakeEntries.map((entry) => entry.id));
  const rest = filteredFlashEntries.filter(
   (entry) => !mistakeIds.has(entry.id),
  );
  return [...mistakeEntries, ...rest];
 }, [filteredFlashEntries, mistakeQueue]);

 const activeEntry = studyQueue[cardIndex] || studyQueue[0];
 const quizOptions = useMemo(() => {
  if (!activeEntry) return [];
  const sameCategory = filteredFlashEntries.filter(
   (entry) =>
    entry.id !== activeEntry.id &&
    entry.category &&
    entry.category === activeEntry.category,
  );
  const fallback = (course?.entries || []).filter(
   (entry) => entry.id !== activeEntry.id,
  );
  const unique = [...sameCategory, ...filteredFlashEntries, ...fallback]
   .filter((entry) => entry.id !== activeEntry.id)
   .filter(
    (entry, index, list) =>
     list.findIndex((candidate) => candidate.id === entry.id) === index,
   )
   .sort(
    (a, b) =>
     hashForStudyOrder(`${a.id}:${activeEntry.id}`) -
     hashForStudyOrder(`${b.id}:${activeEntry.id}`),
   )
   .slice(0, 3);
  return [activeEntry, ...unique].sort(
   (a, b) =>
    hashForStudyOrder(`${a.id}:${activeEntry.id}:option`) -
    hashForStudyOrder(`${b.id}:${activeEntry.id}:option`),
  );
 }, [activeEntry, course?.entries, filteredFlashEntries]);

 const resetCardState = useCallback(() => {
  setRevealed(false);
  setGuessInput("");
  setGuessState("idle");
  setHintLevel(0);
  setSelectedAnswerId(null);
  setAnswerChecked(false);
  setWriteCharIndex(0);
 }, []);

 useEffect(() => {
  setCardIndex(0);
  resetCardState();
 }, [
  activeLesson?.id,
  flashOrder,
  flashStatusFilter,
  frontMode,
  levelFilter,
  mode,
  randomMode,
  randomSeed,
  resetCardState,
  searchQuery,
  fromLesson,
  toLesson,
 ]);

 useEffect(() => {
  resetCardState();
 }, [activeEntry?.id, resetCardState]);

 useEffect(() => {
  if (cardIndex >= studyQueue.length) setCardIndex(0);
 }, [cardIndex, studyQueue.length]);

 const updateProgress = useCallback(
  async (entry: VocabEntryWithProgress, nextLevel: number) => {
   if (!course) return false;
   const answeredAt = new Date().toISOString();
   queryClient.setQueryData(
    ["vocab-entries", courseId ?? "current"],
    (current: unknown) =>
     isCoursePayload(
      current as
       | VocabCourseWithLessons
       | { course: null; lessons: []; entries: [] }
       | undefined,
     )
      ? applyProgress(
         current as VocabCourseWithLessons,
         entry.id,
         nextLevel,
         answeredAt,
        )
      : current,
   );
   const response = await fetch(`/api/vocab/entries/${entry.id}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proficiency_level: nextLevel }),
   });
   if (!response.ok) {
    toast.error("Chưa lưu được tiến độ");
    await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
    return false;
   }
   return true;
  },
  [course, courseId, queryClient],
 );

 const goNextCard = useCallback(() => {
  resetCardState();
  setCardIndex((index) =>
   studyQueue.length ? (index + 1) % studyQueue.length : 0,
  );
 }, [resetCardState, studyQueue.length]);

 const goPreviousCard = useCallback(() => {
  resetCardState();
  setCardIndex((index) =>
   studyQueue.length ? (index - 1 + studyQueue.length) % studyQueue.length : 0,
  );
 }, [resetCardState, studyQueue.length]);

 const speakEntry = useCallback((entry?: VocabEntryWithProgress) => {
  if (!entry || typeof window === "undefined" || !("speechSynthesis" in window))
   return;
  const utterance = new SpeechSynthesisUtterance(entry.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
 }, []);

 useEffect(() => {
  const handleVisibilityChange = () => {
   if (document.hidden) setAutoplayEnabled(false);
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
   document.removeEventListener("visibilitychange", handleVisibilityChange);
 }, []);

 useEffect(() => {
  if (!autoplayEnabled || mode !== "flashcard" || !activeEntry) return;
  if (typeof window === "undefined" || document.hidden) return;
  const timer = window.setInterval(() => {
   if (document.hidden) {
    setAutoplayEnabled(false);
    return;
   }
   if (autoplayBehavior === "frontOnly") {
    goNextCard();
    return;
   }
   if (!revealed) {
    if (autoplayBehavior === "speakFlipNext") speakEntry(activeEntry);
    setRevealed(true);
    return;
   }
   goNextCard();
  }, autoplayInterval * 1000);
  return () => window.clearInterval(timer);
 }, [
  activeEntry,
  autoplayBehavior,
  autoplayEnabled,
  autoplayInterval,
  goNextCard,
  mode,
  revealed,
  speakEntry,
 ]);

 const rememberEntry = useCallback(
  async (entry = activeEntry) => {
   if (!entry) return;
   const nextLevel = 5;
   setMistakeQueue((queue) => queue.filter((id) => id !== entry.id));
   setSessionStats((stats) => ({
    ...stats,
    seen: stats.seen + 1,
    remembered: stats.remembered + 1,
   }));
   goNextCard();
   await updateProgress(entry, nextLevel);
  },
  [activeEntry, goNextCard, updateProgress],
 );

 const missEntry = useCallback(
  async (kind: "again" | "review", entry = activeEntry) => {
   if (!entry) return;
   setMistakeQueue((queue) => {
    const next = queue.filter((id) => id !== entry.id);
    next.splice(Math.min(3, next.length), 0, entry.id);
    return next;
   });
   setSessionStats((stats) => ({
    ...stats,
    seen: stats.seen + 1,
    missed: stats.missed + 1,
   }));
   goNextCard();
   const currentLevel = entry.proficiency_level || 0;
   const nextLevel =
    kind === "again" ? 0 : Math.min(Math.max(currentLevel, 2), 3);
   await updateProgress(entry, nextLevel);
  },
  [activeEntry, goNextCard, updateProgress],
 );

 const resetFilteredProgress = useCallback(async () => {
  if (!filteredFlashEntries.length) return;
  const confirmed = window.confirm(
   `Reset tiến độ ${filteredFlashEntries.length} thẻ đang lọc?`,
  );
  if (!confirmed) return;
  pauseAutoplay();
  const results = await Promise.allSettled(
   filteredFlashEntries.map((entry) =>
    fetch(`/api/vocab/entries/${entry.id}/progress`, {
     method: "PATCH",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ reset: true }),
    }),
   ),
  );
  const failed = results.filter(
   (result) => result.status === "rejected",
  ).length;
  if (failed) toast.error(`${failed} thẻ chưa reset được`);
  else toast.success("Đã reset tiến độ bộ lọc");
  await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
 }, [filteredFlashEntries, pauseAutoplay, queryClient]);

 const checkGuess = useCallback(() => {
  if (!activeEntry) return;
  if (!guessInput.trim()) {
   toast.message("Nhập Hán tự trước đã nha");
   return;
  }
  if (normalizeAnswer(guessInput) === normalizeAnswer(activeEntry.hanzi)) {
   setGuessState("correct");
   setRevealed(true);
   return;
  }
  setGuessState("wrong");
  setRevealed(true);
 }, [activeEntry, guessInput]);

 const chooseQuizAnswer = useCallback(
  (entry: VocabEntryWithProgress) => {
   if (!activeEntry || answerChecked) return;
   setSelectedAnswerId(entry.id);
   setAnswerChecked(true);
  },
  [activeEntry, answerChecked],
 );

 const continueAfterQuiz = useCallback(() => {
  if (!activeEntry || !selectedAnswerId) return;
  if (selectedAnswerId === activeEntry.id) void rememberEntry(activeEntry);
  else void missEntry("review", activeEntry);
 }, [activeEntry, missEntry, rememberEntry, selectedAnswerId]);

 const saveEntry = useCallback(
  async (entry: VocabEntryWithProgress, analysis: AiAnalysis) => {
   const isNew = entry.id.startsWith("new-");
   const response = await fetch(
    isNew ? "/api/vocab/entries" : `/api/vocab/entries/${entry.id}`,
    {
     method: isNew ? "POST" : "PATCH",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      lesson_id: entry.lesson_id,
      hanzi: entry.hanzi,
      pinyin: entry.pinyin,
      sino_vietnamese: entry.sino_vietnamese,
      meaning: entry.meaning,
      word_type: entry.word_type,
      category: entry.category,
      row_number: entry.row_number,
      ai_analysis: analysis,
     }),
    },
   );
   const result = (await response.json().catch(() => null)) as {
    error?: string;
   } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa lưu được từ");
    return;
   }
   toast.success("Đã lưu từ");
   setEditingEntry(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  },
  [queryClient],
 );

 const deleteEntry = useCallback(
  async (entry: VocabEntryWithProgress) => {
   if (entry.id.startsWith("new-")) {
    setEditingEntry(null);
    return;
   }
   if (!window.confirm(`Xoá từ "${entry.hanzi}" khỏi bài này?`)) return;
   const response = await fetch(`/api/vocab/entries/${entry.id}`, {
    method: "DELETE",
   });
   const result = (await response.json().catch(() => null)) as {
    error?: string;
   } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa xoá được từ");
    return;
   }
   toast.success("Đã xoá từ");
   setEditingEntry(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  },
  [queryClient],
 );

 const saveLesson = useCallback(
  async (lesson: VocabLessonWithStats) => {
   const isNew = lesson.id.startsWith("new-");
   const response = await fetch(
    isNew ? "/api/vocab/lessons" : `/api/vocab/lessons/${lesson.id}`,
    {
     method: isNew ? "POST" : "PATCH",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      course_id: lesson.course_id,
      lesson_key: lesson.lesson_key,
      lesson_number: lesson.lesson_number,
      title: lesson.title,
      lesson_order: lesson.lesson_order,
     }),
    },
   );
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    lesson?: { id: string };
   } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa lưu được bài");
    return;
   }
   toast.success("Đã lưu bài");
   setEditingLesson(null);
   if (isNew && result?.lesson?.id) setActiveLessonId(result.lesson.id);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  },
  [queryClient],
 );

 const deleteLesson = useCallback(
  async (lesson: VocabLessonWithStats) => {
   if (lesson.id.startsWith("new-")) {
    setEditingLesson(null);
    return;
   }
   if (
    !window.confirm(
     `Xoá "${lesson.title}" và ${lesson.entries.length} từ trong bài này?`,
    )
   )
    return;
   const response = await fetch(`/api/vocab/lessons/${lesson.id}`, {
    method: "DELETE",
   });
   const result = (await response.json().catch(() => null)) as {
    error?: string;
   } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa xoá được bài");
    return;
   }
   toast.success("Đã xoá bài");
   setEditingLesson(null);
   setActiveLessonId(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  },
  [queryClient],
 );

 const createLessonDraft = useCallback(() => {
  if (!course) return;
  const maxOrder = lessons.reduce(
   (max, lesson) => Math.max(max, lesson.lesson_order),
   0,
  );
  const nextOrder = maxOrder + 1;
  const nextNumber = nextOrder;
  setEditingLesson({
   id: `new-lesson-${Date.now()}`,
   course_id: course.id,
   lesson_key: `L${String(nextNumber).padStart(2, "0")}`,
   lesson_number: nextNumber,
   title: `Bài ${nextNumber}`,
   lesson_order: nextOrder,
   item_count: 0,
   entries: [],
   studied: 0,
   mastered: 0,
   learning: 0,
   fresh: 0,
   progress: 0,
   categories: [],
  });
 }, [course, lessons]);

 const createEntryDraft = useCallback(
  (lesson = activeLesson) => {
   if (!course || !lesson) return;
   const rowNumber = lesson.entries.length + 1;
   const category = lesson.categories[0]?.name || "Bổ sung";
   const analysis: AiAnalysis = {
    hanzi: "",
    pinyin: "",
    meaning_summary: "",
    word_type: "",
    source_metadata: {
     course_key: course.course_key,
     lesson_key: lesson.lesson_key,
     lesson_number: lesson.lesson_number,
     lesson_title: lesson.title,
     row_number: rowNumber,
     category,
     source_file: course.source_file,
    },
   };
   setEditingEntry({
    id: `new-entry-${Date.now()}`,
    course_id: course.id,
    lesson_id: lesson.id,
    hanzi: "",
    pinyin: "",
    sino_vietnamese: "",
    meaning: "",
    word_type: "",
    category,
    row_number: rowNumber,
    ai_analysis: analysis,
    proficiency_level: 0,
    is_favorited: true,
    last_answered_at: null,
    status: "new",
    type: "word",
    source: {
     courseKey: course.course_key,
     lessonKey: lesson.lesson_key,
     lessonNumber: lesson.lesson_number,
     lessonTitle: lesson.title,
     rowNumber,
     category,
     sourceFile: course.source_file,
    },
   });
  },
  [activeLesson, course],
 );

 const importEntries = useCallback(
  async (lesson: VocabLessonWithStats, entries: ImportedEntryDraft[]) => {
   if (!entries.length) {
    toast.error("Chưa có từ hợp lệ để import");
    return;
   }
   const results = await Promise.allSettled(
    entries.map((entry, index) =>
     fetch("/api/vocab/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
       lesson_id: lesson.id,
       hanzi: entry.hanzi,
       pinyin: entry.pinyin,
       sino_vietnamese: entry.sino_vietnamese,
       meaning: entry.meaning,
       word_type: entry.word_type,
       category: entry.category,
       row_number: entry.row_number || lesson.entries.length + index + 1,
       ai_analysis: entry.ai_analysis,
      }),
     }).then(async (response) => {
      if (!response.ok) {
       const result = (await response.json().catch(() => null)) as {
        error?: string;
       } | null;
       throw new Error(result?.error || "Import thất bại");
      }
     }),
    ),
   );
   const failed = results.filter(
    (result) => result.status === "rejected",
   ).length;
   const imported = entries.length - failed;
   if (imported) toast.success(`Đã import ${imported} từ vào ${lesson.title}`);
   if (failed) toast.error(`${failed} từ chưa import được`);
   setImportingLesson(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  },
  [queryClient],
 );

 const resetImport = useCallback(async () => {
  setResetting(true);
  try {
   const response = await fetch("/api/vocab/import/docx-reset", {
    method: "POST",
   });
   const result = (await response.json().catch(() => null)) as {
    entryCount?: number;
    error?: string;
   } | null;
   if (!response.ok) throw new Error(result?.error || "Import thất bại");
   toast.success(`Đã reset và import ${result?.entryCount || 0} thẻ`);
   setActiveLessonId(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
  } catch (err) {
   toast.error(err instanceof Error ? err.message : "Không import được");
  } finally {
   setResetting(false);
  }
 }, [queryClient]);

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   const target = event.target as HTMLElement | null;
   if (
    target?.tagName === "INPUT" ||
    target?.tagName === "TEXTAREA" ||
    target?.tagName === "SELECT"
   )
    return;
   if (event.key === " ") {
    event.preventDefault();
    if (mode === "flashcard") setRevealed((value) => !value);
   } else if (event.key === "Enter") {
    event.preventDefault();
    if (mode === "guess" && guessState === "idle") checkGuess();
    else if ((mode === "quiz" || mode === "reverse") && answerChecked)
     continueAfterQuiz();
    else if (mode === "flashcard") {
     if (revealed) goNextCard();
     else setRevealed(true);
    }
   } else if (event.key === "1") {
    event.preventDefault();
    void missEntry("again");
   } else if (event.key === "2") {
    event.preventDefault();
    void missEntry("review");
   } else if (event.key === "3") {
    event.preventDefault();
    void rememberEntry();
   } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goNextCard();
   } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    goPreviousCard();
   } else if (
    ["a", "b", "c", "d"].includes(event.key.toLowerCase()) &&
    (mode === "quiz" || mode === "reverse")
   ) {
    event.preventDefault();
    const option = quizOptions[event.key.toLowerCase().charCodeAt(0) - 97];
    if (option) chooseQuizAnswer(option);
   } else if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    speakEntry(activeEntry);
   } else if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    if (mode === "guess") setHintLevel((level) => Math.min(level + 1, 4));
    else void missEntry("review");
   } else if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    void rememberEntry();
   } else if (event.key.toLowerCase() === "a") {
    if (mode === "quiz" || mode === "reverse") return;
    event.preventDefault();
    void missEntry("again");
   } else if (event.key === "?") {
    event.preventDefault();
    setShowShortcuts((value) => !value);
   }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  activeEntry,
  answerChecked,
  checkGuess,
  chooseQuizAnswer,
  continueAfterQuiz,
  goNextCard,
  goPreviousCard,
  guessState,
  missEntry,
  mode,
  quizOptions,
  rememberEntry,
  revealed,
  speakEntry,
 ]);

 if (error) {
  const missingSchema = error instanceof VocabSchemaMissingError;
  return (
   <LearningShell>
    <EmptyState
     title={
      missingSchema ? "Chưa apply database migration" : "Không tải được từ vựng"
     }
     description={
      missingSchema
       ? "Database Supabase hiện chưa có bảng vocab_courses. Apply file supabase/migrations/20260312000015_vocab_learning_entries.sql rồi bấm Reset docs."
       : error instanceof Error
         ? error.message
         : "Kiểm tra lại API hoặc migration."
     }
    />
   </LearningShell>
  );
 }

 return (
  <LearningShell>
   <LearningHeader
    title={title}
    description={description}
    activeTab={activeTab}
    onTabChange={setActiveTab}
    mode={mode}
    onModeChange={(value) => {
     setMode(value);
     pauseAutoplay();
    }}
    randomMode={randomMode}
    onRandomToggle={() => {
     setRandomMode((value) => {
      const next = !value;
      setFlashOrder(next ? "random" : "lesson");
      return next;
     });
     setRandomSeed(Date.now());
     pauseAutoplay();
    }}
    onResetImport={resetImport}
    resetting={resetting}
    allowDocxReset={allowDocxReset}
    onShowShortcuts={() => setShowShortcuts((value) => !value)}
    lessons={lessons}
    activeLesson={activeLesson}
    onLessonChange={(lessonId) => {
     setActiveLessonId(lessonId);
     const nextLesson = lessons.find((lesson) => lesson.id === lessonId);
     const lessonNumber = nextLesson?.lesson_number;
     if (lessonNumber) {
      setFromLesson(lessonNumber);
      setToLesson(lessonNumber);
     }
     pauseAutoplay();
    }}
   />

   {isLoading ? (
    <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white shadow-theme-md">
     <Loader2 className="h-6 w-6 animate-spin text-red-500" />
     <span className="ml-3 text-sm font-black text-stone-500">
      Đang tải kho từ...
     </span>
    </div>
   ) : !course ? (
    <EmptyState
     title={emptyTitle}
     description={emptyDescription}
     action={
      allowDocxReset ? (
       <ActionButton onClick={resetImport} loading={resetting} icon={Upload}>
        Import docs
       </ActionButton>
      ) : undefined
     }
    />
   ) : (
    <>
     <div className="min-w-0">
      {activeTab === "study" && activeLesson && (
       <StudyWorkspace
        lesson={activeLesson}
        mode={mode}
        activeEntry={activeEntry}
        total={studyQueue.length}
        cardIndex={cardIndex}
        revealed={revealed}
        guessInput={guessInput}
        guessState={guessState}
        hintLevel={hintLevel}
        quizOptions={quizOptions}
        selectedAnswerId={selectedAnswerId}
        answerChecked={answerChecked}
        writeCharIndex={writeCharIndex}
        randomMode={randomMode}
        sessionStats={sessionStats}
        entries={studyQueue}
        rangeEntries={rangeEntries}
        filteredEntries={filteredFlashEntries}
        flashStats={flashStats}
        lessons={lessons}
        fromLesson={fromLesson}
        toLesson={toLesson}
        flashLevels={flashLevels}
        flashStatusFilter={flashStatusFilter}
        levelFilter={levelFilter}
        flashOrder={flashOrder}
        frontMode={frontMode}
        showExamples={showExamples}
        autoplayEnabled={autoplayEnabled}
        autoplayInterval={autoplayInterval}
        autoplayBehavior={autoplayBehavior}
        onFromLessonChange={(value) => {
         setFromLesson(value);
         pauseAutoplay();
        }}
        onToLessonChange={(value) => {
         setToLesson(value);
         pauseAutoplay();
        }}
        onSearchChange={(value) => {
         setSearchQuery(value);
         pauseAutoplay();
        }}
        searchQuery={searchQuery}
        onFlashStatusFilterChange={(value) => {
         setFlashStatusFilter(value);
         pauseAutoplay();
        }}
        onLevelFilterChange={(value) => {
         setLevelFilter(value);
         pauseAutoplay();
        }}
        onFlashOrderChange={(value) => {
         setFlashOrder(value);
         setRandomMode(value === "random");
         if (value === "random") setRandomSeed(Date.now());
         pauseAutoplay();
        }}
        onFrontModeChange={(value) => {
         setFrontMode(value);
         pauseAutoplay();
        }}
        onShowExamplesChange={(value) => {
         setShowExamples(value);
         pauseAutoplay();
        }}
        onAutoplayEnabledChange={setAutoplayEnabled}
        onAutoplayIntervalChange={setAutoplayInterval}
        onAutoplayBehaviorChange={setAutoplayBehavior}
        onResetFilteredProgress={resetFilteredProgress}
        onSelectCard={(index) => {
         setCardIndex(index);
         resetCardState();
         pauseAutoplay();
        }}
        onReveal={() => setRevealed((value) => !value)}
        onGuessInputChange={setGuessInput}
        onCheckGuess={checkGuess}
        onHint={() => setHintLevel((level) => Math.min(level + 1, 4))}
        onChooseAnswer={chooseQuizAnswer}
        onContinueQuiz={continueAfterQuiz}
        onWriteCharIndexChange={setWriteCharIndex}
        onAgain={() => void missEntry("again")}
        onReview={() => void missEntry("review")}
        onRemember={() => void rememberEntry()}
        onPrevious={goPreviousCard}
        onNext={goNextCard}
        onSpeak={() => speakEntry(activeEntry)}
        onEdit={() => activeEntry && setEditingEntry(activeEntry)}
       />
      )}

      {activeTab === "all" && (
       <AllWordsWorkspace
        entries={visibleEntries}
        lessons={lessons}
        searchQuery={searchQuery}
        wordFilter={wordFilter}
        onSearchChange={setSearchQuery}
        onFilterChange={setWordFilter}
        onEdit={setEditingEntry}
        onAddEntry={() => createEntryDraft()}
       />
      )}

      {activeTab === "edit" && (
       <LessonEditWorkspace
        lessons={lessons}
        onEditLesson={setEditingLesson}
        onEditEntry={setEditingEntry}
        onAddLesson={createLessonDraft}
        onAddEntry={createEntryDraft}
        onImportLesson={setImportingLesson}
       />
      )}
     </div>
    </>
   )}

   {showShortcuts && <ShortcutHelp />}
   {editingEntry && (
    <EntryEditDrawer
     entry={editingEntry}
     lessons={lessons}
     onClose={() => setEditingEntry(null)}
     onSave={saveEntry}
     onDelete={deleteEntry}
    />
   )}
   {editingLesson && (
    <LessonEditDrawer
     lesson={editingLesson}
     onClose={() => setEditingLesson(null)}
     onSave={saveLesson}
     onDelete={deleteLesson}
    />
   )}
   {importingLesson && (
    <ImportLessonDrawer
     lesson={importingLesson}
     onClose={() => setImportingLesson(null)}
     onImport={(entries) => importEntries(importingLesson, entries)}
    />
   )}
  </LearningShell>
 );
}

export type StudyWorkspaceProps = {
 lesson: VocabLessonWithStats;
 mode: StudyMode;
 activeEntry?: VocabEntryWithProgress;
 entries: VocabEntryWithProgress[];
 rangeEntries: VocabEntryWithProgress[];
 filteredEntries: VocabEntryWithProgress[];
 flashStats: {
  range: number;
  filtered: number;
  known: number;
  hard: number;
  again: number;
 };
 lessons: VocabLessonWithStats[];
 fromLesson: number;
 toLesson: number;
 flashLevels: string[];
 flashStatusFilter: FlashStatusFilter;
 levelFilter: string;
 flashOrder: FlashOrder;
 frontMode: FlashFrontMode;
 showExamples: boolean;
 autoplayEnabled: boolean;
 autoplayInterval: number;
 autoplayBehavior: AutoplayBehavior;
 total: number;
 cardIndex: number;
 revealed: boolean;
 guessInput: string;
 guessState: "idle" | "correct" | "wrong";
 hintLevel: number;
 quizOptions: VocabEntryWithProgress[];
 selectedAnswerId: string | null;
 answerChecked: boolean;
 writeCharIndex: number;
 randomMode: boolean;
 sessionStats: { seen: number; remembered: number; missed: number };
 searchQuery: string;
 onFromLessonChange: (value: number) => void;
 onToLessonChange: (value: number) => void;
 onSearchChange: (value: string) => void;
 onFlashStatusFilterChange: (value: FlashStatusFilter) => void;
 onLevelFilterChange: (value: string) => void;
 onFlashOrderChange: (value: FlashOrder) => void;
 onFrontModeChange: (value: FlashFrontMode) => void;
 onShowExamplesChange: (value: boolean) => void;
 onAutoplayEnabledChange: (value: boolean) => void;
 onAutoplayIntervalChange: (value: number) => void;
 onAutoplayBehaviorChange: (value: AutoplayBehavior) => void;
 onResetFilteredProgress: () => void;
 onSelectCard: (index: number) => void;
 onReveal: () => void;
 onGuessInputChange: (value: string) => void;
 onCheckGuess: () => void;
 onHint: () => void;
 onChooseAnswer: (entry: VocabEntryWithProgress) => void;
 onContinueQuiz: () => void;
 onWriteCharIndexChange: (index: number) => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
 onPrevious: () => void;
 onNext: () => void;
 onSpeak: () => void;
 onEdit: () => void;
};

function StudyWorkspace(props: StudyWorkspaceProps) {
 const { activeEntry } = props;
 const lowLesson = Math.min(props.fromLesson, props.toLesson);
 const highLesson = Math.max(props.fromLesson, props.toLesson);
 const rangeTitle =
  lowLesson === highLesson
   ? `Bài ${lowLesson}`
   : `Bài ${lowLesson}-${highLesson}`;
 const rangeCategories = Array.from(
  new Set(props.rangeEntries.map((entry) => entry.category).filter(Boolean)),
 )
  .slice(0, 3)
  .join(", ");
 const rangeFresh = props.rangeEntries.filter(
  (entry) => getFlashStatus(entry) === "new",
 ).length;
 if (props.mode === "flashcard") {
  return (
   <FlashcardFocusWorkspace
    {...props}
    rangeTitle={rangeTitle}
    rangeCategories={rangeCategories}
    rangeFresh={rangeFresh}
   />
  );
 }
 return (
  <section className="rounded-[24px] border-2 border-stone-200 bg-white p-3 shadow-theme-md md:p-5">
   <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      {rangeTitle}
     </p>
     <h2 className="mt-1 text-2xl font-black text-stone-900 md:text-3xl">
      {rangeTitle}
     </h2>
     <p className="mt-2 text-base font-bold text-stone-500">
      {props.rangeEntries.length} từ trong bộ lọc bài
      {rangeCategories ? ` · ${rangeCategories}` : ""}
     </p>
    </div>
    <div className="grid grid-cols-3 gap-2">
     <StatBox value={rangeFresh} label="Chưa học" tone="yellow" />
     <StatBox
      value={props.flashStats.hard + props.flashStats.again}
      label="Đang ôn"
      tone="blue"
     />
     <StatBox value={props.flashStats.known} label="Thành thạo" tone="green" />
    </div>
   </div>

   <StudyProgress
    title={rangeTitle}
    current={props.total ? props.cardIndex + 1 : 0}
    total={props.total}
    stats={props.sessionStats}
    studied={
     props.rangeEntries.filter(
      (entry) => entry.last_answered_at || entry.proficiency_level > 0,
     ).length
    }
    randomMode={props.randomMode}
   />

   <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
    <FlashFilterPanel {...props} />
    <StudyCard>
     {!activeEntry ? (
      <EmptyState
       title="Không có từ trong bộ lọc"
       description="Đổi khoảng bài, trạng thái hoặc search để tiếp tục học."
       compact
      />
     ) : props.mode === "list" ? (
      <VocabListStudyMode
       entries={props.entries}
       activeEntryId={activeEntry.id}
       onSelect={props.onSelectCard}
       onEdit={props.onEdit}
      />
     ) : props.mode === "guess" ? (
      <GuessMode {...props} activeEntry={activeEntry} />
     ) : props.mode === "write" ? (
      <WriteMode {...props} activeEntry={activeEntry} />
     ) : props.mode === "examples" ? (
      <ExamplesMode
       activeEntry={activeEntry}
       cardIndex={props.cardIndex}
       total={props.total}
       onPrevious={props.onPrevious}
       onNext={props.onNext}
       onSpeak={props.onSpeak}
       onEdit={props.onEdit}
      />
     ) : props.mode === "quiz" || props.mode === "reverse" ? (
      <QuizMode {...props} activeEntry={activeEntry} mode={props.mode} />
     ) : (
      <FlashcardMode {...props} activeEntry={activeEntry} />
     )}
     <QuickWordChips
      entries={props.entries}
      activeEntryId={activeEntry?.id}
      onSelect={props.onSelectCard}
     />
    </StudyCard>
   </div>
  </section>
 );
}
