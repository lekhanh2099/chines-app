export function MiniMetric({ label, value }: { label: string; value: number }) {
 return (
  <span className="inline-flex items-baseline gap-1 rounded-xl border border-border-default bg-bg-subtle px-3 py-2">
   <span className="text-base font-black text-text-primary">{value}</span>
   <span className="text-xs font-black text-text-muted">{label}</span>
  </span>
 );
}
