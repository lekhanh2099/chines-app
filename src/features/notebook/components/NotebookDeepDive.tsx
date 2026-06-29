import { NOTEBOOK_DEEP_DIVE_SOURCE_LABELS } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookDeepDive } from "@/features/notebook/types";

const DEEP_DIVE_SECTIONS = [
 { key: "why", label: "Nghĩa lõi / sắc thái", warning: false },
 { key: "pos", label: "Vị trí / cấu trúc", warning: false },
 { key: "decision", label: "Tiêu chí chọn", warning: false },
 { key: "mistake", label: "Bẫy dễ sai", warning: true },
] as const;

export function NotebookDeepDive({ deepDive }: { deepDive: NotebookDeepDive }) {
 return (
  <details className="group overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-bg-card open:pb-3">
   <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-black text-purple-800 marker:content-none [&::-webkit-details-marker]:hidden">
    <span>Phân tích sắc thái · vị trí · lỗi sai</span>
    <span
     aria-hidden="true"
     className="grid size-7 shrink-0 place-items-center rounded-full bg-purple-100 text-lg leading-none text-purple-700 group-open:hidden"
    >
     +
    </span>
    <span
     aria-hidden="true"
     className="hidden size-7 shrink-0 place-items-center rounded-full bg-purple-100 text-lg leading-none text-purple-700 group-open:grid"
    >
     −
    </span>
   </summary>

   <div className="grid gap-2.5 px-3">
    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">
     Đọc theo 4 trục: <strong>nghĩa lõi → vị trí câu → tiêu chí chọn → bẫy dễ sai</strong>. Mục này
     không học bằng một bản dịch tiếng Việt duy nhất.
    </p>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
     <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-purple-500" />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-2">
     {DEEP_DIVE_SECTIONS.map((section) => (
      <div
       key={section.key}
       className={
        section.warning
         ? "rounded-2xl border border-pink-200 bg-pink-50/70 p-3 grid gap-1.5"
         : "rounded-2xl border border-purple-100 bg-white/85 p-3 grid gap-1.5"
       }
      >
       <p
        className={
         section.warning
          ? "text-xs font-black uppercase tracking-[0.1em] text-pink-700"
          : "text-xs font-black uppercase tracking-[0.1em] text-purple-700"
        }
       >
        {section.label}
       </p>
       <p className="text-sm font-medium leading-5 text-text-secondary">
        {deepDive[section.key]}
       </p>
      </div>
     ))}
    </div>
    <div className="flex flex-wrap gap-1.5">
     {deepDive.src.map((source) => (
      <span
       key={source}
       className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-black text-sky-800"
      >
       {NOTEBOOK_DEEP_DIVE_SOURCE_LABELS[source]}
      </span>
     ))}
    </div>
   </div>
  </details>
 );
}
