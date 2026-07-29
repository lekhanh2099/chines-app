import { Typography } from "@/components/ui/typography";
import { BookOpenCheck, ListChecks } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass-panel";
import type { NotebookSection } from "@/features/notebook/types";

export function NotebookSectionGuide({ section }: { section: NotebookSection }) {
 return (
  <GlassPanel className="grid gap-4 p-4 sm:p-5">
   <div className="flex items-center gap-3">
    <Typography
     as="span"
     tone="accent"
     className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle"
    >
     <BookOpenCheck className="h-5 w-5" />
    </Typography>
    <div>
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Cách nhận diện trong {section.label}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" weight="medium">
      Xác định chức năng và vị trí trước, sau đó mới đối chiếu nghĩa tiếng Việt.
     </Typography>
    </div>
   </div>

   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {section.principles.map((principle, index) => (
     <div
      key={principle}
      className="rounded-xl border border-border-default bg-bg-card/80 p-4 grid gap-2"
     >
      <Typography
       as="p"
       variant="overline"
       tone="accent"
       weight="black"
       tracking="overline"
       transform="uppercase"
      >
       Bước {index + 1}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" weight="medium" leading="standard">
       {principle}
      </Typography>
     </div>
    ))}
   </div>

   <details className="group rounded-xl border border-border-default bg-bg-card/65">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-black text-text-primary">
     <ListChecks className="h-4 w-4 text-accent-text" />
     Tra nhanh theo ý định câu
     <Typography variant="caption" tone="muted" className="ml-auto group-open:hidden">
      Mở
     </Typography>
     <Typography variant="caption" tone="muted" className="ml-auto hidden group-open:inline">
      Đóng
     </Typography>
    </summary>
    <div className="grid gap-2 border-t border-border-default p-3 sm:grid-cols-2 lg:grid-cols-3">
     {section.quick.map(([label, value]) => (
      <div key={`${label}-${value}`} className="rounded-xl bg-bg-subtle p-3 grid gap-1">
       <Typography
        as="p"
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        {label}
       </Typography>
       <Typography
        as="p"
        lang="zh-CN"
        variant="bodySmall"
        tone="default"
        weight="semibold"
        leading="standard"
       >
        {value}
       </Typography>
      </div>
     ))}
    </div>
   </details>
  </GlassPanel>
 );
}
