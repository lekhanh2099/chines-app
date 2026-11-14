export function LinkedContentSkeleton({ label }: { label: string }) {
 return (
  <div className="grid min-w-0 animate-pulse gap-3 p-1 sm:p-2" aria-busy="true" aria-live="polite">
   <div className="flex min-w-0 items-center justify-between gap-2">
    <div className="h-4 w-20 rounded bg-bg-subtle" />
    <div className="flex items-center gap-2">
     <div className="h-9 w-28 rounded-lg bg-bg-subtle" />
     <div className="size-9 rounded-lg bg-bg-subtle" />
    </div>
   </div>
   <div className="grid min-h-56 min-w-0 content-start gap-4 overflow-hidden rounded-xl border border-border-default bg-bg-primary p-4 sm:p-5">
    <div className="h-5 w-28 rounded-md bg-bg-subtle" />
    <div className="h-8 w-56 max-w-full rounded-lg bg-bg-subtle" />
    {Array.from({ length: 5 }, (_, index) => (
     <div
      key={index}
      className={index % 3 === 2 ? "h-4 w-3/4 rounded bg-bg-subtle" : "h-4 rounded bg-bg-subtle"}
     />
    ))}
   </div>
   <span className="sr-only">{label}</span>
  </div>
 );
}
