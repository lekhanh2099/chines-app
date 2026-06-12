export function InfoBlock({ title, value }: { title: string; value: string }) {
 if (!value) return null;

 return (
  <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
   <p className="mt-1  font-semibold leading-relaxed text-text-secondary">{value}</p>
  </div>
 );
}
