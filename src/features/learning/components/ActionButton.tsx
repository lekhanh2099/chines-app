import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionButton({
 children,
 onClick,
 icon: Icon,
 loading,
 disabled,
 tone = "red",
 className,
}: {
 children: ReactNode;
 onClick?: () => void;
 icon?: LucideIcon;
 loading?: boolean;
 disabled?: boolean;
 tone?: "red" | "neutral" | "purple";
 className?: string;
}) {
 const toneClassName = {
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
    "inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-4 text-sm font-black shadow-theme-sm transition disabled:cursor-not-allowed disabled:opacity-60",
    toneClassName,
    className,
   )}
  >
   {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
   {children}
  </button>
 );
}
