import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Card } from "@/components/ui/layout/card";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function GrammarPreviewRow({ point, index }: { point: GrammarViewModel; index: number }) {
 return (
  <Card variant="subtle" padding="md" className="grid min-w-0 gap-1.5">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Điểm {index + 1}
   </StudyInstructionText>
   <HanziAwareText
    as="h3"
    text={point.cleanTitle}
    variant="cardTitle"
    tone="default"
    weight="black"
    clamp="one"
   />
   <HanziAwareText
    text={point.core || point.structuresView[0] || "Chưa có mô tả"}
    tone="secondary"
    weight="semibold"
    clamp="two"
   />
   {point.structuresView[0] && (
    <HanziAwareText text={point.structuresView[0]} tone="info" weight="black" clamp="one" />
   )}
  </Card>
 );
}
