"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
 GrammarCourseWithLessons,
 GrammarLessonWithStats,
 GrammarPointWithProgress,
 VocabCourseWithLessons,
} from "@/types/database";
import {
 GrammarSchemaMissingError,
 useGrammarPoints,
} from "@/features/grammar/hooks/useGrammarPoints";
import type { GrammarPointFilter } from "@/features/grammar/components/GrammarAdminWorkspaces";
import type {
 GrammarMainTab,
 GrammarSource,
} from "@/features/grammar/components/GrammarLearningHeader";
import type { CoachTab } from "@/features/grammar/components/GrammarCoachCard";
import type {
 CoachOrder,
 CoachStatusFilter,
} from "@/features/grammar/components/GrammarCoachWorkspace";
import {
 findGrammarLessonFromQuery,
 findVocabLessonForGrammar,
 getLessonWorkspaceContext,
 learningRoutes,
 parseLearningSource,
 parseLessonNumber,
} from "@/features/learning/lesson-workspace";
import {
 getCoachQuiz,
 type ExerciseDraft,
} from "@/features/grammar/utils/exercise";
import { syncExercises } from "@/features/grammar/utils/sync-exercises";
import {
 lessonNumberForPoint,
 matchesPoint,
 pointCoachScore,
 pointHasMissingData,
 stablePointHash,
} from "@/features/grammar/utils/point";
import { applyProgress } from "@/features/grammar/utils/progress";
import { useVocabEntries } from "@/features/vocabulary";

type MainTab = GrammarMainTab;
type PointFilter = GrammarPointFilter;
type VocabCourseOption = {
 id: string;
 course_key: string;
 title: string;
 source_file: string;
 imported_at?: string;
};

function isCoursePayload(
 data:
  | GrammarCourseWithLessons
  | { course: null; lessons: []; points: []; exercises: [] }
  | undefined,
): data is GrammarCourseWithLessons {
 return Boolean(data && "id" in data);
}

function isVocabCoursePayload(data: unknown): data is VocabCourseWithLessons {
 return Boolean(
  data &&
   typeof data === "object" &&
   "id" in data &&
   "lessons" in data &&
   "entries" in data,
 );
}

export function useGrammarPageController() {
 const searchParams = useSearchParams();
 const querySource = parseLearningSource(searchParams.get("source"));
 const queryLessonNumber = parseLessonNumber(searchParams.get("lesson"));
 const queryLessonKey = searchParams.get("lessonKey");
 const queryPointId = searchParams.get("pointId");
 const hasLessonQuery = Boolean(queryLessonNumber || queryLessonKey || queryPointId);
 const queryClient = useQueryClient();
 const { data, isLoading, error } = useGrammarPoints();
 const { data: vocabCourses = [] } = useQuery({
  queryKey: ["vocab-courses"],
  queryFn: async () => {
   const response = await fetch("/api/vocab/courses");
   const result = (await response.json().catch(() => null)) as {
    courses?: VocabCourseOption[];
    error?: string;
   } | null;
   if (!response.ok)
    throw new Error(result?.error || "Không tải được danh sách nguồn từ vựng");
   return result?.courses || [];
  },
  staleTime: 1000 * 30,
 });
 const course = isCoursePayload(data) ? data : null;

 const [activeTab, setActiveTab] = useState<MainTab>("study");
 const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [filter, setFilter] = useState<PointFilter>("all");
 const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
 const [editingLesson, setEditingLesson] =
  useState<GrammarLessonWithStats | null>(null);
 const [editingPoint, setEditingPoint] =
  useState<GrammarPointWithProgress | null>(null);
 const [importingLesson, setImportingLesson] =
  useState<GrammarLessonWithStats | null>(null);
 const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
 const [exerciseChecked, setExerciseChecked] = useState(false);
 const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null);
 const [isImportingHanyu, setIsImportingHanyu] = useState(false);
 const [isImportingCoachJson, setIsImportingCoachJson] = useState(false);
 const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
 const [sessionStats, setSessionStats] = useState({
  answered: 0,
  correct: 0,
  wrong: 0,
 });
 const [coachFromLesson, setCoachFromLesson] = useState(11);
 const [coachToLesson, setCoachToLesson] = useState(25);
 const [coachTag, setCoachTag] = useState("all");
 const [coachStatus, setCoachStatus] = useState<CoachStatusFilter>("all");
 const [coachOrder, setCoachOrder] = useState<CoachOrder>("lesson");
 const [coachTab, setCoachTab] = useState<CoachTab>("logic");
 const [coachIndex, setCoachIndex] = useState(0);
 const [source, setSource] = useState<GrammarSource>(querySource);

 const selectedVocabCourse = useMemo(() => {
  if (source === "hsk") {
   return vocabCourses.find((item) => item.course_key.includes("hsk")) || null;
  }
  return vocabCourses.find((item) => !item.course_key.includes("hsk")) || null;
 }, [source, vocabCourses]);
 const { data: vocabData } = useVocabEntries(selectedVocabCourse?.id);
 const vocabCourse = isVocabCoursePayload(vocabData) ? vocabData : null;

 const lessons = useMemo(() => course?.lessons || [], [course?.lessons]);
 const activeLesson = useMemo(
  () =>
   lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null,
  [activeLessonId, lessons],
 );
 const lessonById = useMemo(
  () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
  [lessons],
 );
 const lessonNumbers = useMemo(
  () =>
   lessons
    .map((lesson) => lesson.lesson_number)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b),
  [lessons],
 );
 const coachTags = useMemo(() => {
  const tags = new Set<string>();
  course?.points.forEach((point) =>
   point.tags.forEach((tag) => {
    if (!/^Bài\s+\d+/i.test(tag) && tag !== "Hán ngữ 2") tags.add(tag);
   }),
  );
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
 }, [course?.points]);
 const coachPoints = useMemo(() => {
  const points = [...(course?.points || [])].filter((point) => {
   const lessonNumber = lessonNumberForPoint(point, lessonById);
   if (lessonNumber < coachFromLesson || lessonNumber > coachToLesson)
    return false;
   if (!matchesPoint(point, searchQuery)) return false;
   if (coachTag !== "all" && !point.tags.includes(coachTag)) return false;
   if (coachStatus === "ok" && point.status !== "mastered") return false;
   if (coachStatus === "weak" && point.status !== "learning") return false;
   if (coachStatus === "new" && point.status !== "new") return false;
   return true;
  });
  if (coachOrder === "hard") {
   return points.sort(
    (a, b) =>
     pointCoachScore(a) - pointCoachScore(b) ||
     lessonNumberForPoint(a, lessonById) -
      lessonNumberForPoint(b, lessonById) ||
     a.row_number - b.row_number,
   );
  }
  if (coachOrder === "random") {
   return points.sort((a, b) => stablePointHash(a.id) - stablePointHash(b.id));
  }
  return points.sort(
   (a, b) =>
    lessonNumberForPoint(a, lessonById) - lessonNumberForPoint(b, lessonById) ||
    a.row_number - b.row_number,
  );
 }, [
  coachFromLesson,
  coachOrder,
  coachStatus,
  coachTag,
  coachToLesson,
  course?.points,
  lessonById,
  searchQuery,
 ]);
 const coachPoint = coachPoints[coachIndex] || coachPoints[0] || null;
 const coachLesson = coachPoint?.lesson_id
  ? lessonById.get(coachPoint.lesson_id) || activeLesson
  : activeLesson;
 const workspaceVocabularyLesson = useMemo(
  () =>
   findVocabLessonForGrammar({
    vocabCourse,
    grammarCourse: course,
    grammarLesson: coachLesson,
   }),
  [coachLesson, course, vocabCourse],
 );
 const coachVocabulary = useMemo(() => {
  if (workspaceVocabularyLesson?.entries)
   return workspaceVocabularyLesson.entries.slice(0, 28);
  if (!coachLesson || !vocabData || !("entries" in vocabData)) return [];
  return (vocabData.entries || [])
   .filter((entry) => entry.source.lessonNumber === coachLesson.lesson_number)
   .slice(0, 28);
 }, [coachLesson, vocabData, workspaceVocabularyLesson?.entries]);
 const coachStats = useMemo(
  () => ({
   range: `${coachFromLesson}-${coachToLesson}`,
   filtered: coachPoints.length,
   mastered: coachPoints.filter((point) => point.status === "mastered").length,
   weak: coachPoints.filter((point) => point.status === "learning").length,
   practice: sessionStats.correct,
  }),
  [coachFromLesson, coachPoints, coachToLesson, sessionStats.correct],
 );
 const lessonWorkspace = useMemo(
  () =>
   getLessonWorkspaceContext({
    module: "grammar",
    source,
    grammarCourse: course,
    vocabularyCourse: vocabCourse,
    grammarLesson: coachLesson,
    vocabularyLesson: workspaceVocabularyLesson,
    vocabularyEntries: isVocabCoursePayload(vocabData) ? vocabData.entries : [],
    pointId: coachPoint?.id,
   }),
  [
   coachLesson,
   coachPoint?.id,
   course,
   source,
   vocabCourse,
   vocabData,
   workspaceVocabularyLesson,
  ],
 );
 const hubLessons = useMemo(
  () =>
   lessons.map((lesson) => {
    const vocabularyLesson = findVocabLessonForGrammar({
     vocabCourse,
     grammarCourse: course,
     grammarLesson: lesson,
    });
    return {
     id: lesson.id,
     title: lesson.title,
     subtitle: lesson.description || lesson.categories?.[0]?.name,
     href: learningRoutes.grammar({
      source,
      lessonNumber: lesson.lesson_number,
      lessonKey: lesson.lesson_key,
     }),
     lessonNumber: lesson.lesson_number,
     vocabularyCount: vocabularyLesson?.entries.length || 0,
     grammarCount: lesson.points.length,
     learnedCount: lesson.mastered,
     weakCount: lesson.learning,
     progress: lesson.progress,
    };
   }),
  [course, lessons, source, vocabCourse],
 );

 useEffect(() => {
  setSource(querySource);
 }, [querySource]);

 useEffect(() => {
  if (!lessons.length) return;
  const queryLesson = findGrammarLessonFromQuery(
   lessons,
   queryLessonNumber,
   queryLessonKey,
  );
  if (queryLesson && activeLessonId !== queryLesson.id) {
   setActiveLessonId(queryLesson.id);
   return;
  }
  if (!activeLessonId) setActiveLessonId(lessons[0].id);
 }, [activeLessonId, lessons, queryLessonKey, queryLessonNumber]);

 useEffect(() => {
  if (!lessonNumbers.length) return;
  setCoachFromLesson((current) =>
   lessonNumbers.includes(current) ? current : lessonNumbers[0],
  );
  setCoachToLesson((current) =>
   lessonNumbers.includes(current)
    ? current
    : lessonNumbers[lessonNumbers.length - 1],
  );
 }, [lessonNumbers]);

 useEffect(() => {
  setCoachIndex(0);
 }, [
  coachFromLesson,
  coachOrder,
  coachStatus,
  coachTag,
  coachToLesson,
  searchQuery,
 ]);

 useEffect(() => {
  if (coachIndex >= coachPoints.length)
   setCoachIndex(Math.max(0, coachPoints.length - 1));
 }, [coachIndex, coachPoints.length]);

 useEffect(() => {
  if (!queryPointId || !coachPoints.length) return;
  const queryIndex = coachPoints.findIndex((point) => point.id === queryPointId);
  if (queryIndex >= 0 && queryIndex !== coachIndex) setCoachIndex(queryIndex);
 }, [coachIndex, coachPoints, queryPointId]);

 const visiblePoints = useMemo(() => {
  const base =
   activeTab === "all" ? course?.points || [] : activeLesson?.points || [];
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
   queryClient.setQueryData(
    ["grammar-points"],
    applyProgress(course, point.id, nextLevel),
   );
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
  setSelectedChoice(null);
  setExerciseChecked(false);
  setExerciseCorrect(null);
 }, []);

 const goCoach = useCallback(
  (direction: 1 | -1) => {
   if (!coachPoints.length) return;
   setCoachIndex(
    (index) => (index + direction + coachPoints.length) % coachPoints.length,
   );
   setCoachTab("logic");
   resetExerciseState();
  },
  [coachPoints.length, resetExerciseState],
 );

 const markCoachPoint = useCallback(
  async (level: number, shouldAdvance = true) => {
   if (!coachPoint) return;
   await updateProgress(coachPoint, level);
   if (shouldAdvance) goCoach(1);
  },
  [coachPoint, goCoach, updateProgress],
 );

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
     submitted_answer: {
      choice: selectedChoice,
      text: quiz.choices[Number(selectedChoice)] || "",
     },
     is_correct: correct,
    }),
   }).catch(() => null);
  }
  await updateProgress(
   coachPoint,
   correct
    ? Math.min(coachPoint.proficiency_level + 1, 5)
    : Math.max(coachPoint.proficiency_level - 1, 0),
  );
 }, [coachPoint, selectedChoice, updateProgress]);

 useEffect(() => {
  if (activeTab !== "study") return;
  const handleKeyDown = (event: KeyboardEvent) => {
   const target = event.target as HTMLElement | null;
   if (target?.closest("input, textarea, select, [contenteditable=true]"))
    return;
   if (event.key === "ArrowRight") {
    event.preventDefault();
    goCoach(1);
   } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    goCoach(-1);
   } else if (["1", "2", "3", "4", "5"].includes(event.key)) {
    event.preventDefault();
    setCoachTab(
     (["logic", "formula", "examples", "traps", "practice"] as CoachTab[])[
      Number(event.key) - 1
     ],
    );
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
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    importedLessons?: number;
    importedPoints?: number;
   } | null;
   if (!response.ok) throw new Error(result?.error || "Import Np.md thất bại");
   toast.success(
    `Đã import ${result?.importedLessons || 0} bài, ${result?.importedPoints || 0} điểm ngữ pháp`,
   );
   setActiveLessonId(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Import Np.md thất bại",
   );
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
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    importedLessons?: number;
    importedPoints?: number;
    importedExercises?: number;
   } | null;
   if (!response.ok)
    throw new Error(result?.error || "Import grammar coach JSON thất bại");
   toast.success(
    `Đã import ${result?.importedLessons || 0} bài, ${result?.importedPoints || 0} điểm, ${result?.importedExercises || 0} quiz`,
   );
   setActiveLessonId(null);
   setCoachIndex(0);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(
    error instanceof Error
     ? error.message
     : "Import grammar coach JSON thất bại",
   );
  } finally {
   setIsImportingCoachJson(false);
  }
 }, [queryClient]);

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
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    inserted?: number;
   } | null;
   if (!response.ok) throw new Error(result?.error || "Không tạo được bài tập");
   toast.success(`Đã tạo ${result?.inserted || 0} câu luyện tập`);
   resetExerciseState();
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Không tạo được bài tập",
   );
  } finally {
   setIsGeneratingExercises(false);
  }
 }, [coachPoint, queryClient, resetExerciseState]);

 const saveLesson = useCallback(
  async (lesson: GrammarLessonWithStats) => {
   const isNew = lesson.id.startsWith("new-");
   const response = await fetch(
    isNew ? "/api/grammar/lessons" : `/api/grammar/lessons/${lesson.id}`,
    {
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
   toast.success("Đã lưu bài ngữ pháp");
   setEditingLesson(null);
   if (isNew && result?.lesson?.id) setActiveLessonId(result.lesson.id);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [course?.id, queryClient],
 );

 const deleteLesson = useCallback(
  async (lesson: GrammarLessonWithStats) => {
   if (
    !window.confirm(`Xoá "${lesson.title}" và toàn bộ ngữ pháp trong bài này?`)
   )
    return;
   const response = await fetch(`/api/grammar/lessons/${lesson.id}`, {
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
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [queryClient],
 );

 const savePoint = useCallback(
  async (point: GrammarPointWithProgress, exercises: ExerciseDraft[]) => {
   const isNew = point.id.startsWith("new-");
   const response = await fetch(
    isNew ? "/api/grammar/points" : `/api/grammar/points/${point.id}`,
    {
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
    },
   );
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    point?: GrammarPointWithProgress;
   } | null;
   if (!response.ok || !result?.point) {
    toast.error(result?.error || "Chưa lưu được điểm ngữ pháp");
    return;
   }
   const pointId = result.point.id;
   await syncExercises(
    pointId,
    point.course_id || course?.id || "",
    point.lesson_id || null,
    point.exercises,
    exercises,
   );
   toast.success("Đã lưu ngữ pháp");
   setEditingPoint(null);
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
  },
  [course?.id, queryClient],
 );

 const deletePoint = useCallback(
  async (point: GrammarPointWithProgress) => {
   if (!window.confirm(`Xoá ngữ pháp "${point.title}"?`)) return;
   const response = await fetch(`/api/grammar/points/${point.id}`, {
    method: "DELETE",
   });
   const result = (await response.json().catch(() => null)) as {
    error?: string;
   } | null;
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
  const nextOrder =
   Math.max(0, ...lessons.map((lesson) => lesson.lesson_order)) + 1;
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
   const result = (await response.json().catch(() => null)) as {
    imported?: number;
    error?: string;
   } | null;
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

 const selectLesson = useCallback((lesson: GrammarLessonWithStats) => {
  setActiveLessonId(lesson.id);
  setLessonSheetOpen(false);
 }, []);

 const selectCoachPoint = useCallback(
  (point: GrammarPointWithProgress) => {
   const nextIndex = coachPoints.findIndex(
    (candidate) => candidate.id === point.id,
   );
   if (nextIndex >= 0) setCoachIndex(nextIndex);
   setActiveLessonId(point.lesson_id || null);
   resetExerciseState();
  },
  [coachPoints, resetExerciseState],
 );

 const setCoachTabAndReset = useCallback(
  (tab: CoachTab) => {
   setCoachTab(tab);
   resetExerciseState();
  },
  [resetExerciseState],
 );

 return {
  source,
  setSource,
  activeTab,
  setActiveTab,
  isLoading,
  error,
  course,
  hasLessonQuery,
  lessons,
  hubLessons,
  activeLesson,
  lessonById,
  lessonWorkspace,
  visiblePoints,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  lessonSheetOpen,
  setLessonSheetOpen,
  editingLesson,
  setEditingLesson,
  editingPoint,
  setEditingPoint,
  importingLesson,
  setImportingLesson,
  selectedChoice,
  setSelectedChoice,
  exerciseChecked,
  exerciseCorrect,
  isImportingHanyu,
  isImportingCoachJson,
  isGeneratingExercises,
  coachFromLesson,
  setCoachFromLesson,
  coachToLesson,
  setCoachToLesson,
  coachTag,
  setCoachTag,
  coachStatus,
  setCoachStatus,
  coachOrder,
  setCoachOrder,
  coachTab,
  coachIndex,
  coachPoints,
  coachPoint,
  coachStats,
  coachTags,
  coachVocabulary,
  importHanyuGrammar,
  importCoachJson,
  generateCoachExerciseSet,
  saveLesson,
  deleteLesson,
  savePoint,
  deletePoint,
  createLessonDraft,
  createPointDraft,
  importPaste,
  selectLesson,
  selectCoachPoint,
  setCoachTabAndReset,
  checkCoachPractice,
  goCoach,
  markCoachPoint,
  resetExerciseState,
  isMissingSchemaError: error instanceof GrammarSchemaMissingError,
 };
}
