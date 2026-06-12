export function OverviewStatPill({ label }: { label: string }) {
 return (
  <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
   {label}
  </span>
 );
}
