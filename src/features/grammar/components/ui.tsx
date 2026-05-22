"use client";

import { Loader2, Sparkles, type LucideIcon } from "lucide-react";
import { LearningDrawer } from "@/features/learning/components";
import { cn } from "@/lib/utils";
import type { GrammarPointWithProgress } from "@/types/database";

export function StatusPill({
 status,
}: {
 status: GrammarPointWithProgress["status"];
}) {
 const className = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return (
  <span
   className={cn(
    "max-w-full rounded-full border-2 px-2.5 py-1 text-xs font-black",
    className,
   )}
  >
   {label}
  </span>
 );
}

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
 tone?: "red" | "neutral";
}) {
 const className =
  tone === "red"
   ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
   : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50";
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
   className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm hover:bg-stone-50"
  >
   <Icon className="h-5 w-5" />
  </button>
 );
}

export function EmptyState({
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
    "flex w-full max-w-full min-w-0 flex-col items-center justify-center overflow-x-hidden rounded-[28px] border-2 border-dashed border-stone-200 bg-white p-6 text-center sm:p-8",
    compact ? "min-h-80" : "min-h-[520px] shadow-theme-md",
   )}
  >
   <Sparkles className="h-12 w-12 text-stone-300" />
   <h2 className="mt-4 max-w-full break-words text-2xl font-black text-stone-900">
    {title}
   </h2>
   <p className="mt-2 max-w-md break-words text-sm font-bold leading-6 text-stone-500 [overflow-wrap:anywhere]">
    {description}
   </p>
   {action && <div className="mt-5 w-full max-w-full min-w-0">{action}</div>}
  </div>
 );
}

export function Drawer({
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

export function Field({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) {
 return (
  <label className="grid min-w-0 gap-2">
   <span className="min-w-0 break-words text-xs font-black uppercase tracking-wide text-stone-500">
    {label}
   </span>
   {children}
  </label>
 );
}

export function Textarea({
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
   onChange={(event) => onChange(event.target.value)}
   rows={rows}
   placeholder={placeholder}
   className="w-full max-w-full min-w-0 rounded-2xl border-2 border-stone-200 bg-white p-3 text-sm font-bold leading-6 text-stone-800 outline-none focus:border-red-300"
  />
 );
}
