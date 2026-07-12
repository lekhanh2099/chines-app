export function MiniMetric({ label, value }: { label: string; value: number }) {
 return (
  <span className="grid min-w-0 gap-0.5 rounded-lg border border-border-default bg-bg-primary px-2 py-1.5 text-center">
   <span className="truncate text-sm font-black leading-none text-text-primary">{value}</span>
   <span className="truncate text-[0.65rem] font-bold uppercase tracking-wide text-text-muted">
    {label}
   </span>
  </span>
 );
}
