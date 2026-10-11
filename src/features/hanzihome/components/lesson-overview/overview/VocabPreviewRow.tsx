import type { ReactNode } from "react";

import { Badge } from "@/components/ui/display/badge";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

export function VocabPreviewRow({
 hanzi,
 pinyin,
 hanviet,
 category,
 meaning,
 header,
 children,
}: {
 hanzi: string;
 pinyin: string;
 hanviet: string;
 category: string;
 meaning: string;
 header?: ReactNode;
 children?: ReactNode;
}) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3 grid gap-1">
   {header ?? (
    <div className="flex min-w-0 items-baseline gap-2">
     <StudyInstructionText
      variant="pageTitle"
      tone="default"
      weight="black"
      clamp="one"
      lang="zh-CN"
     >
      {hanzi}
     </StudyInstructionText>
     <StudyInstructionText variant="body" tone="primary" weight="bold" clamp="one">
      {pinyin}
     </StudyInstructionText>
    </div>
   )}
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    {hanviet && (
     <StudyInstructionText
      variant="label"
      tone="muted"
      weight="bold"
      wrapping="preWrap"
      tracking="wide"
      transform="uppercase"
     >
      {hanviet}
     </StudyInstructionText>
    )}
    {category && (
     <Badge size="sm" casing="natural">
      {category}
     </Badge>
    )}
   </div>
   {meaning && (
    <StudyInstructionText variant="body" tone="secondary" weight="semibold" wrapping="preWrap">
     {meaning}
    </StudyInstructionText>
   )}
   {children}
  </div>
 );
}
