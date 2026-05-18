"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import VocabularyLearningModule from "@/features/vocabulary/components/VocabularyLearningModule";
import { cn } from "@/lib/utils";

type VocabSource = "hanyu" | "hsk";
type VocabCourseOption = {
 id: string;
 course_key: string;
 title: string;
 source_file: string;
 imported_at?: string;
};

export default function VocabularyPage() {
 const [source, setSource] = useState<VocabSource>("hanyu");
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

 return (
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-3 py-3 pb-24 sm:px-5 sm:py-5 lg:px-8">
    <SourceSwitch
     value={source}
     onChange={setSource}
     title="Từ vựng"
     description="Chọn nguồn học: kho Hán ngữ cá nhân hoặc HSK."
    />
    {coursesLoading ? (
     <SeedState label="Đang tải danh sách nguồn học..." />
    ) : source === "hanyu" ? (
     <VocabularyLearningModule
      key={hanyuCourse?.id || "hanyu-missing"}
      courseId={hanyuCourse?.id || "missing-hanyu-course"}
      title="Từ vựng Hán ngữ"
      description="Kho từ theo giáo trình Hán ngữ, có edit/import/progress theo từng bài."
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
      title="Từ vựng HSK"
      description="Kho HSK dùng chung CRUD, import, chỉnh sửa từ và lưu tiến độ thật trong database."
      emptyTitle="Chưa có kho HSK"
      emptyDescription="Bấm tạo kho HSK để seed dữ liệu mẫu vào database, sau đó có thể thêm/sửa/xoá như kho Hán ngữ."
      allowDocxReset={false}
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
  <div className="rounded-[28px] border-2 border-stone-200 bg-white p-6 text-stone-900 shadow-theme-md">
   <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Kho HSK</p>
   <h2 className="mt-2 text-2xl font-black">Chưa có dữ liệu HSK trong database</h2>
   <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-stone-500">
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
  <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white text-stone-900 shadow-theme-md">
   <Loader2 className="h-6 w-6 animate-spin text-red-500" />
   <span className="ml-3 text-sm font-black text-stone-500">
    {label}
   </span>
  </div>
 );
}

function SourceSwitch({
 value,
 onChange,
 title,
 description,
}: {
 value: VocabSource;
 onChange: (value: VocabSource) => void;
 title: string;
 description: string;
}) {
 return (
  <section className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm md:rounded-[28px] md:p-5">
   <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Nguồn học</p>
     <h1 className="mt-1 text-3xl font-black text-stone-950 md:text-4xl">{title}</h1>
     <p className="mt-1 text-sm font-bold text-stone-500 md:text-base">{description}</p>
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
