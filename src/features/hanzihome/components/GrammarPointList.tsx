"use client";

import { Badge } from "@/components/ui/badge";
import type { GrammarViewModel, LearningStatus } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

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
  <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden">
   <div className="flex items-center justify-between gap-3">
    <h2 className="text-base font-black text-text-primary">Điểm ngữ pháp</h2>
    <Badge>{points.length} mục</Badge>
   </div>

   <div className="grid gap-2">
    {allPointId && (
     <button
      type="button"
      className={cn(
       "flex min-h-14 w-full min-w-0 max-w-full gap-2 overflow-hidden rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
       selectedPointId === allPointId
        ? "app-active-item"
        : "border-border-default bg-bg-subtle text-text-primary hover:bg-bg-primary",
      )}
      onClick={() => onSelectPoint(allPointId)}
     >
      <span className="min-w-0 flex-1">
       <span className="block line-clamp-2  font-black">Xem toàn bộ</span>
       <span className="block line-clamp-2 text-xs font-semibold opacity-80">
        Hiển thị tất cả điểm ngữ pháp trong một trang
       </span>
      </span>
     </button>
    )}

    {points.map((point) => (
     <button
      key={point.id}
      type="button"
      className={cn(
       "flex min-h-14 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
       point.id === selectedPointId
        ? "app-active-item"
        : "border-border-default bg-bg-subtle text-text-primary hover:bg-bg-primary",
      )}
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
     </button>
    ))}
   </div>
  </div>
 );
}
