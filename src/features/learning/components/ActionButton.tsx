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
  red: "border-danger bg-danger text-danger-foreground hover:bg-danger/90",
  neutral: "border-border-default bg-bg-card text-text-secondary hover:bg-bg-subtle",
  purple: "border-purple/30 bg-purple-subtle text-purple-text hover:bg-purple/15",
 }[tone];
 return (
  <button
   type="button"
   onClick={onClick}
   disabled={loading || disabled}
   className={cn(
    "inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-4 font-black shadow-theme-sm transition disabled:cursor-not-allowed disabled:opacity-60",
    toneClassName,
    className,
   )}
  >
   {loading ? (
    <Loader2 className="size-4 animate-spin" />
   ) : Icon ? (
    <Icon className="size-4" />
   ) : null}
   {children}
  </button>
 );
}
