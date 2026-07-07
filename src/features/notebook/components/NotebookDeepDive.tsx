import { NOTEBOOK_DEEP_DIVE_SOURCE_LABELS } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookDeepDive } from "@/features/notebook/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEEP_DIVE_SECTIONS = [
 { key: "why", label: "Nghĩa lõi / sắc thái", warning: false },
 { key: "pos", label: "Vị trí / cấu trúc", warning: false },
 { key: "decision", label: "Tiêu chí chọn", warning: false },
 { key: "mistake", label: "Bẫy dễ sai", warning: true },
] as const;

export function NotebookDeepDive({ deepDive }: { deepDive: NotebookDeepDive }) {
 return (
  <details className="group overflow-hidden rounded-2xl border border-purple/30 bg-bg-card open:pb-3">
   <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-black text-purple-text marker:content-none [&::-webkit-details-marker]:hidden">
    <span>Phân tích sắc thái · vị trí · lỗi sai</span>
    <span
     aria-hidden="true"
     className="grid size-7 shrink-0 place-items-center rounded-full bg-purple-subtle text-lg leading-none text-purple-text group-open:hidden"
    >
     +
    </span>
    <span
     aria-hidden="true"
     className="hidden size-7 shrink-0 place-items-center rounded-full bg-purple-subtle text-lg leading-none text-purple-text group-open:grid"
    >
     −
    </span>
   </summary>

   <div className="grid gap-2.5 px-3">
    <p className="rounded-xl border border-success/30 bg-success-subtle px-3 py-2.5 text-sm leading-5 text-success-text">
     Đọc theo 4 trục: <strong>nghĩa lõi → vị trí câu → tiêu chí chọn → bẫy dễ sai</strong>. Mục này
     không học bằng một bản dịch tiếng Việt duy nhất.
    </p>
    <div className="h-2 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
     <div className="h-full w-[92%] rounded-full bg-accent" />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-2">
     {DEEP_DIVE_SECTIONS.map((section) => (
      <div
       key={section.key}
       className={cn(
        "grid gap-1.5 rounded-2xl border p-3",
        section.warning ? "border-warning/30 bg-warning-subtle" : "border-purple/20 bg-bg-primary",
       )}
      >
       <p
        className={cn(
         "text-xs font-black uppercase tracking-[0.1em]",
         section.warning ? "text-warning-text" : "text-purple-text",
        )}
       >
        {section.label}
       </p>
       <p className="text-sm font-medium leading-5 text-text-secondary">{deepDive[section.key]}</p>
      </div>
     ))}
    </div>
    <div className="flex flex-wrap gap-1.5">
     {deepDive.src.map((source) => (
      <Badge key={source} variant="info" size="sm">
       {NOTEBOOK_DEEP_DIVE_SOURCE_LABELS[source]}
      </Badge>
     ))}
    </div>
   </div>
  </details>
 );
}
