export function LinkedContentSkeleton({ label }: { label: string }) {
 return (
  <div
   className="grid animate-pulse gap-3 rounded-xl border border-border-default bg-bg-subtle p-4"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="h-4 w-48 max-w-full rounded-md bg-bg-card" />
   <div className="h-3 w-full rounded-full bg-bg-card" />
   <div className="h-3 w-4/5 rounded-full bg-bg-card" />
   <span className="sr-only">{label}</span>
  </div>
 );
}
