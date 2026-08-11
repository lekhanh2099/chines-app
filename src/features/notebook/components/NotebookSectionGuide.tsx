import { Typography } from "@/components/ui/typography";
import { BookOpenCheck, ListChecks } from "lucide-react";

import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import type { NotebookSection } from "@/features/notebook/types";

export function NotebookSectionGuide({ section }: { section: NotebookSection }) {
 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex items-center gap-3">
    <IconTile>
     <BookOpenCheck />
    </IconTile>
    <div>
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Cách nhận diện trong {section.label}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" weight="medium">
      Xác định chức năng và vị trí trước, sau đó mới đối chiếu nghĩa tiếng Việt.
     </Typography>
    </div>
   </div>

   <Separator />

   <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {section.principles.map((principle, index) => (
     <section key={principle} className="grid gap-1" aria-label={`Bước ${index + 1}`}>
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
     </section>
    ))}
   </div>

   <Card asChild variant="subtle" padding="md">
    <details className="group">
     <summary className="flex cursor-pointer list-none items-center gap-2">
      <ListChecks className="size-4 text-accent-text" />
      <Typography as="span" variant="label" weight="black">
       Tra nhanh theo ý định câu
      </Typography>
      <Typography variant="caption" tone="muted" className="ml-auto group-open:hidden">
       Mở
      </Typography>
      <Typography variant="caption" tone="muted" className="ml-auto hidden group-open:inline">
       Đóng
      </Typography>
     </summary>
     <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {section.quick.map(([label, value]) => (
       <section key={`${label}-${value}`} className="grid gap-1">
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
       </section>
      ))}
     </div>
    </details>
   </Card>
  </Card>
 );
}
