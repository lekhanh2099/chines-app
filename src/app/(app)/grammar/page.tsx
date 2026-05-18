"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
 BookOpen,
 Check,
 CheckCircle2,
 Edit3,
 FileText,
 Layers3,
 Loader2,
 Menu,
 PenLine,
 Plus,
 Search,
 Sparkles,
 SplitSquareHorizontal,
 Trash2,
 Upload,
 X,
 XCircle,
 type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HskLessonPracticeModule } from "@/features/hsk";
import { GrammarSchemaMissingError, useGrammarPoints } from "@/features/grammar/hooks/useGrammarPoints";
import {
 LearningDrawer,
 LessonSelectCard,
 StudySplitLayout,
 type LessonSelectOption,
} from "@/features/learning/components";
import { useVocabEntries, VocabularyMiniList } from "@/features/vocabulary";
import { cn } from "@/lib/utils";
import type {
 DbGrammarExercise,
 GrammarCourseWithLessons,
 GrammarExerciseContent,
 GrammarExerciseType,
 GrammarLessonWithStats,
 GrammarPointContent,
 GrammarPointWithProgress,
 VocabEntryWithProgress,
} from "@/types/database";

type MainTab = "study" | "all" | "edit";
type SplitMode = "theory" | "practice" | "split";
type PointFilter = "all" | "new" | "learning" | "mastered" | "missing";
type ExerciseMode = "mixed" | GrammarExerciseType;
type CoachTab = "logic" | "formula" | "examples" | "traps" | "practice";
type CoachStatusFilter = "all" | "new" | "ok" | "weak";
type CoachOrder = "lesson" | "hard" | "random";
type GrammarSource = "hanyu" | "hsk";

const exerciseLabels: Record<GrammarExerciseType, string> = {
 fill_blank: "Điền từ",
 multiple_choice: "Trắc nghiệm",
 reorder_sentence: "Sắp xếp câu",
 translate_zh: "Dịch Trung",
 identify_error: "Tìm lỗi sai",
};

function isCoursePayload(data: GrammarCourseWithLessons | { course: null; lessons: []; points: []; exercises: [] } | undefined): data is GrammarCourseWithLessons {
 return Boolean(data && "id" in data);
}

function statusFromLevel(level: number): GrammarPointWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

function getPointSubtitle(point: GrammarPointWithProgress) {
 return point.vietnamese_title || point.content.quick_example?.vi || point.category || "Ngữ pháp";
}

function pointHasMissingData(point: GrammarPointWithProgress) {
 return !point.content.explanation || !point.content.structures?.length || !point.content.quick_example?.zh || !point.exercises.length;
}

function matchesPoint(point: GrammarPointWithProgress, query: string) {
 const normalized = query.trim().toLowerCase();
 if (!normalized) return true;
 return (
  point.title.toLowerCase().includes(normalized) ||
  point.hanzi?.toLowerCase().includes(normalized) ||
  point.pinyin?.toLowerCase().includes(normalized) ||
  point.vietnamese_title?.toLowerCase().includes(normalized) ||
  point.category?.toLowerCase().includes(normalized) ||
  point.tags.some((tag) => tag.toLowerCase().includes(normalized))
 );
}

function lessonNumberForPoint(point: GrammarPointWithProgress, lessonById: Map<string, GrammarLessonWithStats>) {
 return point.lesson_id ? lessonById.get(point.lesson_id)?.lesson_number || point.content.source_metadata?.lesson_number || 0 : point.content.source_metadata?.lesson_number || 0;
}

function pointCoachScore(point: GrammarPointWithProgress) {
 if (point.status === "mastered") return 2;
 if (point.status === "learning") return 1;
 return 0;
}

function stablePointHash(value: string) {
 let hash = 0;
 for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) % 9973;
 return hash;
}

function getCoachCore(point: GrammarPointWithProgress) {
 return point.content.core || point.content.explanation || point.vietnamese_title || getPointSubtitle(point);
}

function applyProgress(course: GrammarCourseWithLessons, pointId: string, level: number): GrammarCourseWithLessons {
 const updatePoint = (point: GrammarPointWithProgress): GrammarPointWithProgress =>
  point.id === pointId ? { ...point, proficiency_level: level, status: statusFromLevel(level) } : point;
 const lessons = course.lessons.map((lesson) => {
  const points = lesson.points.map(updatePoint);
  const mastered = points.filter((point) => point.status === "mastered").length;
  const learning = points.filter((point) => point.status === "learning").length;
  const fresh = points.filter((point) => point.status === "new").length;
  return {
   ...lesson,
   points,
   mastered,
   learning,
   fresh,
   progress: points.length ? Math.round((mastered / points.length) * 100) : 0,
  };
 });
 return { ...course, lessons, points: course.points.map(updatePoint) };
}

export default function GrammarPage() {
 const queryClient = useQueryClient();
 const { data, isLoading, error } = useGrammarPoints();
 const { data: vocabData } = useVocabEntries();
 const course = isCoursePayload(data) ? data : null;

 const [activeTab, setActiveTab] = useState<MainTab>("study");
 const [splitMode, setSplitMode] = useState<SplitMode>("split");
 const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
 const [activePointId, setActivePointId] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [filter, setFilter] = useState<PointFilter>("all");
 const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
 const [editingLesson, setEditingLesson] = useState<GrammarLessonWithStats | null>(null);
 const [editingPoint, setEditingPoint] = useState<GrammarPointWithProgress | null>(null);
 const [importingLesson, setImportingLesson] = useState<GrammarLessonWithStats | null>(null);
 const [exerciseIndex, setExerciseIndex] = useState(0);
 const [exerciseMode, setExerciseMode] = useState<ExerciseMode>("mixed");
 const [exerciseAnswer, setExerciseAnswer] = useState("");
 const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
 const [exerciseChecked, setExerciseChecked] = useState(false);
 const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null);
 const [isImportingHanyu, setIsImportingHanyu] = useState(false);
 const [isImportingCoachJson, setIsImportingCoachJson] = useState(false);
 const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
 const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0, wrong: 0 });
 const [coachFromLesson, setCoachFromLesson] = useState(11);
 const [coachToLesson, setCoachToLesson] = useState(25);
 const [coachTag, setCoachTag] = useState("all");
 const [coachStatus, setCoachStatus] = useState<CoachStatusFilter>("all");
 const [coachOrder, setCoachOrder] = useState<CoachOrder>("lesson");
 const [coachTab, setCoachTab] = useState<CoachTab>("logic");
 const [coachIndex, setCoachIndex] = useState(0);
 const [source, setSource] = useState<GrammarSource>("hanyu");

 const lessons = useMemo(() => course?.lessons || [], [course?.lessons]);
 const activeLesson = useMemo(() => lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null, [activeLessonId, lessons]);
 const activePoint = useMemo(
  () => activeLesson?.points.find((point) => point.id === activePointId) || activeLesson?.points[0] || course?.points[0] || null,
  [activeLesson?.points, activePointId, course?.points],
 );
 const activeExercises = useMemo(() => {
  const exercises = activePoint?.exercises || [];
  return exerciseMode === "mixed" ? exercises : exercises.filter((exercise) => exercise.exercise_type === exerciseMode);
 }, [activePoint?.exercises, exerciseMode]);
 const activeExercise = activeExercises[exerciseIndex] || activeExercises[0] || null;
 const lessonVocabulary = useMemo(() => {
  if (!activeLesson || !vocabData || !("entries" in vocabData)) return [];
  return (vocabData.entries || []).filter((entry) => entry.source.lessonNumber === activeLesson.lesson_number).slice(0, 36);
 }, [activeLesson, vocabData]);
 const lessonById = useMemo(() => new Map(lessons.map((lesson) => [lesson.id, lesson])), [lessons]);
 const lessonNumbers = useMemo(
  () => lessons.map((lesson) => lesson.lesson_number).filter((value): value is number => typeof value === "number").sort((a, b) => a - b),
  [lessons],
 );
 const coachTags = useMemo(() => {
  const tags = new Set<string>();
  course?.points.forEach((point) => point.tags.forEach((tag) => {
   if (!/^Bài\s+\d+/i.test(tag) && tag !== "Hán ngữ 2") tags.add(tag);
  }));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
 }, [course?.points]);
 const coachPoints = useMemo(() => {
  const points = [...(course?.points || [])].filter((point) => {
   const lessonNumber = lessonNumberForPoint(point, lessonById);
   if (lessonNumber < coachFromLesson || lessonNumber > coachToLesson) return false;
   if (!matchesPoint(point, searchQuery)) return false;
   if (coachTag !== "all" && !point.tags.includes(coachTag)) return false;
   if (coachStatus === "ok" && point.status !== "mastered") return false;
   if (coachStatus === "weak" && point.status !== "learning") return false;
   if (coachStatus === "new" && point.status !== "new") return false;
   return true;
  });
  if (coachOrder === "hard") {
   return points.sort((a, b) => pointCoachScore(a) - pointCoachScore(b) || lessonNumberForPoint(a, lessonById) - lessonNumberForPoint(b, lessonById) || a.row_number - b.row_number);
  }
  if (coachOrder === "random") {
   return points.sort((a, b) => stablePointHash(a.id) - stablePointHash(b.id));
  }
  return points.sort((a, b) => lessonNumberForPoint(a, lessonById) - lessonNumberForPoint(b, lessonById) || a.row_number - b.row_number);
 }, [coachFromLesson, coachOrder, coachStatus, coachTag, coachToLesson, course?.points, lessonById, searchQuery]);
 const coachPoint = coachPoints[coachIndex] || coachPoints[0] || null;
 const coachLesson = coachPoint?.lesson_id ? lessonById.get(coachPoint.lesson_id) || activeLesson : activeLesson;
 const coachVocabulary = useMemo(() => {
  if (!coachLesson || !vocabData || !("entries" in vocabData)) return [];
  return (vocabData.entries || []).filter((entry) => entry.source.lessonNumber === coachLesson.lesson_number).slice(0, 28);
 }, [coachLesson, vocabData]);
 const coachStats = useMemo(() => ({
  range: `${coachFromLesson}-${coachToLesson}`,
  filtered: coachPoints.length,
  mastered: coachPoints.filter((point) => point.status === "mastered").length,
  weak: coachPoints.filter((point) => point.status === "learning").length,
  practice: sessionStats.correct,
 }), [coachFromLesson, coachPoints, coachToLesson, sessionStats.correct]);

 useEffect(() => {
  if (!activeLessonId && lessons[0]) setActiveLessonId(lessons[0].id);
 }, [activeLessonId, lessons]);

 useEffect(() => {
  setActivePointId(activeLesson?.points[0]?.id || null);
  setExerciseIndex(0);
 }, [activeLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

 useEffect(() => {
  if (!lessonNumbers.length) return;
  setCoachFromLesson((current) => (lessonNumbers.includes(current) ? current : lessonNumbers[0]));
  setCoachToLesson((current) => (lessonNumbers.includes(current) ? current : lessonNumbers[lessonNumbers.length - 1]));
 }, [lessonNumbers]);

 useEffect(() => {
  setCoachIndex(0);
 }, [coachFromLesson, coachOrder, coachStatus, coachTag, coachToLesson, searchQuery]);

 useEffect(() => {
  if (coachIndex >= coachPoints.length) setCoachIndex(Math.max(0, coachPoints.length - 1));
 }, [coachIndex, coachPoints.length]);

 const visiblePoints = useMemo(() => {
  const base = activeTab === "all" ? course?.points || [] : activeLesson?.points || [];
  return base.filter((point) => {
   if (!matchesPoint(point, searchQuery)) return false;
   if (filter === "all") return true;
   if (filter === "missing") return pointHasMissingData(point);
   return point.status === filter;
  });
 }, [activeLesson?.points, activeTab, course?.points, filter, searchQuery]);

 const updateProgress = useCallback(
  async (point: GrammarPointWithProgress, nextLevel: number) => {
   if (!course) return;
   queryClient.setQueryData(["grammar-points"], applyProgress(course, point.id, nextLevel));
   const response = await fetch(`/api/grammar/points/${point.id}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proficiency_level: nextLevel }),
   });
   if (!response.ok) {
    toast.error("Chưa lưu được tiến độ ngữ pháp");
    await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
   }
  },
  [course, queryClient],
 );

 const resetExerciseState = useCallback(() => {
  setExerciseAnswer("");
  setSelectedChoice(null);
  setExerciseChecked(false);
  setExerciseCorrect(null);
 }, []);

 useEffect(() => {
  resetExerciseState();
 }, [activeExercise?.id, resetExerciseState]);

 const checkExercise = useCallback(async () => {
  if (!activeExercise) return;
  const correct = evaluateExercise(activeExercise, exerciseAnswer, selectedChoice);
  setExerciseChecked(true);
  setExerciseCorrect(correct);
  setSessionStats((current) => ({
   answered: current.answered + 1,
   correct: current.correct + (correct ? 1 : 0),
   wrong: current.wrong + (correct ? 0 : 1),
  }));
  await fetch(`/api/grammar/exercises/${activeExercise.id}/attempt`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    point_id: activeExercise.point_id,
    submitted_answer: { text: exerciseAnswer, choice: selectedChoice },
    is_correct: correct,
   }),
  }).catch(() => null);
  if (activePoint) {
   const nextLevel = correct ? Math.min(activePoint.proficiency_level + 1, 5) : Math.max(activePoint.proficiency_level - 1, 0);
   void updateProgress(activePoint, nextLevel);
  }
 }, [activeExercise, activePoint, exerciseAnswer, selectedChoice, updateProgress]);

 const nextExercise = useCallback(() => {
  if (!activeExercises.length) return;
  setExerciseIndex((index) => (index + 1) % activeExercises.length);
  resetExerciseState();
 }, [activeExercises.length, resetExerciseState]);

 const goCoach = useCallback((direction: 1 | -1) => {
  if (!coachPoints.length) return;
  setCoachIndex((index) => (index + direction + coachPoints.length) % coachPoints.length);
  setCoachTab("logic");
  resetExerciseState();
 }, [coachPoints.length, resetExerciseState]);

 const markCoachPoint = useCallback(async (level: number, shouldAdvance = true) => {
  if (!coachPoint) return;
  await updateProgress(coachPoint, level);
  if (shouldAdvance) goCoach(1);
 }, [coachPoint, goCoach, updateProgress]);

 const checkCoachPractice = useCallback(async () => {
  if (!coachPoint) return;
  const quiz = getCoachQuiz(coachPoint);
  if (!quiz) return;
  const correct = selectedChoice === String(quiz.answerIndex);
  setExerciseChecked(true);
  setExerciseCorrect(correct);
  setSessionStats((current) => ({
   answered: current.answered + 1,
   correct: current.correct + (correct ? 1 : 0),
   wrong: current.wrong + (correct ? 0 : 1),
  }));
  if (quiz.exerciseId) {
   await fetch(`/api/grammar/exercises/${quiz.exerciseId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     point_id: coachPoint.id,
     submitted_answer: { choice: selectedChoice, text: quiz.choices[Number(selectedChoice)] || "" },
     is_correct: correct,
    }),
   }).catch(() => null);
  }
  await updateProgress(coachPoint, correct ? Math.min(coachPoint.proficiency_level + 1, 5) : Math.max(coachPoint.proficiency_level - 1, 0));
 }, [coachPoint, selectedChoice, updateProgress]);

 useEffect(() => {
  if (activeTab !== "study") return;
  const handleKeyDown = (event: KeyboardEvent) => {
   const target = event.target as HTMLElement | null;
   if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
   if (event.key === "ArrowRight") {
    event.preventDefault();
    goCoach(1);
   } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    goCoach(-1);
   } else if (["1", "2", "3", "4", "5"].includes(event.key)) {
    event.preventDefault();
    setCoachTab((["logic", "formula", "examples", "traps", "practice"] as CoachTab[])[Number(event.key) - 1]);
   } else if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    void markCoachPoint(5);
   } else if (event.key.toLowerCase() === "w") {
    event.preventDefault();
    void markCoachPoint(2);
   }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [activeTab, goCoach, markCoachPoint]);

 const importHanyuGrammar = useCallback(async () => {
  setIsImportingHanyu(true);
  try {
   const response = await fetch("/api/grammar/import/np-md", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reset: true }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; importedLessons?: number; importedPoints?: number } | null;
   if (!response.ok) throw new Error(result?.error || "Import Np.md thất bại");
   toast.success(`Đã import ${result?.importedLessons || 0} bài, ${result?.importedPoints || 0} điểm ngữ pháp`);
   setActiveLessonId(null);
   setActivePointId(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Import Np.md thất bại");
  } finally {
   setIsImportingHanyu(false);
  }
 }, [queryClient]);

 const importCoachJson = useCallback(async () => {
  setIsImportingCoachJson(true);
  try {
   const response = await fetch("/api/grammar/import/coach-json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reset: true }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; importedLessons?: number; importedPoints?: number; importedExercises?: number } | null;
   if (!response.ok) throw new Error(result?.error || "Import grammar coach JSON thất bại");
   toast.success(`Đã import ${result?.importedLessons || 0} bài, ${result?.importedPoints || 0} điểm, ${result?.importedExercises || 0} quiz`);
   setActiveLessonId(null);
   setActivePointId(null);
   setCoachIndex(0);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Import grammar coach JSON thất bại");
  } finally {
   setIsImportingCoachJson(false);
  }
 }, [queryClient]);

 const generateExerciseSet = useCallback(async () => {
  if (!activePoint && !activeLesson) return;
  setIsGeneratingExercises(true);
  try {
   const response = await fetch("/api/grammar/exercises/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     lesson_id: activePoint ? null : activeLesson?.id,
     point_id: activePoint?.id || null,
     exercise_type: exerciseMode,
     count_per_type: 10,
     replace_old: true,
    }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; inserted?: number } | null;
   if (!response.ok) throw new Error(result?.error || "Không tạo được bài tập");
   toast.success(`Đã tạo ${result?.inserted || 0} câu luyện tập`);
   setExerciseIndex(0);
   resetExerciseState();
   setSessionStats({ answered: 0, correct: 0, wrong: 0 });
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không tạo được bài tập");
  } finally {
   setIsGeneratingExercises(false);
  }
 }, [activeLesson, activePoint, exerciseMode, queryClient, resetExerciseState]);

 const generateCoachExerciseSet = useCallback(async () => {
  if (!coachPoint) return;
  setIsGeneratingExercises(true);
  try {
   const response = await fetch("/api/grammar/exercises/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     point_id: coachPoint.id,
     exercise_type: "mixed",
     count_per_type: 10,
     replace_old: true,
    }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; inserted?: number } | null;
   if (!response.ok) throw new Error(result?.error || "Không tạo được bài tập");
   toast.success(`Đã tạo ${result?.inserted || 0} câu luyện tập`);
   resetExerciseState();
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không tạo được bài tập");
  } finally {
   setIsGeneratingExercises(false);
  }
 }, [coachPoint, queryClient, resetExerciseState]);

 const saveLesson = useCallback(
  async (lesson: GrammarLessonWithStats) => {
   const isNew = lesson.id.startsWith("new-");
   const response = await fetch(isNew ? "/api/grammar/lessons" : `/api/grammar/lessons/${lesson.id}`, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     course_id: lesson.course_id || course?.id,
     lesson_key: lesson.lesson_key,
     lesson_number: lesson.lesson_number,
     title: lesson.title,
     lesson_order: lesson.lesson_order,
     description: lesson.description,
    }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; lesson?: { id: string } } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa lưu được bài");
    return;
   }
   toast.success("Đã lưu bài ngữ pháp");
   setEditingLesson(null);
   if (isNew && result?.lesson?.id) setActiveLessonId(result.lesson.id);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [course?.id, queryClient],
 );

 const deleteLesson = useCallback(
  async (lesson: GrammarLessonWithStats) => {
   if (!window.confirm(`Xoá "${lesson.title}" và toàn bộ ngữ pháp trong bài này?`)) return;
   const response = await fetch(`/api/grammar/lessons/${lesson.id}`, { method: "DELETE" });
   const result = (await response.json().catch(() => null)) as { error?: string } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa xoá được bài");
    return;
   }
   toast.success("Đã xoá bài");
   setEditingLesson(null);
   setActiveLessonId(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [queryClient],
 );

 const savePoint = useCallback(
  async (point: GrammarPointWithProgress, exercises: ExerciseDraft[]) => {
   const isNew = point.id.startsWith("new-");
   const response = await fetch(isNew ? "/api/grammar/points" : `/api/grammar/points/${point.id}`, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     course_id: point.course_id || course?.id,
     lesson_id: point.lesson_id,
     title: point.title,
     hanzi: point.hanzi,
     pinyin: point.pinyin,
     vietnamese_title: point.vietnamese_title,
     level: point.level,
     category: point.category,
     tags: point.tags,
     row_number: point.row_number,
     content: point.content,
    }),
   });
   const result = (await response.json().catch(() => null)) as { error?: string; point?: GrammarPointWithProgress } | null;
   if (!response.ok || !result?.point) {
    toast.error(result?.error || "Chưa lưu được điểm ngữ pháp");
    return;
   }
   const pointId = result.point.id;
   await syncExercises(pointId, point.course_id || course?.id || "", point.lesson_id || null, point.exercises, exercises);
   toast.success("Đã lưu ngữ pháp");
   setEditingPoint(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [course?.id, queryClient],
 );

 const deletePoint = useCallback(
  async (point: GrammarPointWithProgress) => {
   if (!window.confirm(`Xoá ngữ pháp "${point.title}"?`)) return;
   const response = await fetch(`/api/grammar/points/${point.id}`, { method: "DELETE" });
   const result = (await response.json().catch(() => null)) as { error?: string } | null;
   if (!response.ok) {
    toast.error(result?.error || "Chưa xoá được ngữ pháp");
    return;
   }
   toast.success("Đã xoá ngữ pháp");
   setEditingPoint(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [queryClient],
 );

 const createLessonDraft = useCallback(() => {
  const nextOrder = Math.max(0, ...lessons.map((lesson) => lesson.lesson_order)) + 1;
  setEditingLesson({
   id: `new-lesson-${Date.now()}`,
   course_id: course?.id || "",
   lesson_key: `G${String(nextOrder).padStart(2, "0")}`,
   lesson_number: nextOrder,
   title: `Bài ngữ pháp ${nextOrder}`,
   lesson_order: nextOrder,
   description: "",
   points: [],
   exercises: [],
   fresh: 0,
   learning: 0,
   mastered: 0,
   progress: 0,
   categories: [],
  });
 }, [course?.id, lessons]);

 const createPointDraft = useCallback(
  (lesson = activeLesson) => {
   const targetLesson = lesson || lessons[0];
   const rowNumber = (targetLesson?.points.length || 0) + 1;
   setEditingPoint({
    id: `new-point-${Date.now()}`,
    course_id: course?.id || targetLesson?.course_id || "",
    lesson_id: targetLesson?.id || null,
    title: "",
    hanzi: "",
    pinyin: "",
    vietnamese_title: "",
    level: "",
    category: "Ngữ pháp",
    tags: [],
    row_number: rowNumber,
    content: {
     quick_example: { zh: "", pinyin: "", vi: "" },
     explanation: "",
     structures: [],
     usage_notes: [],
     common_mistakes: [],
     comparisons: [],
     examples: [],
    },
    proficiency_level: 0,
    status: "new",
    exercises: [],
   });
  },
  [activeLesson, course?.id, lessons],
 );

 const importPaste = useCallback(
  async (lesson: GrammarLessonWithStats, text: string) => {
   const response = await fetch("/api/grammar/import/paste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson_id: lesson.id, text }),
   });
   const result = (await response.json().catch(() => null)) as { imported?: number; error?: string } | null;
   if (!response.ok) {
    toast.error(result?.error || "Import ngữ pháp thất bại");
    return;
   }
   toast.success(`Đã import ${result?.imported || 0} điểm ngữ pháp`);
   setImportingLesson(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
 [queryClient],
 );

 if (source === "hsk") {
  return (
   <LearningShell>
    <GrammarSourceSwitch value={source} onChange={setSource} />
    <HskLessonPracticeModule
     titlePrefix="Ngữ pháp HSK"
     visibleTabs={["grammar", "text", "quiz"]}
     initialTab="grammar"
    />
   </LearningShell>
  );
 }

 if (error) {
  const missingSchema = error instanceof GrammarSchemaMissingError;
  return (
   <LearningShell>
    <EmptyState
     title={missingSchema ? "Chưa apply grammar migration" : "Không tải được ngữ pháp"}
     description={missingSchema ? "Apply supabase/migrations/20260312000016_grammar_learning.sql rồi tải lại trang." : error instanceof Error ? error.message : "Kiểm tra API grammar."}
    />
   </LearningShell>
  );
 }

 return (
  <LearningShell>
   <GrammarSourceSwitch value={source} onChange={setSource} />
   <LearningHeader
   activeTab={activeTab}
   onTabChange={setActiveTab}
   onCreateLesson={createLessonDraft}
    onCreatePoint={() => createPointDraft()}
   onImportHanyu={importHanyuGrammar}
   onImportCoachJson={importCoachJson}
   isImportingHanyu={isImportingHanyu}
   isImportingCoachJson={isImportingCoachJson}
   lessons={lessons}
  />

   {isLoading ? (
    <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white shadow-theme-md">
     <Loader2 className="h-6 w-6 animate-spin text-red-500" />
     <span className="ml-3 text-sm font-black text-stone-500">Đang tải ngữ pháp...</span>
    </div>
   ) : !course ? (
    <EmptyState title="Chưa có kho ngữ pháp" description="Tạo bài hoặc paste nội dung ngữ pháp để bắt đầu." action={<ActionButton onClick={createLessonDraft} icon={Plus}>Tạo bài đầu tiên</ActionButton>} />
   ) : (
    <>
     <div className={cn("grid gap-4 sm:gap-6", activeTab === "study" ? "grid-cols-1" : "lg:grid-cols-[340px_minmax(0,1fr)]")}>
      {activeTab !== "study" && (
       <LessonList
        lessons={lessons}
        activeLessonId={activeLesson?.id}
        onSelect={(lesson) => {
         setActiveLessonId(lesson.id);
         setLessonSheetOpen(false);
        }}
        onEdit={setEditingLesson}
        onImport={setImportingLesson}
       />
      )}

      <main className="min-w-0">
       {activeTab === "study" && (
        <GrammarCoachWorkspace
         lessons={lessons}
         points={coachPoints}
         point={coachPoint}
         activeIndex={coachIndex}
         stats={coachStats}
         lessonById={lessonById}
         tags={coachTags}
         fromLesson={coachFromLesson}
         toLesson={coachToLesson}
         status={coachStatus}
         order={coachOrder}
         tag={coachTag}
         searchQuery={searchQuery}
         activeTab={coachTab}
         vocabulary={coachVocabulary}
         selectedChoice={selectedChoice}
         checked={exerciseChecked}
         correct={exerciseCorrect}
         isGeneratingExercises={isGeneratingExercises}
         onFromLessonChange={setCoachFromLesson}
         onToLessonChange={setCoachToLesson}
         onStatusChange={setCoachStatus}
         onOrderChange={setCoachOrder}
         onTagChange={setCoachTag}
         onSearchChange={setSearchQuery}
         onTabChange={(tab) => {
          setCoachTab(tab);
          resetExerciseState();
         }}
         onSelectPoint={(point) => {
          const nextIndex = coachPoints.findIndex((candidate) => candidate.id === point.id);
          if (nextIndex >= 0) setCoachIndex(nextIndex);
          setActiveLessonId(point.lesson_id || null);
          setActivePointId(point.id);
          resetExerciseState();
         }}
         onSelectChoice={setSelectedChoice}
         onCheckPractice={checkCoachPractice}
         onPrev={() => goCoach(-1)}
         onNext={() => goCoach(1)}
         onMarkWeak={() => markCoachPoint(2)}
         onMarkKnown={() => markCoachPoint(5)}
         onEditPoint={(point) => setEditingPoint(point)}
         onGenerateExercises={generateCoachExerciseSet}
        />
       )}

       {activeTab === "all" && (
        <AllGrammarWorkspace
         points={visiblePoints}
         lessons={lessons}
         searchQuery={searchQuery}
         filter={filter}
         onSearchChange={setSearchQuery}
         onFilterChange={setFilter}
         onEdit={setEditingPoint}
         onAddPoint={() => createPointDraft()}
        />
       )}

       {activeTab === "edit" && (
        <LessonEditWorkspace
         lessons={lessons}
         onEditLesson={setEditingLesson}
         onEditPoint={setEditingPoint}
         onAddLesson={createLessonDraft}
         onAddPoint={createPointDraft}
         onImportLesson={setImportingLesson}
        />
       )}
      </main>
     </div>

     <MobileLessonSheet
      open={lessonSheetOpen}
      lessons={lessons}
      activeLessonId={activeLesson?.id}
      onClose={() => setLessonSheetOpen(false)}
      onSelect={(lesson) => {
       setActiveLessonId(lesson.id);
       setLessonSheetOpen(false);
      }}
     />
    </>
   )}

   {editingLesson && <LessonDrawer lesson={editingLesson} onClose={() => setEditingLesson(null)} onSave={saveLesson} onDelete={deleteLesson} />}
   {editingPoint && <PointDrawer point={editingPoint} lessons={lessons} onClose={() => setEditingPoint(null)} onSave={savePoint} onDelete={deletePoint} />}
   {importingLesson && <ImportDrawer lesson={importingLesson} onClose={() => setImportingLesson(null)} onImport={(text) => importPaste(importingLesson, text)} />}
  </LearningShell>
);
}

function GrammarSourceSwitch({
 value,
 onChange,
}: {
 value: GrammarSource;
 onChange: (value: GrammarSource) => void;
}) {
 return (
  <section className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm md:rounded-[28px] md:p-5">
   <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Nguồn học</p>
     <h1 className="mt-1 text-3xl font-black text-stone-950 md:text-4xl">Ngữ pháp</h1>
     <p className="mt-1 text-sm font-bold text-stone-500 md:text-base">
      Chọn giáo trình Hán ngữ hoặc HSK trong cùng module ngữ pháp.
     </p>
    </div>
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
     {[
      { key: "hanyu" as const, label: "Hán ngữ" },
      { key: "hsk" as const, label: "HSK" },
     ].map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => onChange(item.key)}
       className={cn(
        "h-11 rounded-xl px-4 text-sm font-black transition",
        value === item.key ? "bg-red-500 text-white shadow-theme-sm" : "text-stone-600 hover:bg-white",
       )}
      >
       {item.label}
      </button>
     ))}
    </div>
   </div>
  </section>
 );
}

function LearningShell({ children }: { children: React.ReactNode }) {
 return (
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:px-8">
    {children}
   </div>
  </div>
 );
}

function LearningHeader({
 activeTab,
 onTabChange,
 onCreateLesson,
 onCreatePoint,
 onImportHanyu,
 onImportCoachJson,
 isImportingHanyu,
 isImportingCoachJson,
 lessons,
}: {
 activeTab: MainTab;
 onTabChange: (tab: MainTab) => void;
 onCreateLesson: () => void;
 onCreatePoint: () => void;
 onImportHanyu: () => void;
 onImportCoachJson: () => void;
 isImportingHanyu: boolean;
 isImportingCoachJson: boolean;
 lessons: GrammarLessonWithStats[];
}) {
 const pointCount = lessons.reduce((sum, lesson) => sum + lesson.points.length, 0);
 return (
  <header className="rounded-[22px] border-2 border-stone-200 bg-white p-3 shadow-theme-sm md:rounded-[28px] md:p-6">
   <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
    <div>
     <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50 md:h-11 md:px-4">
      ← Quay lại
     </Link>
     <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-red-500 md:mt-5 md:text-xs md:tracking-[0.22em]">Grammar Coach · Giáo trình Hán ngữ</p>
     <h1 className="mt-1 text-3xl font-black tracking-normal text-stone-900 md:mt-2 md:text-5xl">Ngữ pháp Bài 11-25</h1>
     <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-stone-500 md:text-base md:leading-7">Card-first, filter-first: xem logic, công thức, ví dụ và làm practice trong cùng một flow.</p>
     <div className="mt-3 flex max-w-full items-center gap-2 overflow-x-auto pb-1 md:mt-4">
      <SegmentedControl
       value={activeTab}
       items={[
        { key: "study", label: "Học", icon: BookOpen },
        { key: "all", label: "Tất cả ngữ pháp", icon: Layers3 },
        { key: "edit", label: "Chỉnh sửa", icon: Edit3 },
       ]}
       onChange={(key) => onTabChange(key as MainTab)}
      />
      <ActionButton onClick={onImportCoachJson} icon={Upload} tone="neutral" loading={isImportingCoachJson}>Import JSON mẫu</ActionButton>
      <ActionButton onClick={onImportHanyu} icon={Upload} tone="neutral" loading={isImportingHanyu}>Import Np.md</ActionButton>
      <ActionButton onClick={onCreatePoint} icon={Plus}>Thêm ngữ pháp</ActionButton>
      <ActionButton onClick={onCreateLesson} icon={Plus} tone="neutral">Thêm bài</ActionButton>
     </div>
    </div>

    <div className="hidden rounded-[24px] border-2 border-blue-300 bg-blue-50/40 p-5 shadow-theme-sm md:block">
     <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">Shortcut</p>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">{lessons.length} bài · {pointCount} điểm</span>
     </div>
     <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black text-stone-700">
      <span className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3">←/→ chuyển card</span>
      <span className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3">1-5 đổi tab</span>
      <span className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3">K nắm rồi</span>
      <span className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-3">W còn yếu</span>
     </div>
    </div>
   </div>
  </header>
 );
}

function LessonList({ lessons, activeLessonId, onSelect, onEdit, onImport }: { lessons: GrammarLessonWithStats[]; activeLessonId?: string; onSelect: (lesson: GrammarLessonWithStats) => void; onEdit: (lesson: GrammarLessonWithStats) => void; onImport: (lesson: GrammarLessonWithStats) => void }) {
 return (
  <aside className="hidden rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">
   <div className="mb-4 flex items-center justify-between">
    <p className="text-lg font-black uppercase tracking-wide text-stone-900">Danh sách bài</p>
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">{lessons.length}</span>
   </div>
   <div className="flex flex-col gap-3">
    {lessons.map((lesson) => (
     <button key={lesson.id} type="button" onClick={() => onSelect(lesson)} className={cn("group flex min-h-24 w-full items-center gap-3 rounded-[24px] border-2 p-4 text-left shadow-theme-sm transition", lesson.id === activeLessonId ? "border-red-700 bg-red-500 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50")}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black", lesson.id === activeLessonId ? "border-white/60 bg-white/20" : "border-stone-200 bg-white")}>{lesson.progress}%</span>
      <span className="min-w-0 flex-1">
       <span className="flex items-center justify-between gap-2">
        <span className="truncate text-xl font-black">{lesson.title}</span>
        <span className="flex opacity-0 transition group-hover:opacity-100">
         <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onImport(lesson); }} className="rounded-xl p-2 hover:bg-white/20"><Upload className="h-4 w-4" /></span>
         <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onEdit(lesson); }} className="rounded-xl p-2 hover:bg-white/20"><PenLine className="h-4 w-4" /></span>
        </span>
       </span>
       <span className={cn("mt-1 block text-sm font-bold", lesson.id === activeLessonId ? "text-white/90" : "text-stone-500")}>{lesson.mastered}/{lesson.points.length} điểm</span>
       <span className="mt-2 flex flex-wrap gap-1">
        {lesson.categories.slice(0, 3).map((category) => (
         <span key={category.name} className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", lesson.id === activeLessonId ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500")}>{category.name} · {category.count}</span>
        ))}
       </span>
      </span>
     </button>
    ))}
   </div>
 </aside>
);
}

function GrammarCoachWorkspace({
 lessons,
 points,
 point,
 activeIndex,
 stats,
 lessonById,
 tags,
 fromLesson,
 toLesson,
 status,
 order,
 tag,
 searchQuery,
 activeTab,
 vocabulary,
 selectedChoice,
 checked,
 correct,
 isGeneratingExercises,
 onFromLessonChange,
 onToLessonChange,
 onStatusChange,
 onOrderChange,
 onTagChange,
 onSearchChange,
 onTabChange,
 onSelectPoint,
 onSelectChoice,
 onCheckPractice,
 onPrev,
 onNext,
 onMarkWeak,
 onMarkKnown,
 onEditPoint,
 onGenerateExercises,
}: {
 lessons: GrammarLessonWithStats[];
 points: GrammarPointWithProgress[];
 point: GrammarPointWithProgress | null;
 activeIndex: number;
 stats: { range: string; filtered: number; mastered: number; weak: number; practice: number };
 lessonById: Map<string, GrammarLessonWithStats>;
 tags: string[];
 fromLesson: number;
 toLesson: number;
 status: CoachStatusFilter;
 order: CoachOrder;
 tag: string;
 searchQuery: string;
 activeTab: CoachTab;
 vocabulary: VocabEntryWithProgress[];
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 isGeneratingExercises: boolean;
 onFromLessonChange: (value: number) => void;
 onToLessonChange: (value: number) => void;
 onStatusChange: (value: CoachStatusFilter) => void;
 onOrderChange: (value: CoachOrder) => void;
 onTagChange: (value: string) => void;
 onSearchChange: (value: string) => void;
 onTabChange: (value: CoachTab) => void;
 onSelectPoint: (point: GrammarPointWithProgress) => void;
 onSelectChoice: (value: string) => void;
 onCheckPractice: () => void;
 onPrev: () => void;
 onNext: () => void;
 onMarkWeak: () => void;
 onMarkKnown: () => void;
 onEditPoint: (point: GrammarPointWithProgress) => void;
 onGenerateExercises: () => void;
}) {
 const lessonNumbers = lessons.map((lesson) => lesson.lesson_number).filter((value): value is number => typeof value === "number").sort((a, b) => a - b);
 const contrasts = points.flatMap((item) => item.content.coach_contrasts || []).filter((item, index, arr) => arr.findIndex((candidate) => candidate.title === item.title) === index);
 return (
  <div className="space-y-5">
   <section className="rounded-[22px] border-2 border-stone-200 bg-white p-3 shadow-theme-md md:rounded-[28px] md:p-5">
    <div className="grid gap-3 xl:grid-cols-[1fr_1.25fr] xl:items-end">
     <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Từ bài">
       <Select value={String(fromLesson)} onChange={(event) => onFromLessonChange(Number(event.target.value))}>
        {lessonNumbers.map((lessonNumber) => <option key={lessonNumber} value={lessonNumber}>Bài {lessonNumber}</option>)}
       </Select>
      </Field>
      <Field label="Đến bài">
       <Select value={String(toLesson)} onChange={(event) => onToLessonChange(Number(event.target.value))}>
        {lessonNumbers.map((lessonNumber) => <option key={lessonNumber} value={lessonNumber}>Bài {lessonNumber}</option>)}
       </Select>
      </Field>
      <Field label="Trạng thái">
       <Select value={status} onChange={(event) => onStatusChange(event.target.value as CoachStatusFilter)}>
        <option value="all">Tất cả</option>
        <option value="new">Chưa học</option>
        <option value="weak">Còn yếu</option>
        <option value="ok">Đã nắm</option>
       </Select>
      </Field>
      <Field label="Thứ tự">
       <Select value={order} onChange={(event) => onOrderChange(event.target.value as CoachOrder)}>
        <option value="lesson">Theo bài</option>
        <option value="hard">Ưu tiên yếu</option>
        <option value="random">Random ổn định</option>
       </Select>
      </Field>
     </div>
     <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
      <div>
       <label className="text-xs font-black uppercase tracking-wide text-stone-500">Tìm ngữ pháp</label>
       <div className="relative mt-2">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
        <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="是...的, bị động, bổ ngữ..." className="pl-12" />
       </div>
      </div>
      <Field label="Tag">
       <Select value={tag} onChange={(event) => onTagChange(event.target.value)}>
        <option value="all">Tất cả tag</option>
        {tags.map((item) => <option key={item} value={item}>{item}</option>)}
       </Select>
      </Field>
     </div>
    </div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:mt-4">
     {lessonNumbers.map((lessonNumber) => (
      <button
       key={lessonNumber}
       type="button"
       onClick={() => {
        onFromLessonChange(lessonNumber);
        onToLessonChange(lessonNumber);
       }}
       className={cn("shrink-0 rounded-2xl border-2 px-3 py-2 text-xs font-black shadow-theme-sm", lessonNumber >= fromLesson && lessonNumber <= toLesson ? "border-red-500 bg-red-50 text-red-600" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50")}
      >
       B{lessonNumber}
      </button>
     ))}
    </div>
   </section>

   <main className="min-w-0 space-y-5">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
     <StatTile label="Trong khoảng bài" value={stats.range} />
     <StatTile label="Đang hiển thị" value={stats.filtered} />
     <StatTile label="Đã nắm" value={stats.mastered} tone="green" />
     <StatTile label="Còn yếu" value={stats.weak} tone="yellow" />
     <StatTile label="Practice đúng" value={stats.practice} tone="blue" />
    </div>

    {!point ? (
     <EmptyState title="Không có ngữ pháp trong bộ lọc" description="Nới range bài hoặc bỏ tag/search để thấy lại danh sách." compact />
    ) : (
     <GrammarCoachCard
      point={point}
      lesson={point.lesson_id ? lessonById.get(point.lesson_id) || null : null}
      index={activeIndex}
      total={points.length}
      activeTab={activeTab}
      selectedChoice={selectedChoice}
      checked={checked}
      correct={correct}
      isGeneratingExercises={isGeneratingExercises}
      onTabChange={onTabChange}
      onSelectChoice={onSelectChoice}
      onCheckPractice={onCheckPractice}
      onPrev={onPrev}
      onNext={onNext}
      onMarkWeak={onMarkWeak}
      onMarkKnown={onMarkKnown}
      onEdit={() => onEditPoint(point)}
      onGenerateExercises={onGenerateExercises}
     />
    )}

    <section className="rounded-[22px] border-2 border-stone-200 bg-white p-3 shadow-theme-md md:rounded-[28px] md:p-5">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <p className="text-base font-black uppercase tracking-wide text-stone-900">Quick list</p>
       <p className="text-sm font-bold text-stone-500">Nhảy nhanh trong bộ lọc hiện tại.</p>
      </div>
      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">{points.length} cards</span>
     </div>
     <div className="mt-4 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
      {points.map((item, index) => (
       <button key={item.id} type="button" onClick={() => onSelectPoint(item)} className={cn("rounded-2xl border-2 px-3 py-2 text-left text-sm font-black shadow-theme-sm", item.id === point?.id ? "border-red-500 bg-red-50 text-red-600" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50")}>
        {index + 1}. {item.title}
       </button>
      ))}
     </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
     <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md">
      <p className="text-lg font-black uppercase tracking-wide text-stone-900">So sánh dễ nhầm</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
       {contrasts.length ? contrasts.map((contrast) => (
        <div key={contrast.title} className="rounded-[22px] border-2 border-stone-200 bg-stone-50 p-4">
         <p className="text-base font-black text-stone-900">{contrast.title}</p>
         <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{contrast.body}</p>
        </div>
       )) : <p className="text-sm font-bold text-stone-500">Chưa có panel so sánh trong dữ liệu.</p>}
      </div>
     </section>
     <LessonVocabularyPanel vocabulary={vocabulary} />
    </div>
   </main>
  </div>
 );
}

function GrammarCoachCard({
 point,
 lesson,
 index,
 total,
 activeTab,
 selectedChoice,
 checked,
 correct,
 isGeneratingExercises,
 onTabChange,
 onSelectChoice,
 onCheckPractice,
 onPrev,
 onNext,
 onMarkWeak,
 onMarkKnown,
 onEdit,
 onGenerateExercises,
}: {
 point: GrammarPointWithProgress;
 lesson: GrammarLessonWithStats | null;
 index: number;
 total: number;
 activeTab: CoachTab;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 isGeneratingExercises: boolean;
 onTabChange: (value: CoachTab) => void;
 onSelectChoice: (value: string) => void;
 onCheckPractice: () => void;
 onPrev: () => void;
 onNext: () => void;
 onMarkWeak: () => void;
 onMarkKnown: () => void;
 onEdit: () => void;
 onGenerateExercises: () => void;
}) {
 const quiz = getCoachQuiz(point);
 const examples = point.content.examples || [];
 return (
  <section className="rounded-[24px] border-2 border-stone-200 bg-white p-3 shadow-theme-md md:rounded-[32px] md:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">{lesson ? `Bài ${lesson.lesson_number}` : "Grammar card"} · {index + 1}/{total}</p>
     <h2 className="mt-2 text-[clamp(2.1rem,10vw,5.25rem)] font-black leading-[0.98] text-stone-900 md:mt-3">{point.title}</h2>
     <p className="mt-3 max-w-5xl text-lg font-bold leading-8 text-stone-600 md:text-xl">{getCoachCore(point)}</p>
     <div className="mt-4 flex flex-wrap gap-2">
      {point.tags.slice(0, 6).map((tag) => <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{tag}</span>)}
      <StatusPill status={point.status} />
     </div>
    </div>
    <div className="flex flex-wrap gap-2">
     <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
     <ActionButton onClick={onGenerateExercises} icon={Sparkles} loading={isGeneratingExercises}>Tạo 10+ câu</ActionButton>
    </div>
   </div>

   <SegmentedControl
    className="mt-6"
    value={activeTab}
    items={[
     { key: "logic", label: "Logic", icon: FileText },
     { key: "formula", label: "Công thức", icon: Layers3 },
     { key: "examples", label: "Ví dụ", icon: BookOpen },
     { key: "traps", label: "Bẫy sai", icon: XCircle },
     { key: "practice", label: "Practice", icon: CheckCircle2 },
    ]}
    onChange={onTabChange}
   />

   <div className="mt-4 min-h-[360px] rounded-[22px] border-2 border-stone-200 bg-stone-50 p-3 md:mt-6 md:min-h-[460px] md:rounded-[28px] md:p-6">
    {activeTab === "logic" && (
     <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[24px] bg-white p-5 shadow-theme-sm">
       <p className="text-sm font-black uppercase tracking-wide text-stone-500">Logic cốt lõi</p>
       <p className="mt-3 text-lg font-bold leading-9 text-stone-700">{point.content.explanation || point.content.core || "Chưa có giải thích."}</p>
      </section>
      {point.content.quick_example?.zh && (
       <section className="rounded-[24px] border-2 border-red-200 bg-red-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-red-500">Ví dụ nhanh</p>
        <p className="mt-3 text-3xl font-black text-stone-900">{point.content.quick_example.zh}</p>
        {point.content.quick_example.pinyin ? <p className="mt-2 text-base font-bold italic text-stone-500">{point.content.quick_example.pinyin}</p> : null}
        {point.content.quick_example.vi ? <p className="mt-2 text-lg font-bold text-stone-700">{point.content.quick_example.vi}</p> : null}
       </section>
      )}
      {!!point.content.usage_notes?.length && (
       <section className="rounded-[24px] bg-blue-50 p-5 xl:col-span-2">
        <p className="text-sm font-black uppercase tracking-wide text-blue-600">Cách dùng / Lưu ý</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
         {point.content.usage_notes.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-blue-800 shadow-theme-sm">{item}</p>)}
        </div>
       </section>
      )}
     </div>
    )}
    {activeTab === "formula" && (
     <div className="grid gap-3 md:grid-cols-2">
      {(point.content.formulas?.length ? point.content.formulas : point.content.structures)?.map((item) => (
       <p key={item} className="rounded-[22px] bg-white p-4 text-lg font-black leading-8 text-stone-800 shadow-theme-sm">{item}</p>
      )) || <p className="font-bold text-stone-500">Chưa có công thức.</p>}
     </div>
    )}
    {activeTab === "examples" && (
     <div className="grid gap-4 xl:grid-cols-2">
      {examples.length ? examples.map((example, exampleIndex) => (
       <div key={`${example.zh}-${exampleIndex}`} className="rounded-[24px] border-2 border-stone-200 bg-white p-5">
        <p className="text-2xl font-black text-stone-900">{example.zh}</p>
        {example.pinyin ? <p className="mt-2 text-sm font-bold italic text-stone-500">{example.pinyin}</p> : null}
        {example.vi ? <p className="mt-2 text-base font-bold text-stone-700">{example.vi}</p> : null}
        {example.note ? <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">{example.note}</p> : null}
       </div>
      )) : <p className="font-bold text-stone-500">Chưa có ví dụ.</p>}
     </div>
    )}
    {activeTab === "traps" && (
     <div className="grid gap-3 md:grid-cols-2">
      {(point.content.traps?.length ? point.content.traps : point.content.common_mistakes)?.map((item) => (
       <p key={item} className="rounded-[22px] bg-white p-4 text-base font-bold leading-7 text-stone-700 shadow-theme-sm">{item}</p>
      )) || <p className="font-bold text-stone-500">Chưa có bẫy sai.</p>}
     </div>
    )}
    {activeTab === "practice" && (
     <div className="space-y-5">
      {!quiz ? (
       <EmptyState title="Chưa có practice" description="Bấm tạo bài tập hoặc import JSON mẫu để có quiz." compact />
      ) : (
       <>
        <div>
         <p className="text-sm font-black uppercase tracking-wide text-red-500">Practice</p>
         <p className="mt-2 text-2xl font-black leading-9 text-stone-900">{quiz.prompt}</p>
        </div>
        <div className="space-y-3">
         {quiz.choices.map((choice, choiceIndex) => {
          const isSelected = selectedChoice === String(choiceIndex);
          const isCorrect = checked && choiceIndex === quiz.answerIndex;
          const isWrong = checked && isSelected && !isCorrect;
          return (
           <button
            key={`${choice}-${choiceIndex}`}
            type="button"
            onClick={() => !checked && onSelectChoice(String(choiceIndex))}
            className={cn("flex w-full items-center gap-4 rounded-[22px] border-2 bg-white p-4 text-left text-base font-black shadow-theme-sm transition", isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700" : isWrong ? "border-red-400 bg-red-50 text-red-600" : isSelected ? "border-red-500 bg-red-50 text-red-600" : "border-stone-200 text-stone-800 hover:bg-stone-50")}
           >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 bg-white text-sm">{String.fromCharCode(65 + choiceIndex)}</span>
            <span>{choice}</span>
           </button>
          );
         })}
        </div>
        {checked && (
         <div className={cn("rounded-[22px] border-2 p-4 text-sm font-black", correct ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700")}>
          {correct ? "Đúng rồi." : `Sai. Đáp án đúng: ${quiz.choices[quiz.answerIndex] || ""}`}
          {point.content.explanation ? <p className="mt-2 font-bold leading-6">{point.content.explanation}</p> : null}
         </div>
        )}
        <div className="flex flex-wrap gap-3">
         <ActionButton onClick={onCheckPractice} icon={Check} disabled={!selectedChoice || checked} tone="red">Kiểm tra</ActionButton>
         <ActionButton onClick={onNext} icon={CheckCircle2} tone="neutral">Câu tiếp</ActionButton>
        </div>
       </>
      )}
     </div>
    )}
   </div>

   <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2">
     <ActionButton onClick={onPrev} tone="neutral">← Trước</ActionButton>
     <ActionButton onClick={onNext} tone="neutral">Tiếp →</ActionButton>
    </div>
    <div className="flex flex-wrap gap-2">
     <ActionButton onClick={onMarkWeak} icon={XCircle} tone="neutral">Còn yếu</ActionButton>
     <ActionButton onClick={onMarkKnown} icon={CheckCircle2}>Nắm rồi</ActionButton>
    </div>
   </div>
  </section>
 );
}

function StatTile({ value, label, tone = "neutral" }: { value: string | number; label: string; tone?: "neutral" | "green" | "yellow" | "blue" }) {
 const toneClass = {
  neutral: "border-stone-200 bg-white text-stone-900",
  green: "border-emerald-300 bg-emerald-50 text-emerald-700",
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
 }[tone];
 return (
  <div className={cn("rounded-[22px] border-2 p-4 shadow-theme-sm", toneClass)}>
   <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
   <p className="mt-2 text-3xl font-black">{value}</p>
  </div>
 );
}

function StudyWorkspace({
 lesson,
 point,
 exercise,
 exerciseCount,
 exerciseIndex,
 exerciseMode,
 splitMode,
 vocabulary,
 answer,
 selectedChoice,
 checked,
 correct,
 sessionStats,
 isGeneratingExercises,
 onExerciseModeChange,
 onSelectPoint,
 onEditPoint,
 onGenerateExercises,
 onAnswerChange,
 onChoiceChange,
 onCheck,
 onNext,
 onAgain,
 onRemember,
}: {
 lesson: GrammarLessonWithStats;
 point: GrammarPointWithProgress | null;
 exercise: DbGrammarExercise | null;
 exerciseCount: number;
 exerciseIndex: number;
 exerciseMode: ExerciseMode;
 splitMode: SplitMode;
 vocabulary: VocabEntryWithProgress[];
 answer: string;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 sessionStats: { answered: number; correct: number; wrong: number };
 isGeneratingExercises: boolean;
 onExerciseModeChange: (mode: ExerciseMode) => void;
 onSelectPoint: (point: GrammarPointWithProgress) => void;
 onEditPoint: (point: GrammarPointWithProgress) => void;
 onGenerateExercises: () => void;
 onAnswerChange: (value: string) => void;
 onChoiceChange: (value: string) => void;
 onCheck: () => void;
 onNext: () => void;
 onAgain: () => void;
 onRemember: () => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
   <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">Tổng quan bài</p>
     <h2 className="mt-1 text-3xl font-black text-stone-900">{lesson.title}</h2>
     <p className="mt-2 text-base font-bold text-stone-500">{lesson.points.length} điểm ngữ pháp · {lesson.categories.slice(0, 2).map((item) => item.name).join(", ") || "Chưa phân nhóm"}</p>
    </div>
    <div className="grid grid-cols-3 gap-3">
     <StatBox value={lesson.fresh} label="Đang học" tone="yellow" />
     <StatBox value={lesson.learning} label="Đang ôn" tone="blue" />
     <StatBox value={lesson.mastered} label="Thành thạo" tone="green" />
    </div>
   </div>

   <div className="mt-5 flex flex-col gap-3 rounded-[24px] border-2 border-stone-200 bg-stone-50 p-3 xl:flex-row xl:items-center xl:justify-between">
    <SegmentedControl
     value={exerciseMode}
     items={[
      { key: "mixed", label: "Trộn dạng", icon: Layers3 },
      { key: "fill_blank", label: "Điền từ", icon: PenLine },
      { key: "multiple_choice", label: "Trắc nghiệm", icon: CheckCircle2 },
      { key: "reorder_sentence", label: "Sắp xếp", icon: SplitSquareHorizontal },
      { key: "translate_zh", label: "Dịch Trung", icon: FileText },
     ]}
     onChange={(key) => onExerciseModeChange(key as ExerciseMode)}
    />
    <div className="flex flex-wrap items-center gap-2">
     <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-stone-600 shadow-theme-sm">Phiên này: {sessionStats.correct}/{sessionStats.answered || 0} đúng · {sessionStats.wrong} sai</span>
     <ActionButton onClick={onGenerateExercises} icon={Sparkles} loading={isGeneratingExercises}>Tạo 10+ câu</ActionButton>
    </div>
   </div>

   <div className="mt-6 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
    <div className="rounded-[24px] border-2 border-stone-200 bg-stone-50 p-3">
     <p className="mb-3 px-2 text-xs font-black uppercase tracking-wide text-stone-500">Điểm trong bài</p>
     <div className="grid max-h-[520px] gap-2 overflow-y-auto">
      {lesson.points.map((item) => (
       <button key={item.id} type="button" onClick={() => onSelectPoint(item)} className={cn("rounded-2xl border-2 p-3 text-left shadow-theme-sm", point?.id === item.id ? "border-red-500 bg-red-50" : "border-stone-200 bg-white hover:bg-stone-50")}>
        <p className="truncate text-lg font-black text-stone-900">{item.title}</p>
        <p className="mt-1 truncate text-xs font-bold text-stone-500">{getPointSubtitle(item)}</p>
       </button>
      ))}
     </div>
    </div>

    {!point ? (
     <EmptyState title="Chưa có ngữ pháp trong bài" description="Thêm hoặc import ngữ pháp để bắt đầu học." compact />
    ) : (
     <StudySplitLayout
      mode={splitMode === "theory" ? "left" : splitMode === "practice" ? "right" : "split"}
      storageKey="grammar-study-split"
      left={<TheoryPanel point={point} onEdit={() => onEditPoint(point)} onAgain={onAgain} onRemember={onRemember} />}
      right={<PracticePanel point={point} exercise={exercise} exerciseIndex={exerciseIndex} exerciseCount={exerciseCount} answer={answer} selectedChoice={selectedChoice} checked={checked} correct={correct} onAnswerChange={onAnswerChange} onChoiceChange={onChoiceChange} onCheck={onCheck} onNext={onNext} />}
     />
    )}
   </div>

   <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <LessonVocabularyPanel vocabulary={vocabulary} />
   </div>
  </section>
 );
}

function TheoryPanel({ point, onEdit, onAgain, onRemember }: { point: GrammarPointWithProgress; onEdit: () => void; onAgain: () => void; onRemember: () => void }) {
 const content = point.content;
 return (
  <article className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <div className="flex flex-wrap gap-2">
      {[point.level, point.category, ...point.tags].filter(Boolean).slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{tag}</span>)}
     </div>
     <h3 className="mt-4 text-5xl font-black text-stone-900">{point.title}</h3>
     {point.pinyin && <p className="mt-2 text-2xl font-bold italic text-stone-500">{point.pinyin}</p>}
     {point.vietnamese_title && <p className="mt-2 text-xl font-bold text-stone-700">{point.vietnamese_title}</p>}
    </div>
    <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
   </div>

   {content.quick_example?.zh && (
    <section className="mt-6 rounded-[24px] border-2 border-red-200 bg-red-50/50 p-5">
     <p className="text-xs font-black uppercase tracking-wide text-stone-500">Ví dụ nhanh</p>
     <p className="mt-4 text-3xl font-black leading-tight text-stone-900">{content.quick_example.zh}</p>
     <p className="mt-3 text-lg font-bold italic text-stone-500">{content.quick_example.pinyin}</p>
     <p className="mt-2 text-lg font-bold text-stone-700">{content.quick_example.vi}</p>
    </section>
   )}

   <Section title="Giải thích">{content.explanation || "Chưa có giải thích."}</Section>
   <ListSection title="Cấu trúc" items={content.structures} />
   <ListSection title="Cách dùng / Lưu ý" items={content.usage_notes} />
   <ListSection title="Lỗi thường gặp" items={content.common_mistakes} />
   <ListSection title="So sánh" items={content.comparisons} />

   <div className="mt-5 grid gap-3 sm:grid-cols-2">
    <ActionButton onClick={onAgain} tone="neutral" icon={XCircle}>Cần học lại</ActionButton>
    <ActionButton onClick={onRemember} icon={Check}>Đã hiểu</ActionButton>
   </div>
  </article>
 );
}

function PracticePanel({ point, exercise, exerciseIndex, exerciseCount, answer, selectedChoice, checked, correct, onAnswerChange, onChoiceChange, onCheck, onNext }: { point: GrammarPointWithProgress; exercise: DbGrammarExercise | null; exerciseIndex: number; exerciseCount: number; answer: string; selectedChoice: string | null; checked: boolean; correct: boolean | null; onAnswerChange: (value: string) => void; onChoiceChange: (value: string) => void; onCheck: () => void; onNext: () => void }) {
 if (!exercise) {
  return <EmptyState title="Chưa có bài tập" description="Bấm Tạo 10+ câu để sinh bộ luyện tập cho điểm ngữ pháp này." compact />;
 }
 const content = (exercise.content || {}) as GrammarExerciseContent;
 const choices = content.choices || [];
 return (
  <article className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">Luyện tập</p>
     <h3 className="mt-1 text-2xl font-black text-stone-900">{exerciseLabels[exercise.exercise_type]}</h3>
     <p className="mt-1 text-sm font-bold text-stone-500">{point.title} · {exerciseIndex + 1}/{exerciseCount || point.exercises.length}</p>
    </div>
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">{exercise.exercise_type}</span>
   </div>
   <div className="mt-5 rounded-[24px] bg-stone-50 p-5">
    <p className="text-lg font-black leading-8 text-stone-900">{exercise.prompt}</p>
   </div>

   {exercise.exercise_type === "multiple_choice" || choices.length ? (
    <div className="mt-5 grid gap-3">
     {choices.map((choice) => {
      const isSelected = selectedChoice === choice.id;
      const correctChoice = String(exercise.answer?.choice || exercise.answer?.id || "").toLowerCase();
      const isCorrect = checked && correctChoice && choice.id.toLowerCase() === correctChoice;
      return (
       <button key={choice.id} type="button" disabled={checked} onClick={() => onChoiceChange(choice.id)} className={cn("flex min-h-16 items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-theme-sm transition", !checked && "border-stone-200 hover:border-red-300 hover:bg-red-50/30", isSelected && !checked && "border-red-400 bg-red-50", checked && isCorrect && "border-emerald-400 bg-emerald-50", checked && isSelected && !isCorrect && "border-red-400 bg-red-50")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-sm font-black text-stone-600">{choice.id}</span>
        <span className="text-lg font-black text-stone-800">{choice.text}</span>
       </button>
      );
     })}
    </div>
   ) : exercise.exercise_type === "reorder_sentence" && content.tokens?.length ? (
    <div className="mt-5">
     <div className="mb-3 flex flex-wrap gap-2">
      {content.tokens.map((token) => <span key={token} className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-black text-stone-700">{token}</span>)}
     </div>
     <Input value={answer} onChange={(event) => onAnswerChange(event.target.value)} disabled={checked} placeholder="Nhập câu đã sắp xếp..." className="h-14 rounded-2xl border-2 border-stone-200 text-base font-bold" />
    </div>
   ) : (
    <Input value={answer} onChange={(event) => onAnswerChange(event.target.value)} disabled={checked} placeholder="Nhập câu trả lời..." className="mt-5 h-14 rounded-2xl border-2 border-stone-200 text-base font-bold" />
   )}

   {checked && (
    <div className={cn("mt-5 rounded-2xl border-2 p-4", correct ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50")}>
     <p className="text-sm font-black text-stone-900">{correct ? "Đúng rồi" : "Chưa đúng, xem lại đáp án mẫu."}</p>
     {getAnswerText(exercise) && <p className="mt-1 text-sm font-bold text-stone-700">Đáp án: {getAnswerText(exercise)}</p>}
     {exercise.explanation && <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{exercise.explanation}</p>}
    </div>
   )}

   <div className="mt-5 flex flex-wrap gap-3">
    {!checked ? <ActionButton onClick={onCheck} icon={Check}>Kiểm tra</ActionButton> : <ActionButton onClick={onNext} icon={CheckCircle2}>Tiếp tục</ActionButton>}
   </div>
 </article>
);
}

function LessonVocabularyPanel({ vocabulary }: { vocabulary: VocabEntryWithProgress[] }) {
 return <VocabularyMiniList entries={vocabulary} />;
}

function AllGrammarWorkspace({ points, searchQuery, filter, onSearchChange, onFilterChange, onEdit, onAddPoint }: { points: GrammarPointWithProgress[]; lessons: GrammarLessonWithStats[]; searchQuery: string; filter: PointFilter; onSearchChange: (value: string) => void; onFilterChange: (value: PointFilter) => void; onEdit: (point: GrammarPointWithProgress) => void; onAddPoint: () => void }) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">Kho ngữ pháp</p>
     <h2 className="text-3xl font-black text-stone-900">Tất cả ngữ pháp</h2>
    </div>
    <ActionButton onClick={onAddPoint} icon={Plus}>Thêm ngữ pháp</ActionButton>
   </div>
   <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
    <div className="relative">
     <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
     <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm theo tên, pinyin, tag..." className="h-12 rounded-2xl border-2 border-stone-200 pl-12 text-base font-bold" />
    </div>
    <div className="flex flex-wrap gap-2">
     {[
      ["all", "Tất cả"],
      ["new", "Chưa học"],
      ["learning", "Đang ôn"],
      ["mastered", "Thành thạo"],
      ["missing", "Thiếu dữ liệu"],
     ].map(([key, label]) => (
      <button key={key} type="button" onClick={() => onFilterChange(key as PointFilter)} className={cn("h-10 rounded-2xl border-2 px-3 text-sm font-black shadow-theme-sm", filter === key ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50")}>{label}</button>
     ))}
    </div>
   </div>
   <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {points.map((point) => <PointCard key={point.id} point={point} onEdit={() => onEdit(point)} />)}
   </div>
  </section>
 );
}

function PointCard({ point, onEdit }: { point: GrammarPointWithProgress; onEdit: () => void }) {
 return (
  <article className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
     <h3 className="truncate text-3xl font-black text-stone-900">{point.title}</h3>
     <p className="mt-1 truncate text-sm font-black text-red-500">{point.pinyin || point.level || "Ngữ pháp"}</p>
    </div>
    <StatusPill status={point.status} />
   </div>
   <p className="mt-3 line-clamp-2 min-h-11 text-sm font-bold leading-6 text-stone-600">{getPointSubtitle(point)}</p>
   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">{point.category || "Ngữ pháp"} · {point.exercises.length} bài tập</span>
    <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-stone-600 hover:bg-stone-100"><PenLine className="h-4 w-4" />Sửa</button>
   </div>
  </article>
 );
}

function LessonEditWorkspace({ lessons, onEditLesson, onEditPoint, onAddLesson, onAddPoint, onImportLesson }: { lessons: GrammarLessonWithStats[]; onEditLesson: (lesson: GrammarLessonWithStats) => void; onEditPoint: (point: GrammarPointWithProgress) => void; onAddLesson: () => void; onAddPoint: (lesson: GrammarLessonWithStats) => void; onImportLesson: (lesson: GrammarLessonWithStats) => void }) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">Quản lý</p>
     <h2 className="text-3xl font-black text-stone-900">Chỉnh sửa bài ngữ pháp</h2>
    </div>
    <ActionButton onClick={onAddLesson} icon={Plus}>Thêm bài</ActionButton>
   </div>
   <div className="mt-5 grid gap-4">
    {lessons.map((lesson) => (
     <article key={lesson.id} className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
       <div>
        <h3 className="text-2xl font-black text-stone-900">{lesson.title}</h3>
        <p className="mt-1 text-sm font-bold text-stone-500">{lesson.lesson_key} · {lesson.points.length} điểm · order {lesson.lesson_order}</p>
       </div>
       <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => onAddPoint(lesson)} tone="neutral" icon={Plus}>Thêm điểm</ActionButton>
        <ActionButton onClick={() => onImportLesson(lesson)} tone="neutral" icon={Upload}>Import paste</ActionButton>
        <ActionButton onClick={() => onEditLesson(lesson)} tone="neutral" icon={PenLine}>Sửa bài</ActionButton>
       </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
       {lesson.points.slice(0, 12).map((point) => (
        <button key={point.id} type="button" onClick={() => onEditPoint(point)} className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-3 text-left hover:bg-white">
         <span className="block text-lg font-black text-stone-900">{point.title}</span>
         <span className="block truncate text-xs font-bold text-stone-500">{getPointSubtitle(point)}</span>
        </button>
       ))}
      </div>
     </article>
    ))}
   </div>
  </section>
 );
}

function LessonDrawer({ lesson, onClose, onSave, onDelete }: { lesson: GrammarLessonWithStats; onClose: () => void; onSave: (lesson: GrammarLessonWithStats) => void; onDelete: (lesson: GrammarLessonWithStats) => void }) {
 const [draft, setDraft] = useState(lesson);
 return (
  <Drawer title={lesson.id.startsWith("new-") ? "Thêm bài ngữ pháp" : "Sửa bài"} onClose={onClose}>
   <div className="grid gap-4">
    <Field label="Mã bài"><Input value={draft.lesson_key} onChange={(event) => setDraft({ ...draft, lesson_key: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Số bài"><Input type="number" value={draft.lesson_number || ""} onChange={(event) => setDraft({ ...draft, lesson_number: event.target.value ? Number(event.target.value) : null })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Tên bài"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Thứ tự"><Input type="number" value={draft.lesson_order} onChange={(event) => setDraft({ ...draft, lesson_order: Number(event.target.value) })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Mô tả"><Textarea value={draft.description || ""} onChange={(value) => setDraft({ ...draft, description: value })} /></Field>
    <div className="rounded-2xl bg-stone-50 p-4"><p className="text-sm font-black text-stone-700">{lesson.points.length} điểm ngữ pháp trong bài</p></div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!lesson.id.startsWith("new-") && <ActionButton onClick={() => onDelete(lesson)} tone="neutral" icon={Trash2}>Xoá bài</ActionButton>}
     <ActionButton onClick={onClose} tone="neutral">Huỷ</ActionButton>
     <ActionButton onClick={() => onSave(draft)}>Lưu bài</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

type ExerciseDraft = {
 id?: string;
 exercise_type: GrammarExerciseType;
 prompt: string;
 answerText: string;
 explanation: string;
};

function PointDrawer({ point, lessons, onClose, onSave, onDelete }: { point: GrammarPointWithProgress; lessons: GrammarLessonWithStats[]; onClose: () => void; onSave: (point: GrammarPointWithProgress, exercises: ExerciseDraft[]) => void; onDelete: (point: GrammarPointWithProgress) => void }) {
 const queryClient = useQueryClient();
 const [draft, setDraft] = useState(point);
 const [tagsText, setTagsText] = useState(point.tags.join(", "));
 const [structuresText, setStructuresText] = useState((point.content.structures || []).join("\n"));
 const [usageText, setUsageText] = useState((point.content.usage_notes || []).join("\n"));
 const [mistakesText, setMistakesText] = useState((point.content.common_mistakes || []).join("\n"));
 const [comparisonsText, setComparisonsText] = useState((point.content.comparisons || []).join("\n"));
 const [isFillingAi, setIsFillingAi] = useState(false);
 const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>(() => point.exercises.map((exercise) => ({
  id: exercise.id,
  exercise_type: exercise.exercise_type,
  prompt: exercise.prompt,
  answerText: getAnswerText(exercise),
  explanation: exercise.explanation || "",
 })));

 const updateContent = (patch: Partial<GrammarPointContent>) => setDraft((current) => ({ ...current, content: { ...current.content, ...patch } }));
 const save = () => onSave({
  ...draft,
  tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
  content: {
   ...draft.content,
   structures: lines(structuresText),
   usage_notes: lines(usageText),
   common_mistakes: lines(mistakesText),
   comparisons: lines(comparisonsText),
  },
 }, exerciseDrafts);
 const fillMissing = async () => {
  if (point.id.startsWith("new-")) {
   toast.message("Lưu ngữ pháp trước rồi mới bổ sung AI phần thiếu.");
   return;
  }
  setIsFillingAi(true);
  try {
   const response = await fetch(`/api/grammar/points/${point.id}/fill-missing`, { method: "POST" });
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    point?: GrammarPointWithProgress;
    insertedExercises?: DbGrammarExercise[];
   } | null;
   if (!response.ok || !result?.point) {
    throw new Error(result?.error || "Không bổ sung được AI");
   }
   const nextContent = result.point.content || draft.content;
   setDraft((current) => ({ ...current, content: nextContent }));
   setStructuresText((nextContent.structures || []).join("\n"));
   setUsageText((nextContent.usage_notes || []).join("\n"));
   setMistakesText((nextContent.common_mistakes || []).join("\n"));
   setComparisonsText((nextContent.comparisons || []).join("\n"));
   if (result.insertedExercises?.length) {
    setExerciseDrafts(result.insertedExercises.map((exercise) => ({
     id: exercise.id,
     exercise_type: exercise.exercise_type,
     prompt: exercise.prompt,
     answerText: getAnswerText(exercise),
     explanation: exercise.explanation || "",
   })));
   }
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
   toast.success("Đã bổ sung phần thiếu, dữ liệu cũ được giữ nguyên");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không bổ sung được AI");
  } finally {
   setIsFillingAi(false);
  }
 };

 return (
  <Drawer title={point.id.startsWith("new-") ? "Thêm ngữ pháp" : `Sửa ${point.title}`} onClose={onClose}>
   <div className="grid gap-4">
    <div className="rounded-[24px] border-2 border-blue-200 bg-blue-50 p-4">
     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
       <p className="text-sm font-black text-blue-800">Bổ sung AI phần thiếu</p>
       <p className="mt-1 text-xs font-bold leading-5 text-blue-700">Chỉ fill ô trống như giải thích, cấu trúc, ví dụ hoặc bài tập. Nội dung đã có sẽ không bị ghi đè.</p>
      </div>
      <ActionButton onClick={fillMissing} tone="neutral" icon={Sparkles} loading={isFillingAi} disabled={point.id.startsWith("new-")}>
       Bổ sung AI
      </ActionButton>
     </div>
    </div>
    <Field label="Bài">
     <Select value={draft.lesson_id || ""} onChange={(event) => setDraft({ ...draft, lesson_id: event.target.value || null })} className="h-11 text-sm">
      {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
     </Select>
    </Field>
    <Field label="Tên ngữ pháp / Hán tự"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value, hanzi: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Pinyin"><Input value={draft.pinyin || ""} onChange={(event) => setDraft({ ...draft, pinyin: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <Field label="Tên tiếng Việt"><Input value={draft.vietnamese_title || ""} onChange={(event) => setDraft({ ...draft, vietnamese_title: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <div className="grid gap-4 md:grid-cols-3">
     <Field label="Level"><Input value={draft.level || ""} onChange={(event) => setDraft({ ...draft, level: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
     <Field label="Loại"><Input value={draft.category || ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
     <Field label="Thứ tự"><Input type="number" value={draft.row_number} onChange={(event) => setDraft({ ...draft, row_number: Number(event.target.value) })} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    </div>
    <Field label="Tags"><Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="h-11 rounded-2xl border-2 border-stone-200 font-bold" /></Field>
    <div className="rounded-[24px] border-2 border-stone-200 p-4">
     <p className="mb-3 text-sm font-black text-stone-900">Ví dụ nhanh</p>
     <div className="grid gap-3">
      <Input value={draft.content.quick_example?.zh || ""} onChange={(event) => updateContent({ quick_example: { ...draft.content.quick_example, zh: event.target.value } })} placeholder="我们都去。" className="h-11 rounded-2xl border-2 border-stone-200 font-bold" />
      <Input value={draft.content.quick_example?.pinyin || ""} onChange={(event) => updateContent({ quick_example: { ...draft.content.quick_example, pinyin: event.target.value } })} placeholder="Wǒmen dōu qù." className="h-11 rounded-2xl border-2 border-stone-200 font-bold" />
      <Input value={draft.content.quick_example?.vi || ""} onChange={(event) => updateContent({ quick_example: { ...draft.content.quick_example, vi: event.target.value } })} placeholder="Chúng tôi đều đi." className="h-11 rounded-2xl border-2 border-stone-200 font-bold" />
     </div>
    </div>
    <Field label="Giải thích"><Textarea value={draft.content.explanation || ""} onChange={(value) => updateContent({ explanation: value })} rows={5} /></Field>
    <Field label="Cấu trúc"><Textarea value={structuresText} onChange={setStructuresText} /></Field>
    <Field label="Cách dùng / lưu ý"><Textarea value={usageText} onChange={setUsageText} /></Field>
    <Field label="Lỗi thường gặp"><Textarea value={mistakesText} onChange={setMistakesText} /></Field>
    <Field label="So sánh"><Textarea value={comparisonsText} onChange={setComparisonsText} /></Field>
    <div className="rounded-[24px] border-2 border-stone-200 p-4">
     <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-black text-stone-900">Bài tập</p>
      <ActionButton onClick={() => setExerciseDrafts((current) => [...current, { exercise_type: "fill_blank", prompt: "", answerText: "", explanation: "" }])} tone="neutral" icon={Plus}>Thêm</ActionButton>
     </div>
     <div className="grid gap-3">
      {exerciseDrafts.map((exercise, index) => (
       <div key={`${exercise.id || "new"}-${index}`} className="rounded-2xl bg-stone-50 p-3">
        <Select value={exercise.exercise_type} onChange={(event) => setExerciseDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, exercise_type: event.target.value as GrammarExerciseType } : item))} className="mb-2 h-10 rounded-xl text-sm">
         {Object.entries(exerciseLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
        <Textarea value={exercise.prompt} onChange={(value) => setExerciseDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: value } : item))} rows={2} placeholder="Prompt bài tập..." />
        <Input value={exercise.answerText} onChange={(event) => setExerciseDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, answerText: event.target.value } : item))} placeholder="Đáp án đúng / đáp án mẫu" className="mt-2 h-10 rounded-xl border-2 border-stone-200 font-bold" />
        <Input value={exercise.explanation} onChange={(event) => setExerciseDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, explanation: event.target.value } : item))} placeholder="Giải thích sau khi check" className="mt-2 h-10 rounded-xl border-2 border-stone-200 font-bold" />
        <button type="button" onClick={() => setExerciseDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-2 text-xs font-black text-red-500">Xoá bài tập</button>
       </div>
      ))}
     </div>
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!point.id.startsWith("new-") && <ActionButton onClick={() => onDelete(point)} tone="neutral" icon={Trash2}>Xoá</ActionButton>}
     <ActionButton onClick={onClose} tone="neutral">Huỷ</ActionButton>
     <ActionButton onClick={save}>Lưu ngữ pháp</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

function ImportDrawer({ lesson, onClose, onImport }: { lesson: GrammarLessonWithStats; onClose: () => void; onImport: (text: string) => void }) {
 const [text, setText] = useState("");
 return (
  <Drawer title={`Import ngữ pháp vào ${lesson.title}`} onClose={onClose}>
   <div className="grid gap-4">
    <Field label="Dán block markdown từ AI">
     <Textarea
      value={text}
      onChange={setText}
      rows={18}
      placeholder={"## 都 – dōu – Phó từ \"đều\", \"tất cả\"\n*HSK 1 · Phó từ*\n\n**1. Ví dụ nhanh**\n我们都去。(Wǒmen dōu qù.)\nChúng tôi đều đi.\n\n**2. Giải thích**\n...\n\n**3. Cấu trúc**\n- Chủ ngữ + 都 + vị ngữ\n\n**7. Bài tập**\n- 我们 ___ 是老师。"}
     />
    </Field>
    <div className="rounded-2xl bg-stone-50 p-4 text-sm font-bold leading-6 text-stone-600">
     Parser nhận nhiều block bắt đầu bằng <span className="font-black">##</span>. Mỗi block sẽ thành một điểm ngữ pháp, mục Bài tập sẽ tự tạo exercise.
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     <ActionButton onClick={onClose} tone="neutral">Huỷ</ActionButton>
     <ActionButton onClick={() => onImport(text)} icon={Upload} disabled={!text.trim()}>Import</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

async function syncExercises(pointId: string, courseId: string, lessonId: string | null, existing: DbGrammarExercise[], drafts: ExerciseDraft[]) {
 const keepIds = new Set(drafts.map((draft) => draft.id).filter(Boolean));
 await Promise.all(existing.filter((exercise) => !keepIds.has(exercise.id)).map((exercise) => fetch(`/api/grammar/exercises/${exercise.id}`, { method: "DELETE" })));
 await Promise.all(drafts.filter((draft) => draft.prompt.trim()).map((draft, index) => {
  const body = {
   course_id: courseId,
   lesson_id: lessonId,
   point_id: pointId,
   exercise_type: draft.exercise_type,
   prompt: draft.prompt,
   content: buildExerciseContent(draft),
   answer: buildExerciseAnswer(draft),
   explanation: draft.explanation,
   exercise_order: index + 1,
  };
  return fetch(draft.id ? `/api/grammar/exercises/${draft.id}` : "/api/grammar/exercises", {
   method: draft.id ? "PATCH" : "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(body),
  });
 }));
}

function buildExerciseContent(draft: ExerciseDraft): GrammarExerciseContent {
 if (draft.exercise_type === "multiple_choice") {
  const choices = draft.prompt
   .split("\n")
   .filter((line) => /^[A-D][\).]/.test(line.trim()))
   .map((line) => ({ id: line.trim().slice(0, 1), text: line.trim().slice(2).trim() }));
  return { choices };
 }
 if (draft.exercise_type === "reorder_sentence") return { tokens: draft.answerText.split(/\s+/).filter(Boolean) };
 if (draft.exercise_type === "fill_blank") return { accepted_answers: draft.answerText.split(/[;,]/).map((item) => item.trim()).filter(Boolean) };
 return { sample_answer: draft.answerText };
}

function buildExerciseAnswer(draft: ExerciseDraft) {
 if (draft.exercise_type === "multiple_choice") return { choice: draft.answerText.trim().slice(0, 1).toUpperCase() };
 return { text: draft.answerText.trim() };
}

function evaluateExercise(exercise: DbGrammarExercise, answer: string, selectedChoice: string | null) {
 const content = (exercise.content || {}) as GrammarExerciseContent;
 if (exercise.exercise_type === "multiple_choice" || content.choices?.length) {
  return selectedChoice?.toLowerCase() === String(exercise.answer?.choice || exercise.answer?.id || "").toLowerCase();
 }
 if (exercise.exercise_type === "translate_zh") {
  const normalized = normalize(answer);
  const required = content.required_terms || [];
  if (required.length) return required.every((term) => normalized.includes(normalize(term)));
  const sample = String(exercise.answer?.text || content.sample_answer || "");
  return sample ? normalize(sample) === normalized : Boolean(answer.trim());
 }
 if (exercise.exercise_type === "reorder_sentence") {
  const sample = String(exercise.answer?.text || content.sample_answer || "");
  return sample ? normalize(sample) === normalize(answer) : Boolean(answer.trim());
 }
 const accepted = content.accepted_answers || [String(exercise.answer?.text || "")].filter(Boolean);
 if (!accepted.length) return true;
 const normalized = normalize(answer);
 return accepted.some((item) => normalize(item) === normalized);
}

function getCoachQuiz(point: GrammarPointWithProgress) {
 const contentQuiz = point.content.quiz;
 if (contentQuiz?.q && contentQuiz.choices?.length) {
  const exercise = point.exercises.find((item) => item.exercise_type === "multiple_choice");
  return {
   prompt: contentQuiz.q,
   choices: contentQuiz.choices,
   answerIndex: Number.isFinite(contentQuiz.a) ? Number(contentQuiz.a) : 0,
   exerciseId: exercise?.id,
  };
 }
 const exercise = point.exercises.find((item) => item.exercise_type === "multiple_choice");
 const content = (exercise?.content || {}) as GrammarExerciseContent;
 const choices = content.choices?.map((choice) => choice.text) || [];
 const answerText = typeof exercise?.answer?.text === "string" ? exercise.answer.text : "";
 const answerIndex = Math.max(0, choices.findIndex((choice) => normalize(choice) === normalize(answerText)));
 if (exercise && choices.length) {
  return {
   prompt: exercise.prompt,
   choices,
   answerIndex,
   exerciseId: exercise.id,
  };
 }
 return null;
}

function getAnswerText(exercise: DbGrammarExercise) {
 const content = (exercise.content || {}) as GrammarExerciseContent;
 return String(exercise.answer?.text || exercise.answer?.choice || content.sample_answer || content.accepted_answers?.join(", ") || "");
}

function normalize(value: string) {
 return value.trim().toLowerCase().replace(/\s+/g, "").replace(/[，。！？、,.!?]/g, "");
}

function lines(value: string) {
 return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
  <section className="mt-6">
   <p className="text-sm font-black uppercase tracking-wide text-stone-500">{title}</p>
   <div className="mt-3 rounded-[20px] border-2 border-stone-200 bg-white p-4 text-base font-bold leading-8 text-stone-700">{children}</div>
  </section>
 );
}

function ListSection({ title, items }: { title: string; items?: string[] }) {
 if (!items?.length) return null;
 return (
  <section className="mt-6">
   <p className="text-sm font-black uppercase tracking-wide text-stone-500">{title}</p>
   <div className="mt-3 grid gap-2">
    {items.map((item) => <p key={item} className="rounded-2xl bg-stone-50 p-3 text-sm font-bold leading-6 text-stone-700">{item}</p>)}
   </div>
  </section>
 );
}

function StatBox({ value, label, tone }: { value: number; label: string; tone: "yellow" | "blue" | "green" }) {
 const className = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return <div className={cn("min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm", className)}><p className="text-2xl font-black">{value}</p><p className="text-xs font-black">{label}</p></div>;
}

function StatusPill({ status }: { status: GrammarPointWithProgress["status"] }) {
 const className = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return <span className={cn("rounded-full border-2 px-2.5 py-1 text-xs font-black", className)}>{label}</span>;
}

function ActionButton({ children, onClick, icon: Icon, loading, disabled, tone = "red" }: { children: React.ReactNode; onClick: () => void; icon?: LucideIcon; loading?: boolean; disabled?: boolean; tone?: "red" | "neutral" }) {
 const className = tone === "red" ? "border-red-500 bg-red-500 text-white hover:bg-red-600" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50";
 return <button type="button" onClick={onClick} disabled={loading || disabled} className={cn("inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-4 text-sm font-black shadow-theme-sm transition disabled:opacity-60", className)}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}{children}</button>;
}

function IconToolButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
 return <button type="button" title={label} onClick={onClick} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm hover:bg-stone-50"><Icon className="h-5 w-5" /></button>;
}

function EmptyState({ title, description, action, compact }: { title: string; description: string; action?: React.ReactNode; compact?: boolean }) {
 return (
  <div className={cn("flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-stone-200 bg-white p-8 text-center", compact ? "min-h-80" : "min-h-[520px] shadow-theme-md")}>
   <Sparkles className="h-12 w-12 text-stone-300" />
   <h2 className="mt-4 text-2xl font-black text-stone-900">{title}</h2>
   <p className="mt-2 max-w-md text-sm font-bold leading-6 text-stone-500">{description}</p>
   {action && <div className="mt-5">{action}</div>}
  </div>
 );
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
 return <LearningDrawer title={title} onClose={onClose}>{children}</LearningDrawer>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
 return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>{children}</label>;
}

function Textarea({ value, onChange, rows = 4, placeholder }: { value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
 return <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} className="w-full rounded-2xl border-2 border-stone-200 bg-white p-3 text-sm font-bold leading-6 text-stone-800 outline-none focus:border-red-300" />;
}

function MobileLessonSheet({ open, lessons, activeLessonId, onClose, onSelect }: { open: boolean; lessons: GrammarLessonWithStats[]; activeLessonId?: string; onClose: () => void; onSelect: (lesson: GrammarLessonWithStats) => void }) {
 if (!open) return null;
 return (
  <div className="fixed inset-0 z-50 lg:hidden">
   <div className="absolute inset-0 bg-stone-900/30" onClick={onClose} />
   <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl">
    <div className="mb-4 flex items-center justify-between"><p className="text-lg font-black text-stone-900">Chọn bài</p><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div>
    <div className="grid gap-3">
     {lessons.map((lesson) => (
      <button key={lesson.id} type="button" onClick={() => onSelect(lesson)} className={cn("rounded-2xl border-2 p-4 text-left font-black", lesson.id === activeLessonId ? "border-red-500 bg-red-50 text-red-600" : "border-stone-200 bg-white text-stone-700")}>{lesson.title}<span className="ml-2 text-sm text-stone-500">{lesson.points.length} điểm</span></button>
     ))}
    </div>
   </div>
  </div>
 );
}
