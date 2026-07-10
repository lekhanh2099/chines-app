import { Card } from "@/components/ui/card";

export function RadicalWorkspaceSkeleton() {
 return (
  <div
   className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
   aria-busy="true"
   aria-live="polite"
  >
   <Card
    variant="default"
    padding="sm"
    className="border-border-default/80 bg-bg-card/70 shadow-none backdrop-blur xl:hidden"
   >
    <div className="flex animate-pulse flex-wrap items-center justify-between gap-2">
     <div className="flex items-center gap-2">
      <div className="h-8 w-20 rounded-lg bg-bg-subtle" />
      <div className="grid gap-1">
       <div className="h-4 w-16 rounded-md bg-bg-subtle" />
       <div className="hidden h-3 w-32 rounded-full bg-bg-subtle sm:block" />
      </div>
     </div>
     <div className="flex items-center gap-2">
      <div className="h-5 w-16 rounded-lg bg-bg-subtle" />
     </div>
    </div>
   </Card>

   <div className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]">
    <aside className="hidden min-w-0 xl:block">
     <Card
      variant="default"
      padding="sm"
      className="h-full max-w-full overflow-hidden border-border-default/80 bg-bg-card/60 shadow-none backdrop-blur"
     >
      <div className="grid animate-pulse gap-3 overflow-hidden pr-1">
       <div className="grid gap-1.5">
        <div className="h-5 w-28 rounded-md bg-bg-subtle" />
        <div className="h-3 w-36 rounded-full bg-bg-subtle" />
       </div>
       <div className="h-9 w-full rounded-lg bg-bg-subtle" />
       {Array.from({ length: 5 }, (_, i) => (
        <div
         key={i}
         className="flex h-14 items-center gap-2 rounded-lg border border-border-default bg-bg-subtle px-3 py-2.5"
        >
         <div className="h-6 w-6 shrink-0 rounded bg-bg-card" />
         <div className="h-3 flex-1 rounded-full bg-bg-card" />
         <div className="h-3 w-8 shrink-0 rounded-full bg-bg-card" />
        </div>
       ))}
      </div>
     </Card>
    </aside>

    <div className="min-w-0 overflow-y-auto pr-1 scrollbar-soft">
     <Card padding="lg" className="mx-auto w-full max-w-7xl animate-pulse rounded-xl">
      <div className="grid gap-4 2xl:grid-cols-2">
       <div className="flex flex-wrap items-center gap-4 2xl:col-span-2">
        <div className="h-20 w-20 rounded-xl bg-bg-subtle" />
        <div className="grid gap-2">
         <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-bg-subtle" />
          <div className="h-5 w-14 rounded-full bg-bg-subtle" />
         </div>
         <div className="h-7 w-40 rounded-md bg-bg-subtle" />
        </div>
       </div>

       {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid gap-2">
         <div className="h-5 w-32 rounded-md bg-bg-subtle" />
         <div className="grid gap-1.5 pl-1">
          <div className="h-3 w-full rounded-full bg-bg-subtle" />
          <div className="h-3 w-3/4 rounded-full bg-bg-subtle" />
         </div>
        </div>
       ))}
      </div>
     </Card>
    </div>
   </div>

   <span className="sr-only">Đang tải bộ thủ</span>
  </div>
 );
}
