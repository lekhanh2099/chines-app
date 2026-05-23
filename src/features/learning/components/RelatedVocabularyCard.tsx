import Link from "next/link";
import { BookOpen, Eye, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonWorkspaceContext } from "@/features/learning/lesson-workspace";

export function RelatedVocabularyCard({
 workspace,
 className,
}: {
 workspace: LessonWorkspaceContext;
 className?: string;
}) {
 const hasWords = workspace.summary.wordCount > 0;
 return (
  <aside
   className={cn(
    "w-full max-w-full min-w-0 overflow-x-hidden scrollbar-soft  rounded-2xl -[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm",
    className,
   )}
  >
   <div className="flex min-w-0 items-start justify-between gap-3">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
      Từ vựng bài này
     </p>
     <h3 className="mt-2 break-words text-xl font-black text-stone-900">
      {workspace.lessonTitle}
     </h3>
    </div>
    <BookOpen className="h-5 w-5 shrink-0 text-stone-400" />
   </div>

   <div className="mt-4 grid min-w-0 grid-cols-3 gap-2">
    <MiniStat label="Từ" value={workspace.summary.wordCount} />
    <MiniStat
     label="Đã biết"
     value={workspace.summary.learnedCount}
     tone="green"
    />
    <MiniStat
     label="Còn yếu"
     value={workspace.summary.weakCount}
     tone="yellow"
    />
   </div>

   {!hasWords ? (
    <p className="mt-4 break-words rounded-2xlbg-stone-50 px-4 py-3 text-sm font-bold leading-6 text-stone-500">
     Chưa tìm thấy từ vựng khớp bài này. Có thể mở kho từ vựng để kiểm tra
     source/bài.
    </p>
   ) : null}

   <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
    <Link
     href={workspace.vocabularyHref}
     className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xlbg-red-500 px-4 text-sm font-black text-white shadow-theme-sm hover:bg-red-600"
    >
     <Eye className="h-4 w-4" />
     Ôn flashcard
    </Link>
    <Link
     href={workspace.vocabularyListHref}
     className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     <Layers3 className="h-4 w-4" />
     Xem list
    </Link>
   </div>
  </aside>
 );
}

function MiniStat({
 label,
 value,
 tone = "neutral",
}: {
 label: string;
 value: number;
 tone?: "neutral" | "green" | "yellow";
}) {
 const toneClass = {
  neutral: "bg-stone-50 text-stone-900",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-yellow-50 text-orange-600",
 }[tone];
 return (
  <div
   className={cn(
    "min-w-0 overflow-hidden rounded-2xlpx-3 py-2 text-center",
    toneClass,
   )}
  >
   <p className="break-words text-lg font-black">{value}</p>
   <p className="break-words text-[10px] font-black uppercase tracking-wide opacity-70">
    {label}
   </p>
  </div>
 );
}
