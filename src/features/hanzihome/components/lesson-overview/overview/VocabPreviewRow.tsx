import type { ReactNode } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

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
  <Card variant="subtle" padding="md" className="grid min-w-0 content-start gap-1.5">
   {header ?? (
    <div className="flex min-w-0 items-baseline gap-2">
     <HanziText as="span" size="card" leading="none" clamp="one">
      {hanzi}
     </HanziText>
     <PinyinText as="span" tone="accent" weight="bold" clamp="one">
      {pinyin}
     </PinyinText>
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
    <StudyInstructionText variant="bodySmall" tone="secondary" weight="semibold" wrapping="preWrap">
     {meaning}
    </StudyInstructionText>
   )}
   {children}
  </Card>
 );
}
