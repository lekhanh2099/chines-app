"use client";

import { Badge } from "@/components/ui/badge";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import type { GrammarViewModel, LearningStatus } from "@/features/hanzihome/types";

type GrammarPointListProps = {
 points: GrammarViewModel[];
 selectedPointId: string | null;
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
  <div className="grid min-w-0 max-w-full gap-2 overflow-hidden">
   {allPointId && (
    <LessonModuleSidebarItem
     selected={selectedPointId === allPointId}
     title="Xem toàn bộ"
     subtitle={`${points.length} điểm ngữ pháp`}
     onClick={() => onSelectPoint(allPointId)}
    />
   )}

   {points.map((point) => (
    <LessonModuleSidebarItem
     key={point.id}
     selected={point.id === selectedPointId}
     title={point.cleanTitle}
     subtitle={point.core || point.structuresView[0] || "Chưa có mô tả"}
     marker={
      progress[point.id]?.status === "new" ? (
       <Badge variant="accent" size="sm">
        Mới
       </Badge>
      ) : null
     }
     onClick={() => onSelectPoint(point.id)}
    />
   ))}
  </div>
 );
}
