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
import { GrammarSchemaMissingError, useGrammarPoints } from "@/features/grammar/hooks/useGrammarPoints";
import { cn } from "@/lib/utils";
import type {
 DbGrammarExercise,
 GrammarCourseWithLessons,
 GrammarExerciseContent,
 GrammarExerciseType,
 GrammarLessonWithStats,
 GrammarPointContent,
 GrammarPointWithProgress,
} from "@/types/database";

type MainTab = "study" | "all" | "edit";
type SplitMode = "theory" | "practice" | "split";
type PointFilter = "all" | "new" | "learning" | "mastered" | "missing";

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
 const [exerciseAnswer, setExerciseAnswer] = useState("");
 const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
 const [exerciseChecked, setExerciseChecked] = useState(false);
 const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null);

 const lessons = useMemo(() => course?.lessons || [], [course?.lessons]);
 const activeLesson = useMemo(() => lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null, [activeLessonId, lessons]);
 const activePoint = useMemo(
  () => activeLesson?.points.find((point) => point.id === activePointId) || activeLesson?.points[0] || course?.points[0] || null,
  [activeLesson?.points, activePointId, course?.points],
 );
 const activeExercise = activePoint?.exercises[exerciseIndex] || activePoint?.exercises[0] || null;

 useEffect(() => {
  if (!activeLessonId && lessons[0]) setActiveLessonId(lessons[0].id);
 }, [activeLessonId, lessons]);

 useEffect(() => {
  setActivePointId(activeLesson?.points[0]?.id || null);
  setExerciseIndex(0);
 }, [activeLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
  await fetch(`/api/grammar/exercises/${activeExercise.id}/attempt`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    point_id: activeExercise.point_id,
    submitted_answer: { text: exerciseAnswer, choice: selectedChoice },
    is_correct: correct,
   }),
  }).catch(() => null);
  if (activePoint && correct) void updateProgress(activePoint, Math.min(activePoint.proficiency_level + 1, 5));
 }, [activeExercise, activePoint, exerciseAnswer, selectedChoice, updateProgress]);

 const nextExercise = useCallback(() => {
  if (!activePoint?.exercises.length) return;
  setExerciseIndex((index) => (index + 1) % activePoint.exercises.length);
  resetExerciseState();
 }, [activePoint?.exercises.length, resetExerciseState]);

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
   <LearningHeader
    activeTab={activeTab}
    onTabChange={setActiveTab}
    splitMode={splitMode}
    onSplitModeChange={setSplitMode}
    onShowLessons={() => setLessonSheetOpen(true)}
    onCreateLesson={createLessonDraft}
    onCreatePoint={() => createPointDraft()}
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
     <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
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

      <main className="min-w-0">
       {activeTab === "study" && activeLesson && (
        <StudyWorkspace
         lesson={activeLesson}
         point={activePoint}
         exercise={activeExercise}
         exerciseIndex={exerciseIndex}
         splitMode={splitMode}
         answer={exerciseAnswer}
         selectedChoice={selectedChoice}
         checked={exerciseChecked}
         correct={exerciseCorrect}
         onSelectPoint={(point) => {
          setActivePointId(point.id);
          setExerciseIndex(0);
         }}
         onEditPoint={setEditingPoint}
         onAnswerChange={setExerciseAnswer}
         onChoiceChange={setSelectedChoice}
         onCheck={checkExercise}
         onNext={nextExercise}
         onAgain={() => activePoint && updateProgress(activePoint, Math.max(activePoint.proficiency_level - 1, 0))}
         onRemember={() => activePoint && updateProgress(activePoint, Math.min(activePoint.proficiency_level + 1, 5))}
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

function LearningShell({ children }: { children: React.ReactNode }) {
 return (
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-5 lg:px-8">
    {children}
   </div>
  </div>
 );
}

function LearningHeader({
 activeTab,
 onTabChange,
 splitMode,
 onSplitModeChange,
 onShowLessons,
 onCreateLesson,
 onCreatePoint,
}: {
 activeTab: MainTab;
 onTabChange: (tab: MainTab) => void;
 splitMode: SplitMode;
 onSplitModeChange: (mode: SplitMode) => void;
 onShowLessons: () => void;
 onCreateLesson: () => void;
 onCreatePoint: () => void;
}) {
 return (
  <header className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm md:p-5">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
     <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      ← Quay lại
     </Link>
     <h1 className="mt-4 text-4xl font-black tracking-normal text-stone-900">Ngữ pháp tiếng Trung</h1>
     <p className="mt-2 max-w-2xl text-base font-bold leading-7 text-stone-500">
      Tự gom ngữ pháp theo Hán ngữ, HSK hoặc nhóm chủ đề; vừa xem lý thuyết vừa luyện bài tập.
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <Segmented
      value={activeTab}
      items={[
       { key: "study", label: "Học", icon: BookOpen },
       { key: "all", label: "Tất cả ngữ pháp", icon: Layers3 },
       { key: "edit", label: "Chỉnh sửa", icon: Edit3 },
      ]}
      onChange={(key) => onTabChange(key as MainTab)}
     />
     <button type="button" onClick={onShowLessons} className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50 lg:hidden">
      <Menu className="h-4 w-4" />
      Bài học
     </button>
     <ActionButton onClick={onCreatePoint} icon={Plus}>Thêm ngữ pháp</ActionButton>
     <ActionButton onClick={onCreateLesson} icon={Plus} tone="neutral">Thêm bài</ActionButton>
    </div>
   </div>

   {activeTab === "study" && (
    <div className="mt-5 flex flex-wrap items-center gap-2">
     <Segmented
      value={splitMode}
      items={[
       { key: "theory", label: "Lý thuyết", icon: FileText },
       { key: "practice", label: "Bài tập", icon: CheckCircle2 },
       { key: "split", label: "Chia đôi", icon: SplitSquareHorizontal },
      ]}
      onChange={(key) => onSplitModeChange(key as SplitMode)}
     />
    </div>
   )}
  </header>
 );
}

function Segmented({ value, items, onChange }: { value: string; items: { key: string; label: string; icon: LucideIcon }[]; onChange: (key: string) => void }) {
 return (
  <div className="flex max-w-full overflow-x-auto rounded-2xl bg-stone-100 p-1">
   {items.map((item) => {
    const Icon = item.icon;
    const active = value === item.key;
    return (
     <button key={item.key} type="button" onClick={() => onChange(item.key)} className={cn("flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-black transition", active ? "bg-red-500 text-white shadow-theme-sm" : "text-stone-600 hover:bg-white")}>
      <Icon className="h-4 w-4" />
      {item.label}
     </button>
    );
   })}
  </div>
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

function StudyWorkspace({
 lesson,
 point,
 exercise,
 exerciseIndex,
 splitMode,
 answer,
 selectedChoice,
 checked,
 correct,
 onSelectPoint,
 onEditPoint,
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
 exerciseIndex: number;
 splitMode: SplitMode;
 answer: string;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 onSelectPoint: (point: GrammarPointWithProgress) => void;
 onEditPoint: (point: GrammarPointWithProgress) => void;
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
     <div className={cn("grid gap-5", splitMode === "split" ? "xl:grid-cols-[1fr_0.9fr]" : "grid-cols-1")}>
      {splitMode !== "practice" && <TheoryPanel point={point} onEdit={() => onEditPoint(point)} onAgain={onAgain} onRemember={onRemember} />}
      {splitMode !== "theory" && <PracticePanel point={point} exercise={exercise} exerciseIndex={exerciseIndex} answer={answer} selectedChoice={selectedChoice} checked={checked} correct={correct} onAnswerChange={onAnswerChange} onChoiceChange={onChoiceChange} onCheck={onCheck} onNext={onNext} />}
     </div>
    )}
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

function PracticePanel({ point, exercise, exerciseIndex, answer, selectedChoice, checked, correct, onAnswerChange, onChoiceChange, onCheck, onNext }: { point: GrammarPointWithProgress; exercise: DbGrammarExercise | null; exerciseIndex: number; answer: string; selectedChoice: string | null; checked: boolean; correct: boolean | null; onAnswerChange: (value: string) => void; onChoiceChange: (value: string) => void; onCheck: () => void; onNext: () => void }) {
 if (!exercise) {
  return <EmptyState title="Chưa có bài tập" description="Thêm bài tập trong drawer sửa ngữ pháp hoặc paste block có mục Bài tập." compact />;
 }
 const content = (exercise.content || {}) as GrammarExerciseContent;
 const choices = content.choices || [];
 return (
  <article className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">Luyện tập</p>
     <h3 className="mt-1 text-2xl font-black text-stone-900">{exerciseLabels[exercise.exercise_type]}</h3>
     <p className="mt-1 text-sm font-bold text-stone-500">{point.title} · {exerciseIndex + 1}/{point.exercises.length}</p>
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
     <select value={draft.lesson_id || ""} onChange={(event) => setDraft({ ...draft, lesson_id: event.target.value || null })} className="h-11 rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-bold text-stone-800">
      {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
     </select>
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
        <select value={exercise.exercise_type} onChange={(event) => setExerciseDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, exercise_type: event.target.value as GrammarExerciseType } : item))} className="mb-2 h-10 rounded-xl border-2 border-stone-200 bg-white px-2 text-sm font-bold">
         {Object.entries(exerciseLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
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
 if (exercise.exercise_type === "translate_zh") return true;
 const accepted = content.accepted_answers || [String(exercise.answer?.text || "")].filter(Boolean);
 if (!accepted.length) return true;
 const normalized = normalize(answer);
 return accepted.some((item) => normalize(item) === normalized);
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
 return (
  <div className="fixed inset-0 z-50 flex justify-end">
   <div className="absolute inset-0 bg-stone-900/30" onClick={onClose} />
   <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l-2 border-stone-200 bg-white p-5 shadow-2xl">
    <div className="mb-5 flex items-center justify-between gap-3">
     <h2 className="text-2xl font-black text-stone-900">{title}</h2>
     <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-stone-200 text-stone-600 hover:bg-stone-50"><X className="h-5 w-5" /></button>
    </div>
    {children}
   </aside>
  </div>
 );
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
