import { BookOpenCheck, ListChecks } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass-panel";
import type { NotebookSection } from "@/features/notebook/types";

export function NotebookSectionGuide({ section }: { section: NotebookSection }) {
 return (
  <GlassPanel className="grid gap-4 p-4 sm:p-5">
   <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
     <BookOpenCheck className="h-5 w-5" />
    </span>
    <div>
     <h3 className="font-black text-text-primary">Cách nhận diện trong {section.label}</h3>
     <p className="text-sm font-medium text-text-muted">
      Xác định chức năng và vị trí trước, sau đó mới đối chiếu nghĩa tiếng Việt.
     </p>
    </div>
   </div>

   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {section.principles.map((principle, index) => (
     <div key={principle} className="rounded-xl border border-border-default bg-bg-card/80 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-accent-text">
       Bước {index + 1}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{principle}</p>
     </div>
    ))}
   </div>

   <details className="group rounded-xl border border-border-default bg-bg-card/65">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-black text-text-primary">
     <ListChecks className="h-4 w-4 text-accent-text" />
     Tra nhanh theo ý định câu
     <span className="ml-auto text-xs text-text-muted group-open:hidden">Mở</span>
     <span className="ml-auto hidden text-xs text-text-muted group-open:inline">Đóng</span>
    </summary>
    <div className="grid gap-2 border-t border-border-default p-3 sm:grid-cols-2 lg:grid-cols-3">
     {section.quick.map(([label, value]) => (
      <div key={`${label}-${value}`} className="rounded-xl bg-bg-subtle p-3">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">{label}</p>
       <p lang="zh-CN" className="mt-1 text-sm font-semibold leading-6 text-text-primary">
        {value}
       </p>
      </div>
     ))}
    </div>
   </details>
  </GlassPanel>
 );
}
