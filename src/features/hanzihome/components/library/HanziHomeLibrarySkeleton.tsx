export function HanziHomeLibrarySkeleton() {
 return (
  <main
   className="flex w-full min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-5"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="grid min-w-0 animate-pulse gap-4">
    <section className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-4 shadow-theme-sm">
     <div className="flex items-start justify-between gap-4">
      <div className="grid min-w-0 flex-1 gap-2">
       <div className="h-8 w-full max-w-72 rounded-lg bg-bg-subtle" />
       <div className="h-4 w-full max-w-96 rounded-md bg-bg-subtle" />
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
        className="flex items-center gap-2.5 rounded-xl border border-border-default bg-bg-subtle/60 px-3 py-2"
       >
        <div className="size-9 shrink-0 rounded-lg bg-bg-muted" />
        <div className="grid flex-1 gap-1.5">
         <div className="h-5 w-10 rounded-md bg-bg-muted" />
         <div className="h-3 w-20 max-w-full rounded-full bg-bg-muted" />
        </div>
       </div>
      ))}
     </div>
    </section>

    {Array.from({ length: 3 }, (_, groupIndex) => (
     <section key={groupIndex} className="grid gap-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm">
       <div className="size-9 shrink-0 rounded-lg bg-bg-subtle" />
       <div className="grid min-w-0 flex-1 gap-2">
        <div className="h-5 w-44 rounded-md bg-bg-subtle" />
        <div className="h-3 w-full max-w-64 rounded-full bg-bg-subtle" />
       </div>
       <div className="hidden h-7 w-28 rounded-full bg-bg-subtle sm:block" />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
       {Array.from({ length: 2 }, (_, cardIndex) => (
        <div
         key={cardIndex}
         className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm sm:p-4"
        >
         <div className="flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-lg bg-bg-subtle" />
          <div className="grid min-w-0 flex-1 gap-2">
           <div className="h-4 w-20 rounded-md bg-bg-subtle" />
           <div className="h-6 w-56 max-w-full rounded-lg bg-bg-subtle" />
          </div>
         </div>
         <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, metricIndex) => (
           <div key={metricIndex} className="h-12 rounded-lg bg-bg-subtle" />
          ))}
         </div>
         <div className="grid gap-2 rounded-xl border border-border-default p-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="h-10 rounded-lg bg-bg-subtle" />
          <div className="h-10 rounded-lg bg-bg-subtle sm:w-24" />
         </div>
        </div>
       ))}
      </div>
     </section>
    ))}
   </div>
   <span className="sr-only">Đang tải thư viện HanziHome</span>
  </main>
 );
}
