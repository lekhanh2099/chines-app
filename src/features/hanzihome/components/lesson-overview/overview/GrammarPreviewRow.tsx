import type { GrammarViewModel } from "@/features/hanzihome/types";

export function GrammarPreviewRow({ point, index }: { point: GrammarViewModel; index: number }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3 grid gap-1">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Điểm {index + 1}</p>
   <h3 className="truncate text-base font-black text-text-primary">{point.cleanTitle}</h3>
   <p className="line-clamp-2 font-semibold text-text-secondary">
    {point.core || point.structuresView[0] || "Chưa có mô tả"}
   </p>
   {point.structuresView[0] && (
    <p className="truncate rounded-lg border border-info/25 bg-info-subtle px-2 py-1 font-black text-info-text">
     {point.structuresView[0]}
    </p>
   )}
  </div>
 );
}
