import type { HanziHomeGrammarLesson, HanziHomeVocabLesson } from "../types";
import { cn } from "@/lib/utils";

export function StaticLessonHeader({
 vocabLesson,
 grammarLesson,
 radicalCount,
}: {
 vocabLesson: HanziHomeVocabLesson | null;
 grammarLesson: HanziHomeGrammarLesson | null;
 radicalCount: number;
}) {
 const lessonNumber = vocabLesson?.lesson_number ?? grammarLesson?.lesson_number ?? null;
 const title = vocabLesson?.title || grammarLesson?.title || "Bài đang học";
 const titleOnly = title.replace(/^Bài\s+\d+:\s*/i, "");
 const wordCount = vocabLesson?.entries.length || 0;
 const studiedCount = vocabLesson?.studied || 0;
 const masteredCount = vocabLesson?.mastered || 0;
 const learningCount = vocabLesson?.learning || 0;
 const freshCount = Math.max(wordCount - studiedCount, 0);
 const hardCount = Math.max(learningCount - masteredCount, 0);
 const grammarCount = grammarLesson?.points.length || 0;
 const progress = wordCount ? Math.round((studiedCount / wordCount) * 100) : 0;

 return (
  <section className="hanzihome-lesson-header">
   <div className="min-w-0">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
     {lessonNumber ? `Bài ${lessonNumber}` : "Bài học"}
    </p>
    <h2 className="mt-1 break-words text-2xl font-black leading-tight text-stone-950 sm:text-3xl">
     {titleOnly}
    </h2>
    <p className="mt-2 break-words text-sm font-bold text-stone-600">
     {wordCount} từ vựng · {grammarCount} điểm ngữ pháp · {radicalCount} bộ thủ
     tham chiếu · Đã học {studiedCount}/{wordCount}
    </p>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
     <div
      className="h-full rounded-full bg-red-500"
      style={{ inlineSize: `${progress}%` }}
     />
    </div>
   </div>
   <div className="hanzihome-lesson-stats">
    <LessonStatChip label="Chưa học" value={freshCount} tone="neutral" />
    <LessonStatChip label="Đang ôn" value={learningCount} tone="warning" />
    <LessonStatChip label="Đã biết" value={masteredCount} tone="success" />
    <LessonStatChip label="Còn khó" value={hardCount} tone="danger" />
   </div>
  </section>
 );
}

function LessonStatChip({
 label,
 value,
 tone,
}: {
 label: string;
 value: number;
 tone: "neutral" | "warning" | "success" | "danger";
}) {
 return (
  <div
   className={cn(
    "min-w-0 rounded-2xl border px-3 py-2",
    tone === "neutral" && "border-stone-200 bg-stone-50 text-stone-700",
    tone === "warning" && "border-amber-100 bg-amber-50 text-amber-800",
    tone === "success" && "border-emerald-100 bg-emerald-50 text-emerald-800",
    tone === "danger" && "border-red-100 bg-red-50 text-red-700",
   )}
  >
   <p className="truncate text-xs font-black uppercase tracking-[0.12em] opacity-70">
    {label}
   </p>
   <p className="mt-1 text-2xl font-black leading-none">{value}</p>
  </div>
 );
}
