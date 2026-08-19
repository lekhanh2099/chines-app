import { Card } from "@/components/ui/card";

export function AggregateLibrarySkeleton() {
 return (
  <Card variant="section" padding="md" className="grid animate-pulse gap-5" aria-busy="true">
   {Array.from({ length: 4 }, (_, groupIndex) => (
    <section key={groupIndex} className="grid gap-3">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid gap-2">
       <div className="h-6 w-48 rounded-md bg-bg-subtle" />
       <div className="h-3 w-20 rounded-full bg-bg-subtle" />
      </div>
      <div className="flex gap-2">
       <div className="h-9 w-20 rounded-lg bg-bg-subtle" />
       <div className="h-9 w-20 rounded-lg bg-bg-subtle" />
      </div>
     </div>
     <div className="grid gap-2">
      {Array.from({ length: 3 }, (_, itemIndex) => (
       <div key={itemIndex} className="h-16 rounded-xl bg-bg-subtle" />
      ))}
     </div>
    </section>
   ))}
  </Card>
 );
}
