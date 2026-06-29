export function AggregateLibrarySkeleton() {
 return (
  <div className="grid w-full max-w-full animate-pulse gap-4 p-4 sm:p-6 lg:p-8" aria-busy="true">
   {/* Header */}
   <div className="rounded-xl border border-border-default bg-bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-2">
      <div className="h-3 w-24 rounded-full bg-bg-subtle" />
      <div className="h-8 w-64 rounded-lg bg-bg-subtle sm:h-9" />
      <div className="h-4 w-80 max-w-full rounded-md bg-bg-subtle" />
     </div>
     <div className="flex gap-2">
      <div className="h-8 w-20 rounded-lg bg-bg-subtle" />
      <div className="h-8 w-20 rounded-lg bg-bg-subtle" />
     </div>
    </div>
   </div>

   {/* Search & Filter bar */}
   <div className="flex flex-wrap items-center gap-3">
    <div className="h-11 flex-1 rounded-xl border border-border-default bg-bg-subtle" />
    <div className="h-11 w-32 rounded-xl border border-border-default bg-bg-subtle" />
   </div>

   {/* Lesson tabs */}
   <div className="flex flex-wrap gap-2">
    {Array.from({ length: 6 }, (_, i) => (
     <div key={i} className="h-9 w-28 rounded-lg bg-bg-subtle" />
    ))}
   </div>

   {/* Content grid */}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, i) => (
     <div key={i} className="rounded-xl border border-border-default bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
       <div className="min-w-0 flex-1">
        <div className="h-5 w-3/4 rounded-md bg-bg-subtle" />
        <div className="mt-2 h-4 w-1/2 rounded-md bg-bg-subtle" />
       </div>
       <div className="h-6 w-12 shrink-0 rounded-full bg-bg-subtle" />
      </div>
      <div className="mt-3 grid gap-1.5">
       <div className="h-3 w-full rounded-full bg-bg-subtle" />
       <div className="h-3 w-5/6 rounded-full bg-bg-subtle" />
      </div>
     </div>
    ))}
   </div>
  </div>
 );
}
