import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

export function HomeDashboardSkeleton() {
 return (
  <PageContainer>
   <div
    className="grid w-full min-w-0 gap-4 sm:gap-5"
    aria-busy="true"
    aria-label="Đang tải trang học"
   >
    <div className="grid min-w-0 animate-pulse gap-3">
     <div className="h-8 w-48 rounded-lg bg-bg-subtle sm:h-9" />
     <div className="h-5 w-full max-w-96 rounded-md bg-bg-subtle" />
    </div>

    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)] xl:items-start">
     <div className="grid min-w-0 gap-4 sm:gap-5">
      <Card variant="section" padding="lg" className="grid min-w-0 animate-pulse gap-5">
       <div className="grid gap-2">
        <div className="h-6 w-28 rounded-md bg-bg-subtle" />
        <div className="h-4 w-full max-w-72 rounded-md bg-bg-subtle" />
       </div>
       <div className="flex items-center gap-4">
        <div className="size-10 shrink-0 rounded-lg bg-bg-subtle" />
        <div className="grid min-w-0 flex-1 gap-2">
         <div className="h-3 w-32 rounded-full bg-bg-subtle" />
         <div className="h-5 w-56 max-w-full rounded-md bg-bg-subtle" />
         <div className="h-4 w-40 max-w-full rounded-md bg-bg-subtle" />
        </div>
       </div>
      </Card>

      <HomeListSkeleton rows={3} />
      <HomeListSkeleton rows={4} />
     </div>

     <aside className="grid min-w-0 gap-4 sm:gap-5">
      <Card variant="section" padding="lg" className="grid min-w-0 animate-pulse gap-5">
       <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
         <div className="h-5 w-24 rounded-md bg-bg-subtle" />
         <div className="h-3 w-48 max-w-full rounded-full bg-bg-subtle" />
        </div>
        <div className="h-9 w-20 rounded-lg bg-bg-subtle" />
       </div>
       <div className="grid grid-cols-2 gap-5">
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

      <Card variant="section" padding="md" className="min-w-0 min-h-28 animate-pulse">
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

function HomeListSkeleton({ rows }: { rows: number }) {
 return (
  <Card variant="section" padding="lg" className="grid min-w-0 animate-pulse gap-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="grid min-w-0 flex-1 gap-1">
     <div className="h-5 w-40 max-w-full rounded-md bg-bg-subtle" />
     <div className="h-3 w-52 max-w-full rounded-full bg-bg-subtle" />
    </div>
    <div className="h-4 w-16 rounded-md bg-bg-subtle" />
   </div>
   <div className="divide-y divide-border-default/70">
    {Array.from({ length: rows }, (_, index) => (
     <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="size-8 rounded-lg bg-bg-subtle" />
      <div className="grid min-w-0 flex-1 gap-1">
       <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
       <div className="h-3 w-28 rounded-full bg-bg-subtle" />
      </div>
     </div>
    ))}
   </div>
  </Card>
 );
}
