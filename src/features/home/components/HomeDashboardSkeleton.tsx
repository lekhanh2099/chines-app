export function HomeDashboardSkeleton() {
 return (
  <div className="flex w-full max-w-full flex-col gap-5 px-4 py-5 lg:px-8 lg:py-7">
   <div className="grid gap-5">
    {/* Continue Learning Skeleton */}
    <section
     className="overflow-hidden rounded-2xl border border-border-default bg-bg-card p-5 shadow-theme-lg sm:p-7"
     aria-busy="true"
    >
     <div className="animate-pulse">
      <div className="h-8 w-72 rounded-lg bg-bg-subtle sm:h-9" />
      <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-bg-subtle" />
      <div className="mt-6 flex h-28 items-center gap-4 rounded-2xl border border-border-default bg-bg-primary p-4 sm:p-5">
       <div className="h-12 w-12 shrink-0 rounded-xl bg-bg-subtle" />
       <div className="min-w-0 flex-1">
        <div className="h-3 w-32 rounded-full bg-bg-subtle" />
        <div className="mt-2 h-5 w-56 rounded-md bg-bg-subtle" />
        <div className="mt-2 h-4 w-40 rounded-md bg-bg-subtle" />
       </div>
      </div>
     </div>
    </section>

    {/* Resource Links Skeleton */}
    <div className="grid gap-3 sm:grid-cols-3">
     {Array.from({ length: 3 }, (_, i) => (
      <div
       key={i}
       className="animate-pulse rounded-2xl border border-border-default bg-bg-card p-4"
      >
       <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-bg-subtle" />
        <div className="grid flex-1 gap-1">
         <div className="h-4 w-24 rounded-md bg-bg-subtle" />
         <div className="h-3 w-32 rounded-full bg-bg-subtle" />
        </div>
       </div>
       <div className="mt-3 h-3 w-full rounded-full bg-bg-subtle" />
       <div className="mt-2 h-3 w-3/4 rounded-full bg-bg-subtle" />
      </div>
     ))}
    </div>

    {/* Notes + Quick Actions Skeleton */}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
     <div className="animate-pulse rounded-2xl border border-border-default bg-bg-card p-5">
      <div className="flex items-center justify-between">
       <div className="grid gap-1">
        <div className="h-5 w-32 rounded-md bg-bg-subtle" />
        <div className="h-3 w-48 rounded-full bg-bg-subtle" />
       </div>
       <div className="h-4 w-20 rounded-md bg-bg-subtle" />
      </div>
      <div className="mt-4 grid gap-2">
       {Array.from({ length: 3 }, (_, j) => (
        <div
         key={j}
         className="flex items-center gap-3 rounded-lg border border-border-default p-3"
        >
         <div className="h-8 w-8 rounded-lg bg-bg-subtle" />
         <div className="grid flex-1 gap-1">
          <div className="h-3 w-40 rounded-full bg-bg-subtle" />
          <div className="h-3 w-24 rounded-full bg-bg-subtle" />
         </div>
        </div>
       ))}
      </div>
     </div>

     <div className="animate-pulse rounded-2xl border border-border-default bg-bg-card p-5">
      {Array.from({ length: 4 }, (_, j) => (
       <div
        key={j}
        className="flex items-center gap-3 border-b border-border-default py-3 last:border-b-0"
       >
        <div className="h-9 w-9 rounded-xl bg-bg-subtle" />
        <div className="grid flex-1 gap-1">
         <div className="h-4 w-28 rounded-md bg-bg-subtle" />
         <div className="h-3 w-36 rounded-full bg-bg-subtle" />
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}
