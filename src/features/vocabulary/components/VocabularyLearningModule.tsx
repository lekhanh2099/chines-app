"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
 BookOpen,
 Brain,
 Check,
 ChevronRight,
 Edit3,
 Eye,
 FileText,
 Heart,
 HelpCircle,
 Keyboard,
 Layers3,
 Loader2,
 Pause,
 PenLine,
 Play,
 Plus,
 RotateCcw,
 Search,
 Sparkles,
 Trash2,
 Upload,
 Volume2,
 XCircle,
 type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import {
 LearningDrawer,
 LessonSelectCard,
 type LessonSelectOption,
} from "@/features/learning/components";
import {
 ActionButton,
 ControlLabel,
 FilterChip,
 IconToolButton,
 MiniStat,
 StudyCard,
 StudyMeta,
 StudyProgress,
} from "@/features/vocabulary/components/VocabularyStudyPrimitives";
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
 ImportMode,
 MainTab,
 StudyMode,
 WordFilter,
} from "@/features/vocabulary/types";
import {
 applyProgress,
 entryHasMissingData,
 examplesToText,
 getCompactNote,
 getFlashLevel,
 getFlashStatus,
 getFrontText,
 getLessonNumber,
 getMeaning,
 getPrimaryExample,
 getStudyCharacters,
 hashForStudyOrder,
 isCoursePayload,
 lineText,
 matchesEntry,
 normalizeAnswer,
 parseLines,
 parseMarkdownVocabEntries,
 textToExamples,
} from "@/features/vocabulary/utils/vocab-study";
import { cn } from "@/lib/utils";
import type {
 AiAnalysis,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";

const studyModes: { key: StudyMode; label: string; icon: LucideIcon }[] = [
 { key: "list", label: "List", icon: Layers3 },
 { key: "guess", label: "Đoán từ", icon: Brain },
 { key: "flashcard", label: "Flashcard", icon: Eye },
 { key: "write", label: "Viết", icon: Keyboard },
 { key: "examples", label: "Ví dụ", icon: FileText },
 { key: "quiz", label: "Quiz", icon: FileText },
 { key: "reverse", label: "Ngược", icon: RotateCcw },
];

const answerLabels = ["A", "B", "C", "D"];

export default function VocabularyLearningModule() {
 const queryClient = useQueryClient();
 const { data, isLoading, error } = useVocabEntries();
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
   queryClient.setQueryData(["vocab-entries"], (current: unknown) =>
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
  [course, queryClient],
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
     title="Chưa có course từ vựng"
     description="Import file Vocabulary Compilation.docx để bắt đầu học theo bài."
     action={
      <ActionButton onClick={resetImport} loading={resetting} icon={Upload}>
       Import docs
      </ActionButton>
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

function LearningShell({ children }: { children: React.ReactNode }) {
 return (
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
    {children}
   </div>
  </div>
 );
}

function LearningHeader({
 activeTab,
 onTabChange,
 mode,
 onModeChange,
 randomMode,
 onRandomToggle,
 onResetImport,
 resetting,
 onShowShortcuts,
 lessons,
 activeLesson,
 onLessonChange,
}: {
 activeTab: MainTab;
 onTabChange: (tab: MainTab) => void;
 mode: StudyMode;
 onModeChange: (mode: StudyMode) => void;
 randomMode: boolean;
 onRandomToggle: () => void;
 onResetImport: () => void;
 resetting: boolean;
 onShowShortcuts: () => void;
 lessons: VocabLessonWithStats[];
 activeLesson: VocabLessonWithStats | null;
 onLessonChange: (lessonId: string) => void;
}) {
 const isFlashcardFocus = activeTab === "study" && mode === "flashcard";
 return (
  <header className="rounded-[22px] border-2 border-stone-200 bg-white p-3 shadow-theme-sm md:rounded-[24px]">
   <div
    className={cn(
     "grid gap-3 xl:items-start",
     isFlashcardFocus
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      : "xl:grid-cols-[minmax(0,1fr)_minmax(320px,42%)]",
    )}
   >
    <div className="min-w-0">
     <h1
      className={cn(
       "font-black tracking-normal text-stone-900",
       isFlashcardFocus
        ? "text-xl sm:text-2xl md:text-3xl"
        : "text-3xl md:text-4xl",
      )}
     >
      Từ vựng Hán ngữ
     </h1>
     <p
      className={cn(
       "mt-1 max-w-2xl text-sm font-bold leading-6 text-stone-500",
       isFlashcardFocus && "hidden md:block",
      )}
     >
      Học theo bài, ôn bằng flashcard, trắc nghiệm và chỉnh dữ liệu ngay khi
      cần.
     </p>
     <div className="mt-2 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
      <SegmentedControl
       value={activeTab}
       items={[
        { key: "study", label: "Học", icon: BookOpen },
        { key: "all", label: "Từ", icon: Layers3 },
        { key: "edit", label: "Sửa", icon: Edit3 },
       ]}
       onChange={(key) => onTabChange(key as MainTab)}
      />
      <div className="hidden gap-2 md:flex">
       <ActionButton
        onClick={onResetImport}
        loading={resetting}
        icon={Upload}
        tone="neutral"
       >
        Reset docs
       </ActionButton>

       <ActionButton
        onClick={onRandomToggle}
        icon={RotateCcw}
        tone={randomMode ? "purple" : "neutral"}
       >
        {randomMode ? "Đang random" : "Ngẫu nhiên"}
       </ActionButton>
      </div>
     </div>
    </div>

    {activeTab === "study" && lessons.length > 0 ? (
     isFlashcardFocus ? (
      <CompactLessonSelect
       lessons={lessons}
       activeLessonId={activeLesson?.id || lessons[0]?.id || ""}
       onLessonChange={onLessonChange}
      />
     ) : (
      <LessonSelectPanel
       lessons={lessons}
       activeLessonId={activeLesson?.id || lessons[0]?.id || ""}
       onLessonChange={onLessonChange}
      />
     )
    ) : null}
   </div>

   {activeTab === "study" && (
    <div className="mt-3 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
     <SegmentedControl
      value={mode}
      items={studyModes.map((item) => ({
       key: item.key,
       label: item.label,
       icon: item.icon,
      }))}
      onChange={(key) => onModeChange(key as StudyMode)}
     />
     <IconToolButton
      icon={HelpCircle}
      label="Shortcut"
      onClick={onShowShortcuts}
     />
    </div>
   )}
  </header>
 );
}

function LessonSelectPanel({
 lessons,
 activeLessonId,
 onLessonChange,
}: {
 lessons: VocabLessonWithStats[];
 activeLessonId: string;
 onLessonChange: (lessonId: string) => void;
}) {
 const activeLesson =
  lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null;
 const options: LessonSelectOption[] = lessons.map((lesson) => ({
  id: lesson.id,
  label: `${lesson.title.replace(/^Tổng quan & Phân nhóm từ vựng\s*/i, "")} · Đã học ${lesson.studied}/${lesson.entries.length}`,
  progressLabel: `Tiến độ ${lesson.progress}%`,
  countLabel: `Đã học ${lesson.studied}/${lesson.entries.length}`,
  categoryLabel:
   lesson.categories
    .slice(0, 2)
    .map((item) => item.name)
    .join(", ") || "Bổ sung",
 }));

 return (
  <LessonSelectCard
   countLabel={`${lessons.length} bài`}
   value={activeLessonId}
   options={options}
   onChange={onLessonChange}
   footer={activeLesson ? undefined : null}
  />
 );
}

function CompactLessonSelect({
 lessons,
 activeLessonId,
 onLessonChange,
}: {
 lessons: VocabLessonWithStats[];
 activeLessonId: string;
 onLessonChange: (lessonId: string) => void;
}) {
 const activeLesson =
  lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null;
 return (
  <div className="rounded-[18px] border-2 border-blue-200 bg-blue-50/60 p-3 shadow-theme-sm md:rounded-[20px]">
   <div className="flex items-center justify-between gap-2">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
     Bài đang học
    </p>
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">
     {lessons.length} bài
    </span>
   </div>
   <Select
    value={activeLessonId}
    onChange={(event) => onLessonChange(event.target.value)}
    className="mt-2 h-10 text-xs sm:h-11 sm:text-sm"
   >
    {lessons.map((lesson) => (
     <option key={lesson.id} value={lesson.id}>
      {lesson.title.replace(/^Tổng quan & Phân nhóm từ vựng\s*/i, "")} · Đã học{" "}
      {lesson.studied}/{lesson.entries.length}
     </option>
    ))}
   </Select>
   {activeLesson && (
    <p className="mt-2 truncate text-xs font-bold text-stone-500">
     {activeLesson.categories
      .slice(0, 2)
      .map((item) => item.name)
      .join(", ") || "Bổ sung"}
    </p>
   )}
  </div>
 );
}

function StudyWorkspace(props: {
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
}) {
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

function FlashcardFocusWorkspace(
 props: Parameters<typeof StudyWorkspace>[0] & {
  rangeTitle: string;
  rangeCategories: string;
  rangeFresh: number;
 },
) {
 const [filterOpen, setFilterOpen] = useState(false);
 const [listOpen, setListOpen] = useState(false);
 const studied = props.rangeEntries.filter(
  (entry) => entry.last_answered_at || entry.proficiency_level > 0,
 ).length;
 const progress = props.total
  ? Math.min(100, Math.round((studied / props.total) * 100))
  : 0;
 const activeEntry = props.activeEntry;

 return (
  <section className="rounded-[22px] border-2 border-stone-200 bg-white p-2.5 shadow-theme-md sm:p-3 md:rounded-[24px] md:p-4">
   <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border-2 border-stone-100 bg-stone-50 px-3 py-2">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     <p className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-500">
      {props.rangeTitle}
     </p>
     <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">
      {props.total ? props.cardIndex + 1 : 0}/{props.total} thẻ
     </p>
     <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">
      Đã học {studied}/{props.total} · {progress}%
     </p>
     {props.autoplayEnabled && (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
       Tự phát {props.autoplayInterval}s
      </span>
     )}
    </div>
    <button
     type="button"
     onClick={() => setFilterOpen(true)}
     className="rounded-2xl border-2 border-stone-200 bg-white px-3 py-2 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     Bộ lọc
    </button>
   </div>

   <div className="mt-2 grid grid-cols-3 gap-2 md:flex md:max-w-full md:items-center md:overflow-x-auto md:pb-1">
    <Select
     value={props.frontMode}
     onChange={(event) =>
      props.onFrontModeChange(event.target.value as FlashFrontMode)
     }
     wrapperClassName="min-w-0"
     className="h-10 px-2 pr-8 text-xs sm:h-11 sm:px-4 sm:pr-12 sm:text-sm"
    >
     <option value="hanzi">Mặt trước: Hán</option>
     <option value="meaning">Mặt trước: Nghĩa</option>
     <option value="pinyin">Mặt trước: Pinyin</option>
    </Select>
    <button
     type="button"
     onClick={() => setListOpen(true)}
     className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-2xl border-2 border-stone-200 bg-white px-2 text-xs font-black text-stone-700 shadow-theme-sm hover:bg-stone-50 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
    >
     <Layers3 className="h-4 w-4" />
     <span className="truncate">List từ</span>
    </button>
    <button
     type="button"
     onClick={() => props.onAutoplayEnabledChange(!props.autoplayEnabled)}
     className={cn(
      "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-2xl border-2 px-2 text-xs font-black shadow-theme-sm sm:h-11 sm:gap-2 sm:px-4 sm:text-sm",
      props.autoplayEnabled
       ? "border-red-500 bg-red-500 text-white"
       : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
     )}
    >
     {props.autoplayEnabled ? (
      <Pause className="h-4 w-4" />
     ) : (
      <Play className="h-4 w-4" />
     )}
     <span className="truncate">
      {props.autoplayEnabled ? "Dừng" : "Tự phát"}
     </span>
    </button>
   </div>

   <div className="mt-4">
    {!activeEntry ? (
     <div className="rounded-[28px] border-2 border-stone-100 bg-stone-50 p-8">
      <EmptyState
       title="Không có từ trong bộ lọc"
       description="Đổi khoảng bài, trạng thái hoặc search để tiếp tục học."
       compact
      />
     </div>
    ) : (
     <FlashcardFocusMode {...props} activeEntry={activeEntry} />
    )}
   </div>

   {filterOpen && (
    <LearningDrawer
     title="Bộ lọc flashcard"
     onClose={() => setFilterOpen(false)}
    >
     <FlashFilterPanel {...props} />
    </LearningDrawer>
   )}
   {listOpen && (
    <LearningDrawer
     title="Danh sách từ trong bộ lọc"
     onClose={() => setListOpen(false)}
    >
     <QuickWordChips
      entries={props.entries}
      activeEntryId={activeEntry?.id}
      onSelect={(index) => {
       props.onSelectCard(index);
       setListOpen(false);
      }}
      expanded
     />
    </LearningDrawer>
   )}
  </section>
 );
}

function FlashFilterPanel(props: {
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
 searchQuery: string;
 flashStats: {
  range: number;
  filtered: number;
  known: number;
  hard: number;
  again: number;
 };
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
}) {
 const lessonNumbers = props.lessons
  .map((lesson) => lesson.lesson_number)
  .filter((lessonNumber): lessonNumber is number => lessonNumber !== null);
 const minLesson = Math.min(...lessonNumbers, 11);
 const maxLesson = Math.max(...lessonNumbers, 25);
 const statusItems: { key: FlashStatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "known", label: "Đã biết" },
  { key: "hard", label: "Còn khó" },
  { key: "again", label: "Học lại" },
 ];

 return (
  <aside className="rounded-[24px] border-2 border-stone-200 bg-white p-4 text-left shadow-theme-sm">
   <div className="grid grid-cols-2 gap-2">
    <MiniStat label="Trong khoảng" value={props.flashStats.range} />
    <MiniStat label="Đang hiện" value={props.flashStats.filtered} />
    <MiniStat label="Đã biết" value={props.flashStats.known} tone="green" />
    <MiniStat label="Còn khó" value={props.flashStats.hard} tone="yellow" />
    <MiniStat label="Học lại" value={props.flashStats.again} tone="red" />
   </div>

   <div className="mt-4 grid grid-cols-2 gap-2">
    <label className="text-xs font-black uppercase tracking-wide text-stone-500">
     Từ bài
     <Input
      type="number"
      min={minLesson}
      max={maxLesson}
      value={props.fromLesson}
      onChange={(event) =>
       props.onFromLessonChange(Number(event.target.value) || minLesson)
      }
      className="mt-1 h-11 rounded-2xl border-2 font-black"
     />
    </label>
    <label className="text-xs font-black uppercase tracking-wide text-stone-500">
     Đến bài
     <Input
      type="number"
      min={minLesson}
      max={maxLesson}
      value={props.toLesson}
      onChange={(event) =>
       props.onToLessonChange(Number(event.target.value) || maxLesson)
      }
      className="mt-1 h-11 rounded-2xl border-2 font-black"
     />
    </label>
   </div>

   <div className="mt-3 flex flex-wrap gap-1.5">
    {props.lessons.map((lesson) => {
     const lessonNumber = lesson.lesson_number || 0;
     const selected =
      lessonNumber >= Math.min(props.fromLesson, props.toLesson) &&
      lessonNumber <= Math.max(props.fromLesson, props.toLesson);
     return (
      <button
       key={lesson.id}
       type="button"
       onClick={() => {
        props.onFromLessonChange(lessonNumber);
        props.onToLessonChange(lessonNumber);
       }}
       className={cn(
        "rounded-full border-2 px-2.5 py-1 text-xs font-black transition",
        selected
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
       )}
      >
       B{lessonNumber}
      </button>
     );
    })}
   </div>

   <label className="mt-4 block text-xs font-black uppercase tracking-wide text-stone-500">
    Tìm trong bộ lọc
    <Input
     value={props.searchQuery}
     onChange={(event) => props.onSearchChange(event.target.value)}
     placeholder="Hán tự, pinyin, nghĩa..."
     className="mt-1 h-11 rounded-2xl border-2 font-bold"
    />
   </label>

   <div className="mt-4">
    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
     Trạng thái
    </p>
    <div className="mt-2 flex flex-wrap gap-1.5">
     {statusItems.map((item) => (
      <FilterChip
       key={item.key}
       active={props.flashStatusFilter === item.key}
       onClick={() => props.onFlashStatusFilterChange(item.key)}
      >
       {item.label}
      </FilterChip>
     ))}
    </div>
   </div>

   <div className="mt-4 grid gap-2">
    <ControlLabel label="Level">
     <Select
      value={props.levelFilter}
      onChange={(event) => props.onLevelFilterChange(event.target.value)}
     >
      <option value="all">Tất cả level</option>
      {props.flashLevels.map((level) => (
       <option key={level} value={level}>
        {level}
       </option>
      ))}
     </Select>
    </ControlLabel>
    <ControlLabel label="Thứ tự">
     <Select
      value={props.flashOrder}
      onChange={(event) =>
       props.onFlashOrderChange(event.target.value as FlashOrder)
      }
     >
      <option value="lesson">Theo bài</option>
      <option value="random">Random</option>
      <option value="hardFirst">Ưu tiên khó</option>
     </Select>
    </ControlLabel>
    <ControlLabel label="Mặt trước">
     <Select
      value={props.frontMode}
      onChange={(event) =>
       props.onFrontModeChange(event.target.value as FlashFrontMode)
      }
     >
      <option value="hanzi">Hán tự</option>
      <option value="meaning">Nghĩa Việt</option>
      <option value="pinyin">Pinyin</option>
     </Select>
    </ControlLabel>
   </div>

   <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm font-black text-stone-700">
    Hiện ví dụ ở mặt sau
    <input
     type="checkbox"
     checked={props.showExamples}
     onChange={(event) => props.onShowExamplesChange(event.target.checked)}
     className="h-5 w-5 accent-red-500"
    />
   </label>

   <div className="mt-4 rounded-2xl border-2 border-blue-100 bg-blue-50 p-3">
    <div className="flex items-center justify-between gap-2">
     <p className="text-xs font-black uppercase tracking-wide text-blue-700">
      Tự phát
     </p>
     <button
      type="button"
      onClick={() => props.onAutoplayEnabledChange(!props.autoplayEnabled)}
      className={cn(
       "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black",
       props.autoplayEnabled
        ? "bg-red-500 text-white"
        : "bg-white text-blue-700 shadow-theme-sm",
      )}
     >
      {props.autoplayEnabled ? (
       <Pause className="h-4 w-4" />
      ) : (
       <Play className="h-4 w-4" />
      )}
      {props.autoplayEnabled ? "Dừng" : "Chạy"}
     </button>
    </div>
    <div className="mt-3 grid gap-2">
     <Select
      value={String(props.autoplayInterval)}
      onChange={(event) =>
       props.onAutoplayIntervalChange(Number(event.target.value))
      }
     >
      <option value="3">3 giây</option>
      <option value="5">5 giây</option>
      <option value="8">8 giây</option>
      <option value="12">12 giây</option>
     </Select>
     <Select
      value={props.autoplayBehavior}
      onChange={(event) =>
       props.onAutoplayBehaviorChange(event.target.value as AutoplayBehavior)
      }
     >
      <option value="flipNext">Lật rồi chuyển</option>
      <option value="frontOnly">Chỉ chuyển mặt trước</option>
      <option value="speakFlipNext">Đọc + lật + chuyển</option>
     </Select>
    </div>
   </div>

   <button
    type="button"
    onClick={props.onResetFilteredProgress}
    className="mt-3 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
   >
    Reset tiến độ bộ lọc
   </button>
  </aside>
 );
}

function FlashcardMode({
 activeEntry,
 cardIndex,
 total,
 revealed,
 frontMode,
 showExamples,
 onReveal,
 onSpeak,
 onEdit,
 onAgain,
 onReview,
 onRemember,
 onPrevious,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 revealed: boolean;
 frontMode: FlashFrontMode;
 showExamples: boolean;
 onReveal: () => void;
 onSpeak: () => void;
 onEdit: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
 onPrevious: () => void;
}) {
 return (
  <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
   <div className="rounded-full bg-white px-4 py-1.5 text-lg font-black text-stone-800 shadow-theme-sm">
    {Math.min(cardIndex + 1, total)} / {total}
   </div>
   <div className="relative mt-4 w-full max-w-3xl">
    <div className="absolute inset-0 rotate-[-4deg] rounded-[36px] border-2 border-stone-100 bg-white/70" />
    <div className="absolute inset-0 rotate-3 rounded-[36px] border-2 border-stone-100 bg-white/80" />
    <div className="relative flex h-[clamp(430px,52vh,560px)] min-h-0 flex-col rounded-[32px] border-2 border-stone-100 bg-white p-5 shadow-theme-md md:p-6">
     <div className="flex items-center justify-between text-stone-800">
      <button
       type="button"
       className="rounded-full p-2 hover:bg-stone-50"
       title="Yêu thích"
      >
       <Heart className="h-7 w-7" />
      </button>
      <span className="text-lg font-black text-stone-500">
       {Math.min(cardIndex + 1, total)} / {total}
      </span>
      <button
       type="button"
       onClick={onSpeak}
       className="rounded-full p-2 hover:bg-stone-50"
       title="Phát âm"
      >
       <Volume2 className="h-7 w-7" />
      </button>
     </div>
     {!revealed ? (
      <button
       type="button"
       onClick={onReveal}
       className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[24px] py-8 transition hover:bg-stone-50/70"
      >
       <h3 className="text-center text-[clamp(3.5rem,7vw,6rem)] font-black leading-tight text-red-500">
        {getFrontText(activeEntry, frontMode)}
       </h3>
       <p className="mt-7 text-center text-lg font-black text-stone-500 md:text-xl">
        {frontMode === "hanzi"
         ? "Tự đoán pinyin và nghĩa trước khi lật thẻ."
         : "Tự đoán Hán tự trước khi lật thẻ."}
       </p>
       <p className="mt-3 text-sm font-black uppercase tracking-wide text-stone-400">
        Space · Bấm thẻ để xem đáp án
       </p>
      </button>
     ) : (
      <FlashcardBack
       onReveal={onReveal}
       entry={activeEntry}
       onSpeak={onSpeak}
       onEdit={onEdit}
       showExamples={showExamples}
       compact
      />
     )}
    </div>
   </div>
   <div className="mt-5 flex flex-wrap justify-center gap-3 md:gap-4">
    <RoundStudyButton icon={Search} label="Chi tiết" onClick={onEdit} />
    <RoundStudyButton icon={RotateCcw} label="Lùi" onClick={onPrevious} />
    <RoundStudyButton
     icon={revealed ? Eye : Play}
     label={revealed ? "Ẩn đáp án" : "Xem đáp án"}
     onClick={onReveal}
     primary
    />
    <RoundStudyButton
     icon={XCircle}
     label="Chưa nhớ"
     onClick={onAgain}
     danger
    />
    <RoundStudyButton
     icon={HelpCircle}
     label="Cần ôn"
     onClick={onReview}
     warning
    />
    <RoundStudyButton
     icon={Check}
     label="Đã nhớ"
     onClick={onRemember}
     success
    />
   </div>
  </div>
 );
}

function RoundStudyButton({
 icon: Icon,
 label,
 onClick,
 primary,
 danger,
 warning,
 success,
}: {
 icon: LucideIcon;
 label: string;
 onClick: () => void;
 primary?: boolean;
 danger?: boolean;
 warning?: boolean;
 success?: boolean;
}) {
 return (
  <button
   type="button"
   title={label}
   onClick={onClick}
   className={cn(
    "flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-theme-md transition hover:-translate-y-0.5 md:h-16 md:w-16",
    primary && "text-blue-900",
    danger && "text-red-400",
    warning && "text-yellow-500",
    success && "text-emerald-600",
    !primary && !danger && !warning && !success && "text-stone-900",
   )}
  >
   <Icon
    className="h-7 w-7 md:h-8 md:w-8"
    fill={primary ? "currentColor" : "none"}
   />
  </button>
 );
}

function FlashcardFocusMode({
 activeEntry,
 cardIndex,
 total,
 revealed,
 frontMode,
 showExamples,
 onReveal,
 onSpeak,
 onEdit,
 onAgain,
 onReview,
 onRemember,
 onPrevious,
 onSelectCard,
 entries,
}: Parameters<typeof FlashcardMode>[0] & {
 onSelectCard: (index: number) => void;
 entries: VocabEntryWithProgress[];
}) {
 const nextDisabled = total <= 1;

 return (
  <div className="mx-auto flex w-full max-w-7xl flex-col justify-center rounded-[24px] border-2 border-stone-100 bg-stone-50 md:rounded-[28px] md:px-6 md:py-4">
   <div className="relative mx-auto w-full max-w-6xl">
    <div className="absolute inset-4 hidden rotate-[-4deg] rounded-[36px] border-2 border-stone-100 bg-white/70 sm:block" />
    <div className="absolute inset-4 hidden rotate-3 rounded-[36px] border-2 border-stone-100 bg-white/80 sm:block" />
    <div
     className={cn(
      "relative flex flex-col rounded-[26px] border-2 border-stone-100 bg-white shadow-theme-md md:rounded-[36px] md:p-7",
      revealed
       ? "min-h-[520px] md:h-[calc(100dvh-245px)] md:max-h-[820px]"
       : "h-[calc(100dvh-315px)] min-h-[360px] max-h-[620px] sm:min-h-[460px] md:h-[calc(100dvh-245px)] md:max-h-[820px]",
     )}
    >
     {!revealed ? (
      <button
       type="button"
       onClick={onReveal}
       className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[22px] bg-stone-50/70 px-3 py-6 transition hover:bg-stone-50 md:rounded-[28px] md:px-4 md:py-8"
      >
       <h3 className="max-w-full text-center text-[clamp(4.2rem,22vw,8rem)] font-black leading-tight text-red-500 md:text-[clamp(4.5rem,10vw,8rem)]">
        {getFrontText(activeEntry, frontMode)}
       </h3>
      </button>
     ) : (
      <FlashcardBack
       entry={activeEntry}
       onSpeak={onSpeak}
       onEdit={onEdit}
       showExamples={showExamples}
       compact
      />
     )}
    </div>
   </div>

   <div className="mx-auto mt-3 grid w-full max-w-6xl grid-cols-2 gap-2 md:mt-4 md:grid-cols-[1fr_1fr_1.1fr_1.1fr_1.1fr] md:gap-3">
    <button
     type="button"
     onClick={onPrevious}
     disabled={nextDisabled}
     className="h-12 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 disabled:opacity-50"
    >
     ← Trước
    </button>
    <button
     type="button"
     onClick={() => onSelectCard((cardIndex + 1) % total)}
     disabled={nextDisabled}
     className="h-12 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 disabled:opacity-50"
    >
     Tiếp →
    </button>
    <button
     type="button"
     onClick={onAgain}
     className="h-12 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white shadow-theme-sm hover:bg-rose-700"
    >
     Học lại
    </button>
    <button
     type="button"
     onClick={onReview}
     className="h-12 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-theme-sm hover:bg-orange-600"
    >
     Còn khó
    </button>
    <button
     type="button"
     onClick={onRemember}
     className="col-span-2 h-12 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-theme-sm hover:bg-emerald-700 md:col-span-1"
    >
     Đã biết
    </button>
   </div>
  </div>
 );
}

function QuickWordChips({
 entries,
 activeEntryId,
 onSelect,
 expanded = false,
}: {
 entries: VocabEntryWithProgress[];
 activeEntryId?: string;
 onSelect: (index: number) => void;
 expanded?: boolean;
}) {
 if (!entries.length) return null;
 return (
  <div
   className={cn(
    "text-left",
    !expanded && "mt-5 border-t-2 border-stone-100 pt-4",
   )}
  >
   <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
     Nhảy nhanh
    </p>
    <p className="text-xs font-bold text-stone-400">
     {entries.length} thẻ trong bộ lọc
    </p>
   </div>
   <div
    className={cn(
     "mt-3 flex flex-wrap gap-2 overflow-y-auto pr-1",
     expanded ? "max-h-[70vh]" : "max-h-28",
    )}
   >
    {entries.map((entry, index) => (
     <button
      key={entry.id}
      type="button"
      onClick={() => onSelect(index)}
      className={cn(
       "rounded-full border-2 px-3 py-1.5 text-sm font-black transition",
       entry.id === activeEntryId
        ? "border-red-500 bg-red-500 text-white"
        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
      )}
     >
      {entry.hanzi}
     </button>
    ))}
   </div>
  </div>
 );
}

function FlashcardBack({
 entry,
 onSpeak,
 onEdit,
 compact,
 onReveal,
 showExamples = true,
}: {
 entry: VocabEntryWithProgress;
 onSpeak: () => void;
 onEdit: () => void;
 compact?: boolean;
 onReveal?: () => void;
 showExamples?: boolean;
}) {
 const analysis = entry.ai_analysis;
 const example = getPrimaryExample(entry);
 const examples = (analysis.examples || []).slice(0, 3);
 if (compact) {
  return (
   <div
    className="flex min-h-0 flex-1 flex-col gap-3 overflow-visible px-1 py-2 md:overflow-hidden md:py-3"
    onClick={onReveal}
   >
    <div className="grid min-h-0 flex-1 gap-3 overflow-visible text-left md:overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
     <section className="flex min-h-0 flex-col gap-3 overflow-visible rounded-[22px] bg-stone-50/70 p-3 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent] md:overflow-y-auto md:rounded-[26px] md:p-5">
      <div className="text-center lg:text-left">
       <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center">
        <h3 className="whitespace-nowrap text-[clamp(4rem,20vw,5.6rem)] font-black leading-none text-red-500 md:text-[clamp(3rem,7vw,5.6rem)]">
         {entry.hanzi}
        </h3>
        <p className="text-center text-xl font-black leading-tight text-stone-900 md:text-2xl lg:mt-3 lg:text-left">
         {entry.pinyin}
         {entry.sino_vietnamese || analysis.han_viet
          ? ` - ${(entry.sino_vietnamese || analysis.han_viet || "").toUpperCase()}`
          : ""}
        </p>
       </div>
       <p className="mt-3 text-base font-black leading-7 text-stone-800 md:text-lg">
        {getMeaning(entry)}
       </p>
       <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
        {entry.word_type && (
         <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-700 shadow-theme-sm">
          {entry.word_type}
         </span>
        )}
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 shadow-theme-sm">
         Level {getFlashLevel(entry)}
        </span>
       </div>
      </div>

      {analysis.decomposition && (
       <section className="rounded-[20px] bg-yellow-50 p-3 text-sm font-bold leading-6 text-stone-700 md:rounded-[22px] md:p-4">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-orange-600">
         Chiết tự
        </p>
        {analysis.decomposition}
       </section>
      )}

      {!!analysis.collocations?.length && (
       <section className="rounded-[20px] bg-white p-3 shadow-theme-sm md:rounded-[22px] md:p-4">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Cụm hay gặp
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
         {analysis.collocations.map((item) => (
          <span
           key={item}
           className="rounded-full bg-stone-50 px-3 py-1 text-sm font-black text-stone-700"
          >
           {item}
          </span>
         ))}
        </div>
       </section>
      )}
      {getCompactNote(entry) && (
       <section className="rounded-[22px] bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-blue-500">
         Lưu ý nhanh
        </p>
        {getCompactNote(entry)}
       </section>
      )}
     </section>

     <section className="flex min-h-0 flex-col gap-3 overflow-visible pr-0 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent] md:overflow-y-auto md:pr-1">
      {showExamples && examples.length ? (
       <section className="rounded-[22px] bg-stone-50 p-3 md:rounded-[24px] md:p-5">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Ví dụ chính
        </p>
        <div className="mt-2 space-y-3">
         {examples.map((item, index) => (
          <div
           key={`${item.zh}-${index}`}
           className={cn(
            "rounded-[18px] bg-white p-3 shadow-theme-sm",
            index === 0 && "border-2 border-stone-100",
           )}
          >
           <p
            className={cn(
             "font-black leading-7 text-stone-900",
             index === 0 ? "text-base md:text-xl" : "text-sm md:text-base",
            )}
           >
            {index === 0 && <Volume2 className="mr-2 inline h-5 w-5" />}
            {item.zh}
           </p>
           <p className="mt-1 text-sm font-bold leading-6 text-stone-500">
            {item.pinyin}
           </p>
           <p className="mt-1 text-sm font-bold leading-6 text-stone-800 md:text-base md:leading-7">
            {item.vi}
           </p>
           {item.note && (
            <p className="mt-2 rounded-2xl bg-stone-50 p-2 text-xs font-bold leading-5 text-stone-600">
             {item.note}
            </p>
           )}
          </div>
         ))}
        </div>
       </section>
      ) : (
       <section className="rounded-[22px] bg-stone-50 p-4 text-sm font-bold text-stone-500">
        Bật ví dụ trong bộ lọc nếu muốn luyện câu mẫu ở mặt sau.
       </section>
      )}
      {!!analysis.comparisons?.length && (
       <section className="rounded-[22px] bg-stone-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         So sánh nhanh
        </p>
        <ul className="mt-2 space-y-2 text-sm font-bold leading-6 text-stone-700">
         {analysis.comparisons.map((comparison) => (
          <li key={comparison}>{comparison}</li>
         ))}
        </ul>
       </section>
      )}
      {analysis.cultural_note && (
       <section className="rounded-[22px] bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-emerald-600">
         Trung Việt
        </p>
        {analysis.cultural_note}
       </section>
      )}
     </section>
    </div>
   </div>
  );
 }
 return (
  <div className="mx-auto mt-6 grid w-full gap-4 text-left xl:grid-cols-[0.9fr_1.1fr]">
   <div className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
    <div className="flex items-start justify-between gap-3">
     <div>
      <p className="text-2xl font-black text-red-500">{entry.pinyin}</p>
      {(entry.sino_vietnamese || analysis.han_viet) && (
       <p className="mt-1 text-sm font-black text-stone-500">
        Hán Việt: {entry.sino_vietnamese || analysis.han_viet}
       </p>
      )}
     </div>
     <div className="flex gap-2">
      <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
      <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
     </div>
    </div>
    {entry.word_type && (
     <span className="mt-4 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
      {entry.word_type}
     </span>
    )}
    <p className="mt-4 text-lg font-black leading-8 text-stone-800">
     {getMeaning(entry)}
    </p>
    {analysis.decomposition && (
     <div className="mt-4 rounded-2xl bg-yellow-50 p-3">
      <p className="text-xs font-black uppercase text-orange-600">Chiết tự</p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-700">
       {analysis.decomposition}
      </p>
     </div>
    )}
   </div>

   <div className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
    {!!analysis.collocations?.length && (
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
       Cụm hay gặp
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
       {analysis.collocations.slice(0, 4).map((collocation) => (
        <span
         key={collocation}
         className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-700"
        >
         {collocation}
        </span>
       ))}
      </div>
     </div>
    )}
    {showExamples && example && (
     <div className="mt-5 rounded-2xl bg-stone-50 p-4">
      <p className="text-sm font-black leading-6 text-stone-900">
       {example.zh}
      </p>
      <p className="mt-1 text-xs font-bold text-red-500">{example.pinyin}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
       {example.vi}
      </p>
      {example.note && (
       <p className="mt-2 text-xs font-bold leading-5 text-stone-500">
        → {example.note}
       </p>
      )}
     </div>
    )}
    {(analysis.usage_note || analysis.cultural_note) && (
     <div className="mt-5 grid gap-2">
      {analysis.usage_note && (
       <p className="rounded-2xl bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-700">
        Lưu ý: {analysis.usage_note}
       </p>
      )}
      {analysis.cultural_note && (
       <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-700">
        Trung Việt: {analysis.cultural_note}
       </p>
      )}
     </div>
    )}
    <Link
     href={`/dictionary/${encodeURIComponent(entry.hanzi)}`}
     className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     Xem đủ 7 phần
     <ChevronRight className="h-4 w-4" />
    </Link>
   </div>
  </div>
 );
}

function VocabListStudyMode({
 entries,
 activeEntryId,
 onSelect,
 onEdit,
}: {
 entries: VocabEntryWithProgress[];
 activeEntryId?: string;
 onSelect: (index: number) => void;
 onEdit: () => void;
}) {
 return (
  <div className="mx-auto w-full max-w-6xl text-left">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-red-500">
      Danh sách từ
     </p>
     <h3 className="mt-1 text-2xl font-black text-stone-900">
      {entries.length} thẻ trong bộ lọc
     </h3>
    </div>
    <ActionButton onClick={onEdit} icon={Edit3} tone="neutral">
     Sửa thẻ đang chọn
    </ActionButton>
   </div>
   <div className="mt-4 grid max-h-[min(620px,65dvh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
    {entries.map((entry, index) => {
     const active = entry.id === activeEntryId;
     const example = getPrimaryExample(entry);
     return (
      <button
       key={entry.id}
       type="button"
       onClick={() => onSelect(index)}
       className={cn(
        "rounded-[22px] border-2 bg-white p-4 text-left shadow-theme-sm transition hover:border-red-300",
        active ? "border-red-500 bg-red-50/50" : "border-stone-200",
       )}
      >
       <div className="flex items-start justify-between gap-3">
        <div>
         <p className="text-3xl font-black leading-none text-red-500">
          {entry.hanzi}
         </p>
         <p className="mt-2 text-sm font-black text-stone-900">
          {entry.pinyin}
          {entry.sino_vietnamese ? ` - ${entry.sino_vietnamese}` : ""}
         </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black text-stone-600">
         {getFlashStatus(entry)}
        </span>
       </div>
       <p className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-stone-700">
        {getMeaning(entry)}
       </p>
       {example && (
        <p className="mt-3 line-clamp-2 rounded-2xl bg-stone-50 p-2 text-xs font-bold leading-5 text-stone-500">
         {example.zh} · {example.vi}
        </p>
       )}
      </button>
     );
    })}
   </div>
  </div>
 );
}

function ExamplesMode({
 activeEntry,
 cardIndex,
 total,
 onPrevious,
 onNext,
 onSpeak,
 onEdit,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 onPrevious: () => void;
 onNext: () => void;
 onSpeak: () => void;
 onEdit: () => void;
}) {
 const examples = (activeEntry.ai_analysis.examples || []).slice(0, 3);
 return (
  <div className="mx-auto w-full max-w-5xl text-left">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mt-5 rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm md:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-red-500">
       Luyện câu ví dụ
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
       <h3 className="text-5xl font-black leading-none text-red-500 md:text-6xl">
        {activeEntry.hanzi}
       </h3>
       <div>
        <p className="text-xl font-black text-stone-900">
         {activeEntry.pinyin}
        </p>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {getMeaning(activeEntry)}
        </p>
       </div>
      </div>
     </div>
     <div className="flex gap-2">
      <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
      <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
     </div>
    </div>

    <div className="mt-5 grid gap-3">
     {examples.length ? (
      examples.map((example, index) => (
       <article
        key={`${example.zh}-${index}`}
        className="rounded-[22px] border-2 border-stone-100 bg-stone-50 p-4 md:p-5"
       >
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Ví dụ {index + 1}
        </p>
        <p className="mt-2 text-xl font-black leading-8 text-stone-900">
         {example.zh}
        </p>
        {example.pinyin && (
         <p className="mt-2 text-sm font-bold leading-6 text-red-500">
          {example.pinyin}
         </p>
        )}
        {example.vi && (
         <p className="mt-2 text-base font-bold leading-7 text-stone-700">
          {example.vi}
         </p>
        )}
        {example.note && (
         <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-stone-600">
          {example.note}
         </p>
        )}
       </article>
      ))
     ) : (
      <EmptyState
       title="Từ này chưa có ví dụ"
       description="Mở drawer sửa từ để thêm câu ví dụ vào 7 phần dữ liệu."
       compact
      />
     )}
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
     <ActionButton onClick={onPrevious} tone="neutral">
      ← Trước
     </ActionButton>
     <ActionButton onClick={onNext}>Tiếp →</ActionButton>
    </div>
   </div>
  </div>
 );
}

function GuessMode({
 activeEntry,
 cardIndex,
 total,
 guessInput,
 guessState,
 hintLevel,
 onGuessInputChange,
 onCheckGuess,
 onHint,
 onSpeak,
 onAgain,
 onReview,
 onRemember,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 guessInput: string;
 guessState: "idle" | "correct" | "wrong";
 hintLevel: number;
 onGuessInputChange: (value: string) => void;
 onCheckGuess: () => void;
 onHint: () => void;
 onSpeak: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
}) {
 const example = getPrimaryExample(activeEntry);
 const hiddenExample = example?.zh?.replaceAll(activeEntry.hanzi, "____");
 const hints = [
  `${activeEntry.hanzi.length} chữ Hán`,
  activeEntry.pinyin ? `Pinyin: ${activeEntry.pinyin}` : "",
  activeEntry.sino_vietnamese ? `Hán Việt: ${activeEntry.sino_vietnamese}` : "",
  activeEntry.hanzi ? `Chữ đầu: ${activeEntry.hanzi.slice(0, 1)}` : "",
 ].filter(Boolean);
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    <p className="mt-4 text-sm font-black uppercase tracking-wide text-stone-500">
     Định nghĩa
    </p>
    <p className="mx-auto mt-2 max-w-2xl text-2xl font-black leading-9 text-red-500">
     {getMeaning(activeEntry)}
    </p>
    {hiddenExample && (
     <div className="mx-auto mt-5 max-w-2xl rounded-2xl bg-stone-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-stone-500">
       Ví dụ
      </p>
      <p className="mt-2 text-base font-black leading-7 text-stone-800">
       {hiddenExample}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-500">{example?.vi}</p>
     </div>
    )}
    {hintLevel > 0 && (
     <div className="mx-auto mt-5 max-w-lg rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-orange-600">
       Gợi ý
      </p>
      <ul className="mt-2 space-y-1 text-sm font-bold text-stone-700">
       {hints.slice(0, hintLevel).map((hint) => (
        <li key={hint}>• {hint}</li>
       ))}
      </ul>
     </div>
    )}
    {guessState !== "idle" && (
     <div
      className={cn(
       "mx-auto mt-5 max-w-lg rounded-2xl border-2 p-4",
       guessState === "correct"
        ? "border-emerald-300 bg-emerald-50"
        : "border-red-300 bg-red-50",
      )}
     >
      <p className="text-sm font-black text-stone-800">
       Đáp án: {activeEntry.hanzi} · {activeEntry.pinyin}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-600">
       {getMeaning(activeEntry)}
      </p>
     </div>
    )}
    <form
     className="mx-auto mt-6 max-w-2xl"
     onSubmit={(event) => {
      event.preventDefault();
      onCheckGuess();
     }}
    >
     <Input
      value={guessInput}
      onChange={(event) => onGuessInputChange(event.target.value)}
      placeholder="Nhập Hán tự..."
      disabled={guessState !== "idle"}
      className="h-16 rounded-2xl border-4 border-red-400 bg-white text-center text-2xl font-black text-stone-900 shadow-theme-sm"
     />
     {guessState === "idle" ? (
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
       <ActionButton onClick={onAgain} tone="neutral">
        Không biết
       </ActionButton>
       <ActionButton onClick={onHint} tone="neutral">
        H · Gợi ý
       </ActionButton>
       <ActionButton onClick={onCheckGuess}>Kiểm tra</ActionButton>
      </div>
     ) : (
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
       <ActionButton onClick={onAgain} tone="neutral">
        Chưa nhớ
       </ActionButton>
       <ActionButton onClick={onReview} tone="neutral">
        Cần ôn
       </ActionButton>
       <ActionButton onClick={onRemember}>Đã nhớ</ActionButton>
      </div>
     )}
    </form>
   </div>
  </div>
 );
}

function QuizMode({
 activeEntry,
 mode,
 cardIndex,
 total,
 quizOptions,
 selectedAnswerId,
 answerChecked,
 onChooseAnswer,
 onContinueQuiz,
 onSpeak,
}: {
 activeEntry: VocabEntryWithProgress;
 mode: "quiz" | "reverse";
 cardIndex: number;
 total: number;
 quizOptions: VocabEntryWithProgress[];
 selectedAnswerId: string | null;
 answerChecked: boolean;
 onChooseAnswer: (entry: VocabEntryWithProgress) => void;
 onContinueQuiz: () => void;
 onSpeak: () => void;
}) {
 const reverse = mode === "reverse";
 const selected = quizOptions.find((entry) => entry.id === selectedAnswerId);
 const correct = selectedAnswerId === activeEntry.id;
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    <h3
     className={cn(
      "mx-auto mt-4 max-w-2xl font-black leading-tight",
      reverse ? "text-6xl text-red-500" : "text-3xl text-blue-500",
     )}
    >
     {reverse ? activeEntry.hanzi : getMeaning(activeEntry)}
    </h3>
    <p className="mt-4 text-lg font-bold text-stone-600">
     {reverse ? activeEntry.pinyin : "Chọn Hán tự đúng"}
    </p>
    <div className="mx-auto mt-8 grid max-w-3xl gap-3">
     {quizOptions.map((option, index) => {
      const isSelected = selectedAnswerId === option.id;
      const isCorrect = option.id === activeEntry.id;
      return (
       <button
        key={option.id}
        type="button"
        onClick={() => onChooseAnswer(option)}
        disabled={answerChecked}
        className={cn(
         "flex min-h-20 items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-theme-sm transition",
         answerChecked && isCorrect && "border-emerald-400 bg-emerald-50",
         answerChecked &&
          isSelected &&
          !isCorrect &&
          "border-red-400 bg-red-50",
         !answerChecked &&
          "border-stone-200 hover:border-red-300 hover:bg-red-50/30",
        )}
       >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-lg font-black text-stone-600">
         {answerLabels[index]}
        </span>
        <span>
         <span className="block text-2xl font-black text-red-500">
          {reverse ? getMeaning(option) : option.hanzi}
         </span>
         <span className="mt-1 block text-sm font-bold leading-6 text-stone-500">
          {reverse
           ? answerChecked
             ? option.hanzi
             : "Chọn nghĩa phù hợp"
           : option.pinyin}
         </span>
         {!reverse && answerChecked && (
          <span className="mt-1 block text-sm font-bold text-stone-500">
           {getMeaning(option)}
          </span>
         )}
        </span>
       </button>
      );
     })}
    </div>
    {answerChecked && (
     <div
      className={cn(
       "mx-auto mt-5 max-w-3xl rounded-2xl border-2 p-4 text-left",
       correct
        ? "border-emerald-300 bg-emerald-50"
        : "border-red-300 bg-red-50",
      )}
     >
      <p className="text-sm font-black text-stone-900">
       {correct ? "Đúng rồi" : `Chưa đúng. Đáp án: ${activeEntry.hanzi}`}
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-600">
       {getMeaning(activeEntry)}
      </p>
      {selected && !correct && (
       <p className="mt-1 text-xs font-bold text-stone-500">
        Bạn chọn: {selected.hanzi} · {getMeaning(selected)}
       </p>
      )}
      <div className="mt-4">
       <ActionButton onClick={onContinueQuiz}>
        {correct ? "Tiếp tục" : "Ghi vào cần ôn"}
       </ActionButton>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

function WriteMode({
 activeEntry,
 cardIndex,
 total,
 writeCharIndex,
 onWriteCharIndexChange,
 onSpeak,
 onAgain,
 onReview,
 onRemember,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 writeCharIndex: number;
 onWriteCharIndexChange: (index: number) => void;
 onSpeak: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
}) {
 const characters = getStudyCharacters(activeEntry);
 const activeChar =
  characters[writeCharIndex] || characters[0] || activeEntry.hanzi.slice(0, 1);
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <h3 className="text-5xl font-black text-red-500 md:text-6xl">
     {activeEntry.hanzi}
    </h3>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-lg font-black text-stone-600">
     <span>{activeEntry.pinyin}</span>
     <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    </div>
    <p className="mx-auto mt-3 max-w-2xl text-lg font-bold leading-8 text-stone-600">
     {getMeaning(activeEntry)}
    </p>
    <div className="mt-7 flex flex-wrap justify-center gap-2">
     {characters.map((character, index) => (
      <button
       key={`${character}-${index}`}
       type="button"
       onClick={() => onWriteCharIndexChange(index)}
       className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-xl font-black shadow-theme-sm",
        index === writeCharIndex
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
       )}
      >
       {character}
      </button>
     ))}
    </div>
    <div className="mx-auto mt-6 flex justify-center">
     <CharacterWriterCard character={activeChar} />
    </div>
    <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
     <ActionButton onClick={onAgain} tone="neutral">
      Chưa nhớ
     </ActionButton>
     <ActionButton onClick={onReview} tone="neutral">
      Cần ôn
     </ActionButton>
     <ActionButton onClick={onRemember}>Đã nhớ</ActionButton>
    </div>
   </div>
  </div>
 );
}

function StatBox({
 value,
 label,
 tone,
}: {
 value: number;
 label: string;
 tone: "yellow" | "blue" | "green";
}) {
 const className = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return (
  <div
   className={cn(
    "min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm",
    className,
   )}
  >
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
  </div>
 );
}

function AllWordsWorkspace({
 entries,
 lessons,
 searchQuery,
 wordFilter,
 onSearchChange,
 onFilterChange,
 onEdit,
 onAddEntry,
}: {
 entries: VocabEntryWithProgress[];
 lessons: VocabLessonWithStats[];
 searchQuery: string;
 wordFilter: WordFilter;
 onSearchChange: (value: string) => void;
 onFilterChange: (filter: WordFilter) => void;
 onEdit: (entry: VocabEntryWithProgress) => void;
 onAddEntry: () => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Tổng hợp
     </p>
     <h2 className="text-3xl font-black text-stone-900">Tất cả từ vựng</h2>
     <p className="mt-2 text-sm font-bold text-stone-500">
      {entries.length} thẻ đang hiển thị · {lessons.length} bài
     </p>
    </div>
    <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
     <div className="relative min-w-0 flex-1">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
      <Input
       value={searchQuery}
       onChange={(event) => onSearchChange(event.target.value)}
       placeholder="Tìm Hán tự, pinyin, nghĩa..."
       className="h-12 rounded-2xl border-2 border-stone-200 bg-white pl-12 text-base font-bold"
      />
     </div>
     <ActionButton onClick={onAddEntry} icon={Plus}>
      Thêm từ
     </ActionButton>
    </div>
   </div>
   <FilterBar value={wordFilter} onChange={onFilterChange} />
   <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
    {entries.map((entry) => (
     <WordCard key={entry.id} entry={entry} onEdit={() => onEdit(entry)} />
    ))}
   </div>
  </section>
 );
}

function FilterBar({
 value,
 onChange,
}: {
 value: WordFilter;
 onChange: (filter: WordFilter) => void;
}) {
 const filters: { key: WordFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Đang học" },
  { key: "learning", label: "Đang ôn" },
  { key: "mastered", label: "Thành thạo" },
  { key: "examples", label: "Có ví dụ" },
  { key: "missing", label: "Thiếu dữ liệu" },
 ];
 return (
  <div className="mt-5 flex flex-wrap gap-2">
   {filters.map((filter) => (
    <button
     key={filter.key}
     type="button"
     onClick={() => onChange(filter.key)}
     className={cn(
      "h-9 rounded-xl border-2 px-3 text-xs font-black transition",
      value === filter.key
       ? "border-red-500 bg-red-500 text-white"
       : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
     )}
    >
     {filter.label}
    </button>
   ))}
  </div>
 );
}

function WordCard({
 entry,
 onEdit,
}: {
 entry: VocabEntryWithProgress;
 onEdit: () => void;
}) {
 return (
  <article className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <Link
     href={`/dictionary/${encodeURIComponent(entry.hanzi)}`}
     className="min-w-0"
    >
     <h3 className="truncate text-3xl font-black text-stone-900">
      {entry.hanzi}
     </h3>
     <p className="mt-1 truncate text-sm font-black text-red-500">
      {entry.pinyin}
     </p>
    </Link>
    <StatusPill status={entry.status} />
   </div>
   <p className="mt-3 line-clamp-2 min-h-11 text-sm font-bold leading-6 text-stone-600">
    {getMeaning(entry)}
   </p>
   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
     {entry.source.lessonKey} · {entry.category || "Bổ sung"}
    </span>
    <button
     type="button"
     onClick={onEdit}
     className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-stone-600 hover:bg-stone-100"
    >
     <PenLine className="h-4 w-4" />
     Sửa
    </button>
   </div>
  </article>
 );
}

function StatusPill({ status }: { status: VocabEntryWithProgress["status"] }) {
 const className = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return (
  <span
   className={cn(
    "rounded-full border-2 px-2.5 py-1 text-xs font-black",
    className,
   )}
  >
   {label}
  </span>
 );
}

function LessonEditWorkspace({
 lessons,
 onEditLesson,
 onEditEntry,
 onAddLesson,
 onAddEntry,
 onImportLesson,
}: {
 lessons: VocabLessonWithStats[];
 onEditLesson: (lesson: VocabLessonWithStats) => void;
 onEditEntry: (entry: VocabEntryWithProgress) => void;
 onAddLesson: () => void;
 onAddEntry: (lesson: VocabLessonWithStats) => void;
 onImportLesson: (lesson: VocabLessonWithStats) => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Quản lý bài
     </p>
     <h2 className="text-3xl font-black text-stone-900">Chỉnh sửa bài</h2>
    </div>
    <ActionButton onClick={onAddLesson} icon={Plus}>
     Thêm bài
    </ActionButton>
   </div>
   <div className="mt-5 grid gap-4">
    {lessons.map((lesson) => (
     <article
      key={lesson.id}
      className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm"
     >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
       <div>
        <h3 className="text-2xl font-black text-stone-900">{lesson.title}</h3>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {lesson.lesson_key} · {lesson.entries.length} từ · order{" "}
         {lesson.lesson_order}
        </p>
       </div>
       <div className="flex flex-wrap gap-2">
        <ActionButton
         onClick={() => onAddEntry(lesson)}
         tone="neutral"
         icon={Plus}
        >
         Thêm từ
        </ActionButton>
        <ActionButton
         onClick={() => onImportLesson(lesson)}
         tone="neutral"
         icon={Upload}
        >
         Import bài
        </ActionButton>
        <ActionButton
         onClick={() => onEditLesson(lesson)}
         tone="neutral"
         icon={PenLine}
        >
         Sửa bài
        </ActionButton>
       </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
       {lesson.entries.slice(0, 12).map((entry) => (
        <button
         key={entry.id}
         type="button"
         onClick={() => onEditEntry(entry)}
         className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-3 text-left hover:bg-white"
        >
         <span className="block text-lg font-black text-stone-900">
          {entry.hanzi}
         </span>
         <span className="block truncate text-xs font-bold text-stone-500">
          {getMeaning(entry)}
         </span>
        </button>
       ))}
      </div>
     </article>
    ))}
   </div>
  </section>
 );
}

function ImportLessonDrawer({
 lesson,
 onClose,
 onImport,
}: {
 lesson: VocabLessonWithStats;
 onClose: () => void;
 onImport: (entries: ImportedEntryDraft[]) => void;
}) {
 const [mode, setMode] = useState<ImportMode>("paste");
 const [pasteText, setPasteText] = useState("");
 const [manual, setManual] = useState<ImportedEntryDraft>(() =>
  createManualEntryDraft(lesson),
 );
 const parsedEntries = useMemo(
  () => parseMarkdownVocabEntries(pasteText, lesson),
  [lesson, pasteText],
 );
 const manualReady = Boolean(manual.hanzi.trim() && manual.meaning.trim());

 const updateManual = (
  patch: Partial<ImportedEntryDraft>,
  analysisPatch?: Partial<AiAnalysis>,
 ) => {
  setManual((current) => ({
   ...current,
   ...patch,
   ai_analysis: {
    ...current.ai_analysis,
    ...analysisPatch,
    ...(patch.hanzi !== undefined ? { hanzi: patch.hanzi } : {}),
    ...(patch.pinyin !== undefined ? { pinyin: patch.pinyin } : {}),
    ...(patch.sino_vietnamese !== undefined
     ? {
        sino_vietnamese: patch.sino_vietnamese,
        han_viet: patch.sino_vietnamese,
       }
     : {}),
    ...(patch.meaning !== undefined ? { meaning_summary: patch.meaning } : {}),
    ...(patch.word_type !== undefined ? { word_type: patch.word_type } : {}),
    source_metadata: {
     ...current.ai_analysis.source_metadata,
     ...(patch.category !== undefined ? { category: patch.category } : {}),
    },
   },
  }));
 };

 return (
  <Drawer title={`Import vào ${lesson.title}`} onClose={onClose}>
   <div className="grid gap-5">
    <div className="grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
     {[
      { key: "paste" as const, label: "Paste nhiều từ" },
      { key: "manual" as const, label: "Nhập tay 1 từ" },
     ].map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => setMode(item.key)}
       className={cn(
        "h-10 rounded-xl text-sm font-black transition",
        mode === item.key
         ? "bg-white text-red-500 shadow-theme-sm"
         : "text-stone-500 hover:text-stone-900",
       )}
      >
       {item.label}
      </button>
     ))}
    </div>

    {mode === "paste" ? (
     <>
      <Field label="Dán block markdown từ AI">
       <Textarea
        value={pasteText}
        onChange={setPasteText}
        rows={14}
        placeholder={
         "## 算命 – suànmìng – Toán mệnh – Bói toán, xem bói\n*Động từ 【动】*\n\n**1. Hán Việt & Liên hệ Tiếng Việt**\n..."
        }
       />
      </Field>
      <div className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-4">
       <p className="text-sm font-black text-stone-900">
        Preview: {parsedEntries.length} từ hợp lệ
       </p>
       <div className="mt-3 max-h-44 overflow-y-auto space-y-2">
        {parsedEntries.slice(0, 8).map((entry) => (
         <div
          key={`${entry.hanzi}-${entry.row_number}`}
          className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-stone-700"
         >
          <span className="font-black text-red-500">{entry.hanzi}</span> ·{" "}
          {entry.pinyin} · {entry.meaning}
         </div>
        ))}
       </div>
      </div>
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
       <ActionButton onClick={onClose} tone="neutral">
        Huỷ
       </ActionButton>
       <ActionButton onClick={() => onImport(parsedEntries)} icon={Upload}>
        Import {parsedEntries.length} từ
       </ActionButton>
      </div>
     </>
    ) : (
     <>
      <div className="grid gap-4 md:grid-cols-2">
       <Field label="Hán tự">
        <Input
         value={manual.hanzi}
         onChange={(event) => updateManual({ hanzi: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Pinyin">
        <Input
         value={manual.pinyin}
         onChange={(event) => updateManual({ pinyin: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Hán Việt">
        <Input
         value={manual.sino_vietnamese || ""}
         onChange={(event) =>
          updateManual({ sino_vietnamese: event.target.value })
         }
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Loại từ">
        <Input
         value={manual.word_type || ""}
         onChange={(event) => updateManual({ word_type: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Category">
        <Input
         value={manual.category || ""}
         onChange={(event) => updateManual({ category: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Row">
        <Input
         type="number"
         value={manual.row_number || ""}
         onChange={(event) =>
          updateManual({ row_number: Number(event.target.value) })
         }
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
      </div>
      <Field label="Nghĩa ngắn">
       <Input
        value={manual.meaning}
        onChange={(event) =>
         updateManual(
          { meaning: event.target.value },
          { meaning_detail: event.target.value },
         )
        }
        className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
       />
      </Field>
      <Field label="Chiết tự">
       <Textarea
        value={manual.ai_analysis.decomposition || ""}
        onChange={(value) => updateManual({}, { decomposition: value })}
       />
      </Field>
      <Field label="So sánh gần nghĩa">
       <Textarea
        value={lineText(manual.ai_analysis.comparisons)}
        onChange={(value) =>
         updateManual({}, { comparisons: parseLines(value) })
        }
       />
      </Field>
      <Field label="Cụm từ cố định">
       <Textarea
        value={lineText(manual.ai_analysis.collocations)}
        onChange={(value) =>
         updateManual({}, { collocations: parseLines(value) })
        }
       />
      </Field>
      <Field label="Ví dụ: zh | pinyin | vi | note">
       <Textarea
        value={examplesToText(manual.ai_analysis.examples)}
        onChange={(value) =>
         updateManual({}, { examples: textToExamples(value) })
        }
        rows={6}
       />
      </Field>
      <Field label="Văn hoá / Trung Việt">
       <Textarea
        value={manual.ai_analysis.cultural_note || ""}
        onChange={(value) => updateManual({}, { cultural_note: value })}
       />
      </Field>
      <Field label="Lưu ý">
       <Textarea
        value={manual.ai_analysis.usage_note || ""}
        onChange={(value) => updateManual({}, { usage_note: value })}
       />
      </Field>
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
       <ActionButton onClick={onClose} tone="neutral">
        Huỷ
       </ActionButton>
       <ActionButton
        onClick={() => onImport([manual])}
        icon={Plus}
        disabled={!manualReady}
       >
        Thêm từ
       </ActionButton>
      </div>
     </>
    )}
   </div>
  </Drawer>
 );
}

function createManualEntryDraft(
 lesson: VocabLessonWithStats,
): ImportedEntryDraft {
 const category = lesson.categories[0]?.name || "Bổ sung";
 const rowNumber = lesson.entries.length + 1;
 return {
  hanzi: "",
  pinyin: "",
  sino_vietnamese: "",
  meaning: "",
  word_type: "",
  category,
  row_number: rowNumber,
  ai_analysis: {
   hanzi: "",
   pinyin: "",
   meaning_summary: "",
   meaning_detail: "",
   source_metadata: {
    lesson_key: lesson.lesson_key,
    lesson_number: lesson.lesson_number,
    lesson_title: lesson.title,
    row_number: rowNumber,
    category,
   },
  },
 };
}

function EntryEditDrawer({
 entry,
 lessons,
 onClose,
 onSave,
 onDelete,
}: {
 entry: VocabEntryWithProgress;
 lessons: VocabLessonWithStats[];
 onClose: () => void;
 onSave: (entry: VocabEntryWithProgress, analysis: AiAnalysis) => void;
 onDelete: (entry: VocabEntryWithProgress) => void;
}) {
 const [draft, setDraft] = useState(entry);
 const [analysis, setAnalysis] = useState<AiAnalysis>(entry.ai_analysis);
 const [examplesText, setExamplesText] = useState(
  examplesToText(entry.ai_analysis.examples),
 );
 const [collocationsText, setCollocationsText] = useState(
  lineText(entry.ai_analysis.collocations),
 );
 const [comparisonsText, setComparisonsText] = useState(
  lineText(entry.ai_analysis.comparisons),
 );

 const updateAnalysis = (patch: Partial<AiAnalysis>) =>
  setAnalysis((current) => ({ ...current, ...patch }));
 const save = () => {
  const selectedLesson = lessons.find(
   (lesson) => lesson.id === draft.lesson_id,
  );
  const nextAnalysis: AiAnalysis = {
   ...analysis,
   hanzi: draft.hanzi,
   pinyin: draft.pinyin,
   sino_vietnamese: draft.sino_vietnamese,
   han_viet: draft.sino_vietnamese || analysis.han_viet,
   meaning_summary: draft.meaning,
   word_type: draft.word_type,
   collocations: parseLines(collocationsText),
   comparisons: parseLines(comparisonsText),
   examples: textToExamples(examplesText),
   source_metadata: {
    ...analysis.source_metadata,
    ...(selectedLesson
     ? {
        lesson_key: selectedLesson.lesson_key,
        lesson_number: selectedLesson.lesson_number,
        lesson_title: selectedLesson.title,
       }
     : {}),
    row_number: draft.row_number,
    category: draft.category,
   },
  };
  onSave(draft, nextAnalysis);
 };

 return (
  <Drawer
   title={entry.id.startsWith("new-") ? "Thêm từ mới" : `Sửa từ ${entry.hanzi}`}
   onClose={onClose}
  >
   <div className="grid gap-4">
    <Field label="Bài">
     <Select
      value={draft.lesson_id}
      onChange={(event) => {
       const nextLesson = lessons.find(
        (lesson) => lesson.id === event.target.value,
       );
       setDraft({
        ...draft,
        lesson_id: event.target.value,
        course_id: nextLesson?.course_id || draft.course_id,
        row_number: nextLesson
         ? nextLesson.entries.length + 1
         : draft.row_number,
        source: nextLesson
         ? {
            ...draft.source,
            lessonKey: nextLesson.lesson_key,
            lessonNumber: nextLesson.lesson_number,
            lessonTitle: nextLesson.title,
            rowNumber: nextLesson.entries.length + 1,
           }
         : draft.source,
       });
      }}
      className="h-11 text-sm"
     >
      {lessons.map((lesson) => (
       <option key={lesson.id} value={lesson.id}>
        {lesson.title}
       </option>
      ))}
     </Select>
    </Field>
    <Field label="Row trong bài">
     <Input
      type="number"
      value={draft.row_number}
      onChange={(event) =>
       setDraft({ ...draft, row_number: Number(event.target.value) })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Hán tự">
     <Input
      value={draft.hanzi}
      onChange={(event) => setDraft({ ...draft, hanzi: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 bg-white font-bold"
     />
    </Field>
    <Field label="Pinyin">
     <Input
      value={draft.pinyin}
      onChange={(event) => setDraft({ ...draft, pinyin: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Hán Việt">
     <Input
      value={draft.sino_vietnamese || ""}
      onChange={(event) =>
       setDraft({ ...draft, sino_vietnamese: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Nghĩa ngắn">
     <Input
      value={draft.meaning}
      onChange={(event) => setDraft({ ...draft, meaning: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Loại từ">
     <Input
      value={draft.word_type || ""}
      onChange={(event) =>
       setDraft({ ...draft, word_type: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Category">
     <Input
      value={draft.category || ""}
      onChange={(event) => setDraft({ ...draft, category: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Nghĩa chi tiết">
     <Textarea
      value={analysis.meaning_detail || ""}
      onChange={(value) => updateAnalysis({ meaning_detail: value })}
     />
    </Field>
    <Field label="Chiết tự">
     <Textarea
      value={analysis.decomposition || ""}
      onChange={(value) => updateAnalysis({ decomposition: value })}
     />
    </Field>
    <Field label="So sánh gần nghĩa">
     <Textarea value={comparisonsText} onChange={setComparisonsText} />
    </Field>
    <Field label="Cụm từ cố định">
     <Textarea value={collocationsText} onChange={setCollocationsText} />
    </Field>
    <Field label="Ví dụ: zh | pinyin | vi | note">
     <Textarea value={examplesText} onChange={setExamplesText} rows={7} />
    </Field>
    <Field label="Văn hoá / Trung Việt">
     <Textarea
      value={analysis.cultural_note || ""}
      onChange={(value) => updateAnalysis({ cultural_note: value })}
     />
    </Field>
    <Field label="Lưu ý">
     <Textarea
      value={analysis.usage_note || ""}
      onChange={(value) => updateAnalysis({ usage_note: value })}
     />
    </Field>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!entry.id.startsWith("new-") && (
      <ActionButton
       onClick={() => onDelete(entry)}
       tone="neutral"
       icon={Trash2}
      >
       Xoá từ
      </ActionButton>
     )}
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton onClick={save}>Lưu từ</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

function LessonEditDrawer({
 lesson,
 onClose,
 onSave,
 onDelete,
}: {
 lesson: VocabLessonWithStats;
 onClose: () => void;
 onSave: (lesson: VocabLessonWithStats) => void;
 onDelete: (lesson: VocabLessonWithStats) => void;
}) {
 const [draft, setDraft] = useState(lesson);
 return (
  <Drawer
   title={lesson.id.startsWith("new-") ? "Thêm bài mới" : "Sửa bài"}
   onClose={onClose}
  >
   <div className="grid gap-4">
    <Field label="Mã bài">
     <Input
      value={draft.lesson_key}
      onChange={(event) =>
       setDraft({ ...draft, lesson_key: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Số bài">
     <Input
      type="number"
      value={draft.lesson_number || ""}
      onChange={(event) =>
       setDraft({
        ...draft,
        lesson_number: event.target.value ? Number(event.target.value) : null,
       })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Tên bài">
     <Input
      value={draft.title}
      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Thứ tự">
     <Input
      type="number"
      value={draft.lesson_order}
      onChange={(event) =>
       setDraft({ ...draft, lesson_order: Number(event.target.value) })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <div className="rounded-2xl bg-stone-50 p-4">
     <p className="text-sm font-black text-stone-700">
      {lesson.entries.length} từ trong bài
     </p>
     <p className="mt-1 text-xs font-bold text-stone-500">
      Có thể chuyển từng từ sang bài khác trong drawer sửa từ. Dùng row number
      để giữ thứ tự học.
     </p>
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!lesson.id.startsWith("new-") && (
      <ActionButton
       onClick={() => onDelete(lesson)}
       tone="neutral"
       icon={Trash2}
      >
       Xoá bài
      </ActionButton>
     )}
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton onClick={() => onSave(draft)}>Lưu bài</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

function Drawer({
 title,
 children,
 onClose,
}: {
 title: string;
 children: React.ReactNode;
 onClose: () => void;
}) {
 return (
  <LearningDrawer title={title} onClose={onClose}>
   {children}
  </LearningDrawer>
 );
}

function Field({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) {
 return (
  <label className="grid gap-2">
   <span className="text-xs font-black uppercase tracking-wide text-stone-500">
    {label}
   </span>
   {children}
  </label>
 );
}

function Textarea({
 value,
 onChange,
 rows = 4,
 placeholder,
}: {
 value: string;
 onChange: (value: string) => void;
 rows?: number;
 placeholder?: string;
}) {
 return (
  <textarea
   value={value}
   rows={rows}
   placeholder={placeholder}
   onChange={(event) => onChange(event.target.value)}
   className="w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-stone-800 outline-none focus:border-red-300"
  />
 );
}

function ShortcutHelp() {
 return (
  <div className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <p className="text-sm font-black uppercase tracking-wide text-stone-500">
    Shortcut
   </p>
   <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-4">
    <span>
     <kbd>Space</kbd> xem/ẩn đáp án
    </span>
    <span>
     <kbd>1</kbd> chưa nhớ
    </span>
    <span>
     <kbd>2</kbd> cần ôn
    </span>
    <span>
     <kbd>3</kbd> đã nhớ
    </span>
    <span>
     <kbd>Enter</kbd> kiểm tra/tiếp
    </span>
    <span>
     <kbd>A-D</kbd> chọn đáp án
    </span>
    <span>
     <kbd>H</kbd> gợi ý
    </span>
    <span>
     <kbd>J/K</kbd> tới/lùi
    </span>
    <span>
     <kbd>S</kbd> phát âm
    </span>
    <span>
     <kbd>?</kbd> ẩn/hiện
    </span>
   </div>
  </div>
 );
}

function EmptyState({
 title,
 description,
 action,
 compact,
}: {
 title: string;
 description: string;
 action?: React.ReactNode;
 compact?: boolean;
}) {
 return (
  <div
   className={cn(
    "flex flex-col items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white p-8 text-center shadow-theme-md",
    compact ? "min-h-64" : "min-h-[520px]",
   )}
  >
   <Sparkles className="h-12 w-12 text-stone-300" />
   <h2 className="mt-4 text-2xl font-black text-stone-900">{title}</h2>
   <p className="mt-2 max-w-md text-sm font-bold leading-6 text-stone-500">
    {description}
   </p>
   {action && <div className="mt-5">{action}</div>}
  </div>
 );
}
