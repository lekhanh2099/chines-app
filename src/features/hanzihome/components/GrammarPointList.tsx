"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
 GrammarViewModel,
 LearningStatus,
} from "@/features/hanzihome/types";

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
  <Card
   padding="md"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-3">
     <h2 className="text-lg font-black text-text-primary">Điểm ngữ pháp</h2>
     <Badge>{points.length} mục</Badge>
    </div>

    <div className="grid gap-2">
     {allPointId && (
      <Button
       variant={selectedPointId === allPointId ? "default" : "outline"}
       className={
        selectedPointId === allPointId
         ? "h-auto min-w-0 justify-start rounded-xl py-3 text-left shadow-theme-sm"
         : "h-auto min-w-0 justify-start rounded-xl bg-bg-primary py-3 text-left"
       }
       onClick={() => onSelectPoint(allPointId)}
      >
       <span className="min-w-0 flex-1">
        <span className="block truncate font-black">Xem toàn bộ</span>
        <span className="block truncate text-xs font-semibold opacity-80">
         Hiển thị tất cả điểm ngữ pháp trong một trang
        </span>
       </span>
      </Button>
     )}

     {points.map((point) => (
      <Button
       key={point.id}
       variant={point.id === selectedPointId ? "default" : "outline"}
       className={
        point.id === selectedPointId
         ? "h-auto min-w-0 justify-start rounded-xl py-3 text-left shadow-theme-sm"
         : "h-auto min-w-0 justify-start rounded-xl bg-bg-primary py-3 text-left"
       }
       onClick={() => onSelectPoint(point.id)}
      >
       <span className="min-w-0 flex-1">
        <span className="block truncate font-black">{point.cleanTitle}</span>
        <span className="block truncate text-xs font-semibold opacity-80">
         {point.core || point.structuresView[0] || "Chưa có mô tả"}
        </span>
       </span>
       <span className="text-xs uppercase">
        {progress[point.id]?.status || "new"}
       </span>
      </Button>
     ))}
    </div>
   </div>
  </Card>
 );
}
