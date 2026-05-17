import type { ReactNode } from "react";
import { Select } from "@/components/ui/select";

export type LessonSelectOption = {
 id: string;
 label: string;
 sublabel?: string;
 progressLabel?: string;
 countLabel?: string;
 categoryLabel?: string;
};

export function LessonSelectCard({
 title = "Bài đang học",
 description = "Chuyển nhanh giữa các bài mà không chiếm diện tích màn học.",
 countLabel,
 value,
 options,
 onChange,
 footer,
 className,
}: {
 title?: string;
 description?: string;
 countLabel?: string;
 value: string;
 options: LessonSelectOption[];
 onChange: (value: string) => void;
 footer?: ReactNode;
 className?: string;
}) {
 const active = options.find((option) => option.id === value);
 return (
  <section className={className || "rounded-[20px] border-2 border-blue-300 bg-blue-50/40 p-3 shadow-theme-sm"}>
   <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{title}</p>
     <p className="mt-1 truncate text-sm font-bold text-stone-500">{description}</p>
    </div>
    {countLabel ? <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">{countLabel}</span> : null}
   </div>
   <Select value={value} onChange={(event) => onChange(event.target.value)} wrapperClassName="mt-3">
    {options.map((option) => (
     <option key={option.id} value={option.id}>
      {option.label}
     </option>
    ))}
   </Select>
   {footer || active ? (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black text-stone-600">
     {footer || (
      <>
       {active?.progressLabel ? <span className="rounded-full bg-white px-3 py-1.5 shadow-theme-sm">{active.progressLabel}</span> : null}
       {active?.countLabel ? <span className="rounded-full bg-white px-3 py-1.5 shadow-theme-sm">{active.countLabel}</span> : null}
       {active?.categoryLabel ? <span className="min-w-0 max-w-full truncate rounded-full bg-white px-3 py-1.5 shadow-theme-sm">{active.categoryLabel}</span> : null}
      </>
     )}
    </div>
   ) : null}
  </section>
 );
}
