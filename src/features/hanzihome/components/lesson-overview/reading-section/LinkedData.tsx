export function LinkedData({
 exerciseRef,
 linkedReadingId,
}: {
 exerciseRef: string;
 linkedReadingId: string;
}) {
 if (!exerciseRef && !linkedReadingId) return null;

 return (
  <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Liên kết trong bài</p>
   {exerciseRef && (
    <p className="mt-1  font-bold text-text-primary">Bài tập liên quan: {exerciseRef}</p>
   )}
   {linkedReadingId && (
    <p className="mt-1  font-bold text-text-primary">Bài đọc liên quan: {linkedReadingId}</p>
   )}
  </div>
 );
}
