export function EmptySectionState({ reason }: { reason?: string }) {
 return (
  <div className="rounded-xl border border-dashed border-border-default bg-bg-primary p-4">
   <p className="font-black text-text-primary">Không có dữ liệu cho phần này.</p>
   {reason && <p className="mt-1  font-semibold text-text-muted">{reason}</p>}
  </div>
 );
}
