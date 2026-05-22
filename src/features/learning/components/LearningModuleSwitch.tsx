import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningModuleKind } from "@/features/learning/lesson-workspace";

export function LearningModuleSwitch({
 activeModule,
 vocabularyHref,
 grammarHref,
 className,
}: {
 activeModule: LearningModuleKind;
 vocabularyHref: string;
 grammarHref: string;
 className?: string;
}) {
 const items = [
  { key: "vocabulary" as const, label: "Từ vựng", href: vocabularyHref, icon: BookOpen },
  { key: "grammar" as const, label: "Ngữ pháp", href: grammarHref, icon: GraduationCap },
 ];
 return (
  <div className={cn("inline-grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1", className)}>
   {items.map((item) => {
    const active = activeModule === item.key;
    const Icon = item.icon;
    return (
     <Link
      key={item.key}
      href={item.href}
      className={cn(
       "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition",
       active
        ? "bg-red-500 text-white shadow-theme-sm"
        : "text-stone-600 hover:bg-white hover:text-stone-900",
      )}
     >
      <Icon className="h-4 w-4" />
      {item.label}
     </Link>
    );
   })}
  </div>
 );
}
