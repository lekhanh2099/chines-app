"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GrammarViewModel, LearningStatus } from "@/features/hanzihome/types";
import { z } from "zod";

type GrammarPointListProps = {
 points: GrammarViewModel[];
 selectedPointId: z.infer<z.ZodNullable<z.ZodString>>;
 progress: Record<string, { status: LearningStatus }>;
 onSelectPoint: (pointId: string) => void;
 allPointId?: string;
};

export function GrammarPointList({
 points,
 selectedPointId,
 progress,
 onSelectPoint,
 allPointId,
}: GrammarPointListProps) {
 return (
  <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden">
   <div className="flex items-center justify-between gap-3">
    <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
     Điểm ngữ pháp
    </Typography>
    <Badge>{points.length} mục</Badge>
   </div>

   <div className="grid gap-2">
    {allPointId && (
     <Button
      type="button"
      variant={selectedPointId === allPointId ? "active" : "surface"}
      align="start"
      wrap="normal"
      className="w-full min-w-0 max-w-full overflow-hidden"
      onClick={() => onSelectPoint(allPointId)}
     >
      <span className="min-w-0 flex-1">
       <StudyInstructionText as="span" weight="black" clamp="two" className="block">
        Xem toàn bộ
       </StudyInstructionText>
       <StudyInstructionText
        variant="caption"
        weight="semibold"
        clamp="two"
        className="block opacity-80"
       >
        Hiển thị tất cả điểm ngữ pháp trong một trang
       </StudyInstructionText>
      </span>
     </Button>
    )}

    {points.map((point) => (
     <Button
      key={point.id}
      type="button"
      variant={point.id === selectedPointId ? "active" : "surface"}
      align="start"
      wrap="normal"
      className="w-full min-w-0 max-w-full overflow-hidden"
      onClick={() => onSelectPoint(point.id)}
     >
      <span className="min-w-0 flex-1">
       <StudyInstructionText as="span" weight="black" clamp="two" className="block">
        {point.cleanTitle}
       </StudyInstructionText>
       <StudyInstructionText
        variant="caption"
        weight="semibold"
        clamp="two"
        className="block opacity-80"
       >
        {point.core || point.structuresView[0] || "Chưa có mô tả"}
       </StudyInstructionText>
      </span>
      <StudyInstructionText
       variant="overline"
       weight="bold"
       scale="micro"
       transform="uppercase"
       className="shrink-0 rounded-full border border-current/20 px-1.5 py-0.5"
      >
       {progress[point.id]?.status || "new"}
      </StudyInstructionText>
     </Button>
    ))}
   </div>
  </div>
 );
}
