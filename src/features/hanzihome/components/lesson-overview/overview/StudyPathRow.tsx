import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { BookOpenCheck } from "lucide-react";

import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import type { BookSection } from "@/features/hanzihome/components/lesson-overview/types";

export function StudyPathRow({ section, index }: { section: BookSection; index: number }) {
 const SectionIcon = sectionIcons[section.type] ?? BookOpenCheck;

 return (
  <Card variant="subtle" padding="md" className="flex min-w-0 items-center gap-3.5">
   <Typography as="span" variant="caption" tone="muted" weight="black">
    {String(index + 1).padStart(2, "0")}
   </Typography>
   <IconTile size="md" tone="accent">
    <SectionIcon />
   </IconTile>
   <div className="grid min-w-0 gap-1">
    <HanziAwareText as="h3" variant="body" weight="bold" text={section.title} />
    {section.subtitle && (
     <StudyInstructionText variant="caption" tone="muted" weight="semibold">
      {section.subtitle}
     </StudyInstructionText>
    )}
   </div>
  </Card>
 );
}
