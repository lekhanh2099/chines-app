import { Typography } from "@/components/ui/typography";
import { NOTEBOOK_DEEP_DIVE_SOURCE_LABELS } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookDeepDive } from "@/features/notebook/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEEP_DIVE_SECTIONS: {
 key: keyof Omit<NotebookDeepDive, "src">;
 label: string;
 warning: boolean;
}[] = [
 { key: "why", label: "Nghĩa lõi / sắc thái", warning: false },
 { key: "pos", label: "Vị trí / cấu trúc", warning: false },
 { key: "decision", label: "Tiêu chí chọn", warning: false },
 { key: "mistake", label: "Bẫy dễ sai", warning: true },
];

export function NotebookDeepDive({ deepDive }: { deepDive: NotebookDeepDive }) {
 return (
  <details className="group overflow-hidden rounded-xl border border-purple/30 bg-bg-card open:pb-3">
   <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-black text-purple-text marker:content-none [&::-webkit-details-marker]:hidden">
    <span>Phân tích sắc thái · vị trí · lỗi sai</span>
    <Typography
     aria-hidden="true"
     variant="sectionTitle"
     tone="purple"
     leading="none"
     className="grid size-7 shrink-0 place-items-center rounded-full bg-purple-subtle group-open:hidden"
    >
     +
    </Typography>
    <Typography
     aria-hidden="true"
     variant="sectionTitle"
     tone="purple"
     leading="none"
     className="hidden size-7 shrink-0 place-items-center rounded-full bg-purple-subtle group-open:grid"
    >
     −
    </Typography>
   </summary>

   <div className="grid gap-2.5 px-3">
    <Typography
     as="p"
     variant="bodySmall"
     tone="success"
     leading="compact"
     className="rounded-xl border border-success/30 bg-success-subtle px-3 py-2.5"
    >
     Đọc theo 4 trục: <strong>nghĩa lõi → vị trí câu → tiêu chí chọn → bẫy dễ sai</strong>. Mục này
     không học bằng một bản dịch tiếng Việt duy nhất.
    </Typography>
    <div className="h-2 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
     <div className="h-full w-[92%] rounded-full bg-accent" />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-2">
     {DEEP_DIVE_SECTIONS.map((section) => (
      <div
       key={section.key}
       className={cn(
        "grid gap-1.5 rounded-xl border p-3",
        section.warning ? "border-warning/30 bg-warning-subtle" : "border-purple/20 bg-bg-primary",
       )}
      >
       <Typography
        as="p"
        variant="overline"
        tone={section.warning ? "warning" : "purple"}
        tracking="subtle"
       >
        {section.label}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="compact">
        {deepDive[section.key]}
       </Typography>
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
