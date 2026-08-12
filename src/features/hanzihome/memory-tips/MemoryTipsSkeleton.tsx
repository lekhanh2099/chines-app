import { Card } from "@/components/ui/card";

export function MemoryTipsSkeleton() {
 return (
  <div className="grid w-full min-w-0 animate-pulse gap-5" aria-busy="true">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="grid gap-2">
     <div className="h-3 w-24 rounded-full bg-bg-subtle" />
     <div className="h-9 w-52 rounded-lg bg-bg-subtle" />
     <div className="h-4 w-full max-w-96 rounded-md bg-bg-subtle" />
     <div className="h-3 w-28 rounded-full bg-bg-subtle" />
    </div>
    <div className="h-9 w-36 rounded-lg bg-bg-subtle" />
   </div>

   <div className="grid gap-3">
    {Array.from({ length: 4 }, (_, index) => (
     <Card key={index} variant="section" padding="lg" className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
       <div className="grid flex-1 gap-2">
        <div className="flex gap-2">
         <div className="h-6 w-20 rounded-full bg-bg-subtle" />
         <div className="h-6 w-16 rounded-full bg-bg-subtle" />
        </div>
        <div className="h-6 w-52 max-w-full rounded-md bg-bg-subtle" />
        <div className="h-4 w-full max-w-2xl rounded-md bg-bg-subtle" />
       </div>
       <div className="size-9 rounded-lg bg-bg-subtle" />
      </div>
      <div className="h-16 w-full rounded-lg bg-bg-subtle" />
     </Card>
    ))}
   </div>
  </div>
 );
}
