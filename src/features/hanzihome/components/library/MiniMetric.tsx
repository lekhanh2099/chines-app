export function MiniMetric({ label, value }: { label: string; value: number }) {
 return (
  <span className="inline-flex items-baseline gap-1 rounded-lg border border-border-default bg-bg-primary px-2.5 py-1.5">
   <span className="text-base font-black text-text-primary">{value}</span>
   <span className="text-xs font-bold text-text-secondary">{label}</span>
  </span>
 );
}
