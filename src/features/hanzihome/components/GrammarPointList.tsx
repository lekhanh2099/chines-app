"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GrammarViewModel, LearningStatus } from "@/features/hanzihome/types";
import { z } from "zod";

const SelectedGrammarPointIdSchema = z.string().nullable();

type GrammarPointListProps = {
 points: GrammarViewModel[];
 selectedPointId: z.infer<typeof SelectedGrammarPointIdSchema>;
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
    <h2 className="text-base font-black text-text-primary">Điểm ngữ pháp</h2>
    <Badge>{points.length} mục</Badge>
   </div>

   <div className="grid gap-2">
    {allPointId && (
     <Button
      type="button"
      variant={selectedPointId === allPointId ? "active" : "surface"}
      className="h-auto min-h-14 w-full min-w-0 max-w-full justify-start gap-2 overflow-hidden whitespace-normal rounded-lg p-2.5 text-left"
      onClick={() => onSelectPoint(allPointId)}
     >
      <span className="min-w-0 flex-1">
       <span className="block line-clamp-2  font-black">Xem toàn bộ</span>
       <span className="block line-clamp-2 text-xs font-semibold opacity-80">
        Hiển thị tất cả điểm ngữ pháp trong một trang
       </span>
      </span>
     </Button>
    )}

    {points.map((point) => (
     <Button
      key={point.id}
      type="button"
      variant={point.id === selectedPointId ? "active" : "surface"}
      className="h-auto min-h-14 w-full min-w-0 max-w-full justify-start gap-2 overflow-hidden whitespace-normal rounded-lg p-2.5 text-left"
      onClick={() => onSelectPoint(point.id)}
     >
      <span className="min-w-0 flex-1">
       <span className="block line-clamp-2  font-black">{point.cleanTitle}</span>
       <span className="block line-clamp-2 text-xs font-semibold opacity-80">
        {point.core || point.structuresView[0] || "Chưa có mô tả"}
       </span>
      </span>
      <span className="shrink-0 rounded-full border border-current/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase">
       {progress[point.id]?.status || "new"}
      </span>
     </Button>
    ))}
   </div>
  </div>
 );
}
