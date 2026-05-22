import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VocabEntryWithProgress } from "@/types/database";

export function ActionButton({
 children,
 onClick,
 icon: Icon,
 loading,
 disabled,
 tone = "red",
}: {
 children: React.ReactNode;
 onClick: () => void;
 icon?: LucideIcon;
 loading?: boolean;
 disabled?: boolean;
 tone?: "red" | "neutral" | "purple";
}) {
 const className = {
  red: "border-red-500 bg-red-500 text-white hover:bg-red-600",
  neutral: "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
  purple: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
 }[tone];
 return (
  <button
   type="button"
   onClick={onClick}
   disabled={loading || disabled}
   className={cn(
    "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-black shadow-theme-sm transition disabled:opacity-60",
    className,
   )}
  >
   {loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
   ) : Icon ? (
    <Icon className="h-4 w-4" />
   ) : null}
   {children}
  </button>
 );
}

export function IconToolButton({
 icon: Icon,
 label,
 onClick,
}: {
 icon: LucideIcon;
 label: string;
 onClick?: () => void;
}) {
 return (
  <button
   type="button"
   title={label}
   onClick={onClick}
   className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm hover:bg-stone-50"
  >
   <Icon className="h-5 w-5" />
  </button>
 );
}

export function StudyProgress({
 title,
 current,
 total,
 stats,
 studied,
 randomMode,
}: {
 title: string;
 current: number;
 total: number;
 stats: { seen: number; remembered: number; missed: number };
 studied: number;
 randomMode: boolean;
}) {
 const progress = total
  ? Math.min(100, Math.round((studied / total) * 100))
  : 0;
 return (
  <section className="mt-5 w-full max-w-full min-w-0 overflow-x-hidden">
   <div className="flex w-full max-w-full min-w-0 flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
     <p className="break-words text-base font-black uppercase tracking-wide text-stone-600 [overflow-wrap:anywhere]">
      Tiến độ - {title}
     </p>
     <p className="mt-1 break-words text-sm font-bold text-stone-500 [overflow-wrap:anywhere]">
      Đã học {studied}/{total} · Phiên này nhớ {stats.remembered} · Cần ôn{" "}
      {stats.missed}
      {randomMode ? " · Đang xáo bài" : ""}
     </p>
    </div>
    <p className="break-words text-lg font-black uppercase tracking-wide text-stone-700 [overflow-wrap:anywhere]">
     {current} / {total} thẻ
    </p>
   </div>
   <div className="mt-2 h-2.5 rounded-full border-2 border-stone-200 bg-red-100">
    <div
     className="h-full rounded-full bg-red-500 transition-all"
     style={{ width: `${progress}%` }}
    />
   </div>
  </section>
 );
}

export function MiniStat({
 label,
 value,
 tone = "stone",
 suffix = "",
}: {
 label: string;
 value: number;
 tone?: "stone" | "green" | "yellow" | "red";
 suffix?: string;
}) {
 const className = {
  stone: "bg-stone-50 text-stone-900",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-yellow-50 text-orange-600",
  red: "bg-red-50 text-red-600",
 }[tone];
 return (
  <div className={cn("min-w-0 rounded-2xl p-3 shadow-theme-sm", className)}>
   <p className="text-[11px] font-black uppercase tracking-wide opacity-70">
    {label}
   </p>
   <p className="mt-1 break-words text-2xl font-black [overflow-wrap:anywhere]">
    {value}
    {suffix}
   </p>
  </div>
 );
}

export function ControlLabel({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) {
 return (
  <label className="block text-xs font-black uppercase tracking-wide text-stone-500">
   {label}
   <div className="mt-1">{children}</div>
  </label>
 );
}

export function FilterChip({
 active,
 onClick,
 children,
}: {
 active: boolean;
 onClick: () => void;
 children: React.ReactNode;
}) {
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "max-w-full rounded-full border-2 px-3 py-1.5 text-xs font-black transition",
    active
     ? "border-red-500 bg-red-500 text-white"
     : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
   )}
  >
   {children}
  </button>
 );
}

export function StudyCard({ children }: { children: React.ReactNode }) {
 return (
  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[24px] border-2 border-stone-100 bg-stone-50 p-3 text-center md:p-5">
   {children}
  </div>
 );
}

export function StudyMeta({
 entry,
 cardIndex,
 total,
}: {
 entry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
}) {
 return (
  <div className="flex flex-wrap items-center justify-center gap-2">
   <span className="text-sm font-black uppercase tracking-wide text-red-500">
    {entry.source.lessonKey}
   </span>
   {entry.category && (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-500 shadow-theme-sm">
     {entry.category}
    </span>
   )}
   <span className="text-sm font-black text-stone-400">
    Thẻ {Math.min(cardIndex + 1, total)} / {total}
   </span>
  </div>
 );
}
