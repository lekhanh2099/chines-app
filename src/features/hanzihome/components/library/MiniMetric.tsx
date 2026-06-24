export function MiniMetric({ label, value }: { label: string; value: number }) {
 return (
  <span className="inline-flex items-baseline gap-1 rounded-full border border-border-default/80 bg-bg-subtle/80 px-3 py-1.5">
   <span className="text-base font-black text-text-primary">{value}</span>
   <span className="text-xs font-black text-text-muted">{label}</span>
  </span>
 );
}
