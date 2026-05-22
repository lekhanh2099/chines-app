"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import VocabularyLearningModule from "@/features/vocabulary/components/VocabularyLearningModule";
import {
 parseLearningSource,
 parseLessonNumber,
} from "@/features/learning/lesson-workspace";
import type { LearningSource } from "@/features/learning/lesson-workspace";
import type { StudyMode } from "@/features/vocabulary/types";

type VocabSource = LearningSource;
type VocabCourseOption = {
 id: string;
 course_key: string;
 title: string;
 source_file: string;
 imported_at?: string;
};
const studyModes = new Set<StudyMode>([
 "list",
 "guess",
 "flashcard",
 "write",
 "examples",
 "quiz",
 "reverse",
]);

export default function VocabularyPage() {
 const searchParams = useSearchParams();
 const querySource = parseLearningSource(searchParams.get("source"));
 const queryLessonNumber = parseLessonNumber(searchParams.get("lesson"));
 const queryLessonKey = searchParams.get("lessonKey");
 const rawMode = searchParams.get("mode") as StudyMode | null;
 const queryMode = rawMode && studyModes.has(rawMode) ? rawMode : null;
 const [source, setSource] = useState<VocabSource>(querySource);
 const [hskSeedRequested, setHskSeedRequested] = useState(false);
 const queryClient = useQueryClient();
 const { data: courses = [], isLoading: coursesLoading } = useQuery({
  queryKey: ["vocab-courses"],
  queryFn: async () => {
   const response = await fetch("/api/vocab/courses");
   const result = (await response.json().catch(() => null)) as {
    courses?: VocabCourseOption[];
    error?: string;
   } | null;
   if (!response.ok) throw new Error(result?.error || "Không tải được danh sách nguồn học");
   return result?.courses || [];
  },
  staleTime: 1000 * 30,
 });

 const hskCourse = useMemo(
  () => courses.find((course) => course.course_key === "hsk4-bai1") || null,
  [courses],
 );
 const hanyuCourse = useMemo(
  () => courses.find((course) => course.course_key !== "hsk4-bai1") || null,
  [courses],
 );

 const seedHsk = useMutation({
  mutationFn: async () => {
   const response = await fetch("/api/vocab/import/hsk4-bai1", { method: "POST" });
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    imported?: number;
    created?: boolean;
   } | null;
   if (!response.ok) throw new Error(result?.error || "Không tạo được kho HSK");
   return result;
  },
  onSuccess: async (result) => {
   await queryClient.invalidateQueries({ queryKey: ["vocab-courses"] });
   await queryClient.invalidateQueries({ queryKey: ["vocab-entries"] });
   toast.success(result?.created ? "Đã tạo kho HSK trong database" : "Kho HSK đã sẵn sàng");
  },
  onError: (error) => {
   toast.error(error instanceof Error ? error.message : "Không tạo được kho HSK");
  },
 });

 useEffect(() => {
  if (
   source !== "hsk" ||
   coursesLoading ||
   hskCourse ||
   hskSeedRequested ||
   seedHsk.isPending ||
   seedHsk.isError
  )
   return;
  setHskSeedRequested(true);
  seedHsk.mutate();
 }, [coursesLoading, hskCourse, hskSeedRequested, seedHsk, source]);

 useEffect(() => {
  setSource(querySource);
 }, [querySource]);

 return (
  <div className="page-shell min-h-screen bg-stone-50">
   <div className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden px-0 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-5 sm:py-3 lg:px-8">
    {coursesLoading ? (
     <SeedState label="Đang tải danh sách nguồn học..." />
    ) : source === "hanyu" ? (
     <VocabularyLearningModule
      key={hanyuCourse?.id || "hanyu-missing"}
      courseId={hanyuCourse?.id || "missing-hanyu-course"}
      sourceMode={source}
      onSourceModeChange={setSource}
      title="Từ vựng Hán ngữ"
      description="Kho từ theo giáo trình Hán ngữ, có edit/import/progress theo từng bài."
      initialLessonNumber={queryLessonNumber}
      initialLessonKey={queryLessonKey}
      initialMode={queryMode}
     />
    ) : seedHsk.isPending ? (
     <SeedState label="Đang chuẩn bị kho HSK trong database..." />
    ) : source === "hsk" && !hskCourse ? (
     <HskSeedFallback
      loading={seedHsk.isPending}
      onSeed={() => {
       setHskSeedRequested(true);
       seedHsk.mutate();
      }}
     />
    ) : (
     <VocabularyLearningModule
      key={hskCourse?.id || "hsk-missing"}
      courseId={hskCourse?.id || "missing-hsk-course"}
      sourceMode={source}
      onSourceModeChange={setSource}
      title="Từ vựng HSK"
      description="Kho HSK dùng chung CRUD, import, chỉnh sửa từ và lưu tiến độ thật trong database."
      emptyTitle="Chưa có kho HSK"
      emptyDescription="Bấm tạo kho HSK để seed dữ liệu mẫu vào database, sau đó có thể thêm/sửa/xoá như kho Hán ngữ."
      allowDocxReset={false}
      initialLessonNumber={queryLessonNumber}
      initialLessonKey={queryLessonKey}
      initialMode={queryMode}
     />
    )}
   </div>
  </div>
 );
}

function HskSeedFallback({
 loading,
 onSeed,
}: {
 loading: boolean;
 onSeed: () => void;
}) {
 return (
  <div className="w-full max-w-full min-w-0 overflow-x-hidden rounded-[28px] border-2 border-stone-200 bg-white p-6 text-stone-900 shadow-theme-md">
   <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Kho HSK</p>
   <h2 className="mt-2 text-2xl font-black">Chưa có dữ liệu HSK trong database</h2>
   <p className="mt-2 max-w-2xl break-words text-sm font-bold leading-6 text-stone-500 [overflow-wrap:anywhere]">
    Tạo course HSK để dùng chung CRUD, import, edit và progress với module từ vựng hiện tại.
   </p>
   <button
    type="button"
    onClick={onSeed}
    disabled={loading}
    className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-red-500 px-5 text-sm font-black text-white shadow-theme-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
   >
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Tạo kho HSK
   </button>
  </div>
 );
}

function SeedState({ label }: { label: string }) {
 return (
  <div className="flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center overflow-x-hidden rounded-[28px] border-2 border-stone-200 bg-white text-stone-900 shadow-theme-md">
   <Loader2 className="h-6 w-6 animate-spin text-red-500" />
   <span className="ml-3 text-sm font-black text-stone-500">
    {label}
   </span>
  </div>
 );
}
