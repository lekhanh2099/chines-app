import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function GrammarPreviewRow({ point, index }: { point: GrammarViewModel; index: number }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3 grid gap-1">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Điểm {index + 1}
   </StudyInstructionText>
   <Typography as="h3" variant="cardTitle" tone="default" weight="black" clamp="one">
    {point.cleanTitle}
   </Typography>
   <StudyInstructionText tone="secondary" weight="semibold" clamp="two">
    {point.core || point.structuresView[0] || "Chưa có mô tả"}
   </StudyInstructionText>
   {point.structuresView[0] && (
    <StudyInstructionText
     tone="info"
     weight="black"
     clamp="one"
     className="rounded-lg border border-info/25 bg-info-subtle px-2 py-1"
    >
     {point.structuresView[0]}
    </StudyInstructionText>
   )}
  </div>
 );
}
