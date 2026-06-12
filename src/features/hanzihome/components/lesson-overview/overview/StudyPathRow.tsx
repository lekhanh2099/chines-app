import { BookOpenCheck } from "lucide-react";

import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import type { BookSection } from "@/features/hanzihome/components/lesson-overview/types";

export function StudyPathRow({
 section,
 index,
}: {
 section: BookSection;
 index: number;
}) {
 const SectionIcon = sectionIcons[section.type] ?? BookOpenCheck;

 return (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-default bg-bg-subtle p-3">
   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
    <SectionIcon className="h-4 w-4" />
   </span>
   <div className="min-w-0">
    <p className="truncate text-sm font-black text-text-primary">
     {index + 1}. {section.title}
    </p>
    {section.subtitle && (
     <p className="truncate text-xs font-semibold text-text-muted">
      {section.subtitle}
     </p>
    )}
   </div>
  </div>
 );
}
