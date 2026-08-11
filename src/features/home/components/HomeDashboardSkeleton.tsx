import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

export function HomeDashboardSkeleton() {
 return (
  <PageContainer>
   <div className="grid w-full gap-5" aria-busy="true" aria-label="Đang tải trang học">
    <div className="animate-pulse">
     <div className="h-8 w-48 rounded-lg bg-bg-subtle sm:h-9" />
     <div className="mt-3 h-5 w-96 max-w-full rounded-md bg-bg-subtle" />
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.65fr)] xl:items-start">
     <div className="grid gap-5">
      <section className="grid gap-3">
       <div className="animate-pulse">
        <div className="h-6 w-28 rounded-md bg-bg-subtle" />
        <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-bg-subtle" />
       </div>
       <Card variant="section" padding="md" className="min-h-28 animate-pulse">
        <div className="flex min-h-24 items-center gap-4">
         <div className="size-11 shrink-0 rounded-lg bg-bg-subtle" />
         <div className="min-w-0 flex-1">
          <div className="h-3 w-32 rounded-full bg-bg-subtle" />
          <div className="mt-2 h-5 w-56 max-w-full rounded-md bg-bg-subtle" />
          <div className="mt-2 h-4 w-40 max-w-full rounded-md bg-bg-subtle" />
         </div>
        </div>
       </Card>
      </section>

      <Card variant="section" padding="lg" className="animate-pulse">
       <div className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
         <div className="h-5 w-40 rounded-md bg-bg-subtle" />
         <div className="h-3 w-52 max-w-full rounded-full bg-bg-subtle" />
        </div>
        <div className="h-4 w-16 rounded-md bg-bg-subtle" />
       </div>
       <div className="mt-4 divide-y divide-border-default/70">
        {Array.from({ length: 3 }, (_, index) => (
         <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="size-8 rounded-lg bg-bg-subtle" />
          <div className="grid flex-1 gap-1">
           <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
           <div className="h-3 w-28 rounded-full bg-bg-subtle" />
          </div>
         </div>
        ))}
       </div>
      </Card>
     </div>

     <aside className="grid gap-5">
      <Card variant="section" padding="lg" className="animate-pulse">
       <div className="flex items-start justify-between gap-3">
        <div>
         <div className="h-5 w-24 rounded-md bg-bg-subtle" />
         <div className="mt-2 h-3 w-48 max-w-full rounded-full bg-bg-subtle" />
        </div>
        <div className="h-9 w-20 rounded-lg bg-bg-subtle" />
       </div>
       <div className="mt-5 grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }, (_, index) => (
         <div key={index} className="flex gap-3">
          <div className="size-8 rounded-lg bg-bg-subtle" />
          <div className="grid gap-1">
           <div className="h-5 w-8 rounded-md bg-bg-subtle" />
           <div className="h-3 w-24 rounded-full bg-bg-subtle" />
          </div>
         </div>
        ))}
       </div>
      </Card>

      <Card variant="section" padding="md" className="min-h-28 animate-pulse">
       <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-bg-subtle" />
        <div className="grid flex-1 gap-2">
         <div className="h-3 w-20 rounded-full bg-bg-subtle" />
         <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
        </div>
       </div>
      </Card>
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}
