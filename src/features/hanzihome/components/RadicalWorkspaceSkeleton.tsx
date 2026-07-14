export function RadicalWorkspaceSkeleton() {
 return (
  <div
   className="h-full min-h-0 overflow-y-auto scrollbar-soft"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="mx-auto grid w-full max-w-7xl animate-pulse gap-5 p-2 sm:p-3 lg:gap-7 lg:p-5">
    <div className="grid gap-3">
     <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-2">
       <div className="h-6 w-40 rounded-md bg-bg-subtle" />
       <div className="h-4 w-72 max-w-full rounded-md bg-bg-subtle" />
      </div>
      <div className="h-11 w-full rounded-xl bg-bg-subtle lg:w-80" />
     </div>
     <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 7 }, (_, index) => (
       <div key={index} className="h-11 w-24 shrink-0 rounded-xl bg-bg-subtle" />
      ))}
     </div>
    </div>

    <div className="grid gap-3 border-t border-border-default pt-5 lg:pt-7">
     <div className="flex items-center justify-between gap-3">
      <div className="grid gap-2">
       <div className="h-7 w-44 rounded-md bg-bg-subtle" />
       <div className="h-4 w-20 rounded-md bg-bg-subtle" />
      </div>
      <div className="h-10 w-20 rounded-xl bg-bg-subtle" />
     </div>
     <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
       <div
        key={index}
        className="grid min-h-52 content-between gap-4 rounded-xl border border-border-default bg-bg-card p-4"
       >
        <div className="flex items-start justify-between gap-3">
         <div className="size-14 rounded-xl bg-bg-subtle" />
         <div className="h-5 w-14 rounded-full bg-bg-subtle" />
        </div>
        <div className="grid gap-2">
         <div className="h-5 w-32 rounded-md bg-bg-subtle" />
         <div className="h-4 w-full rounded-md bg-bg-subtle" />
         <div className="h-3 w-24 rounded-md bg-bg-subtle" />
        </div>
        <div className="h-4 w-24 rounded-md bg-bg-subtle" />
       </div>
      ))}
     </div>
    </div>
   </div>

   <span className="sr-only">Đang tải bộ thủ</span>
  </div>
 );
}
