export function MemoryTipsSkeleton() {
 return (
  <div className="grid w-full max-w-full animate-pulse gap-4 p-4 sm:p-6 lg:p-8" aria-busy="true">
   {/* Header card */}
   <div className="rounded-xl border border-border-default bg-bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-2">
      <div className="h-3 w-24 rounded-full bg-bg-subtle" />
      <div className="h-8 w-56 rounded-lg bg-bg-subtle sm:h-9" />
      <div className="h-4 w-72 max-w-full rounded-md bg-bg-subtle" />
     </div>
     <div className="h-8 w-28 rounded-lg bg-bg-subtle" />
    </div>
   </div>

   {/* Tip cards */}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, i) => (
     <div key={i} className="rounded-xl border border-border-default bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
       <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-bg-subtle" />
        <div className="grid gap-1">
         <div className="h-5 w-36 rounded-md bg-bg-subtle" />
         <div className="h-3 w-24 rounded-full bg-bg-subtle" />
        </div>
       </div>
      </div>
      <div className="mt-3 grid gap-1.5">
       <div className="h-3 w-full rounded-full bg-bg-subtle" />
       <div className="h-3 w-4/5 rounded-full bg-bg-subtle" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
       <div className="h-5 w-16 rounded-full bg-bg-subtle" />
       <div className="h-5 w-20 rounded-full bg-bg-subtle" />
      </div>
     </div>
    ))}
   </div>
  </div>
 );
}
