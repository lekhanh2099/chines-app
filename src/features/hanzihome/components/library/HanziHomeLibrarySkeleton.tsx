export function HanziHomeLibrarySkeleton() {
 return (
  <main
   className="flex w-full flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="grid animate-pulse gap-5">
    <div className="flex items-start justify-between gap-4">
     <div className="grid min-w-0 flex-1 gap-2">
      <div className="h-8 w-72 max-w-full rounded-lg bg-bg-subtle" />
      <div className="h-4 w-128 max-w-full rounded-md bg-bg-subtle" />
     </div>
     <div className="hidden gap-2 sm:flex">
      <div className="h-11 w-28 rounded-xl bg-bg-subtle" />
      <div className="h-11 w-20 rounded-xl bg-bg-subtle" />
     </div>
    </div>

    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
     {Array.from({ length: 4 }, (_, index) => (
      <div
       key={index}
       className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-card px-3 py-2.5 shadow-theme-sm sm:px-4 sm:py-3"
      >
       <div className="size-9 shrink-0 rounded-lg bg-bg-subtle" />
       <div className="grid flex-1 gap-1.5">
        <div className="h-5 w-10 rounded-md bg-bg-subtle" />
        <div className="h-3 w-20 max-w-full rounded-full bg-bg-subtle" />
       </div>
      </div>
     ))}
    </div>

    <div className="grid gap-2">
     <div className="h-5 w-40 rounded-md bg-bg-subtle" />
     <div className="h-4 w-96 max-w-full rounded-md bg-bg-subtle" />
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
     {Array.from({ length: 2 }, (_, index) => (
      <div
       key={index}
       className="grid min-h-64 gap-4 rounded-xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5"
      >
       <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-lg bg-bg-subtle" />
        <div className="grid min-w-0 flex-1 gap-2">
         <div className="h-4 w-32 rounded-md bg-bg-subtle" />
         <div className="h-7 w-72 max-w-full rounded-lg bg-bg-subtle" />
         <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
        </div>
        <div className="hidden h-11 w-24 rounded-xl bg-bg-subtle sm:block" />
       </div>
       <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, metricIndex) => (
         <div key={metricIndex} className="h-8 w-24 rounded-lg bg-bg-subtle" />
        ))}
       </div>
       <div className="flex gap-2">
        <div className="h-8 w-28 rounded-lg bg-bg-subtle" />
        <div className="h-8 w-24 rounded-lg bg-bg-subtle" />
       </div>
       <div className="grid self-end gap-2">
        <div className="h-3 w-20 rounded-full bg-bg-subtle" />
        <div className="h-11 w-full rounded-xl bg-bg-subtle" />
       </div>
      </div>
     ))}
    </div>
   </div>
   <span className="sr-only">Đang tải thư viện HanziHome</span>
  </main>
 );
}
