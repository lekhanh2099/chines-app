import { Card } from "@/components/ui/card";

export function HanziHomeWorkspaceLoading() {
 return (
  <main className="hanzihome-static-page" aria-busy="true" aria-live="polite">
   <div className="grid w-full max-w-full animate-pulse gap-2.5">
    <div className="h-11 rounded-xl border border-border-default bg-bg-card" />
    <Card padding="md" className="grid gap-3 rounded-xl">
     <div className="flex items-center justify-between gap-3">
      <div className="grid flex-1 gap-2">
       <div className="h-3 w-24 rounded-full bg-bg-subtle" />
       <div className="h-6 w-56 max-w-full rounded-lg bg-bg-subtle" />
      </div>
      <div className="h-8 w-24 rounded-lg bg-bg-subtle" />
     </div>
     <div className="grid gap-2 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="grid content-start gap-2">
       {Array.from({ length: 5 }, (_, index) => (
        <div
         key={index}
         className="h-16 rounded-lg border border-border-default bg-bg-subtle"
        />
       ))}
      </div>
      <div className="grid min-h-96 content-start gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
       <div className="h-6 w-40 rounded-lg bg-bg-card" />
       <div className="h-28 rounded-xl bg-bg-card" />
       <div className="h-28 rounded-xl bg-bg-card" />
      </div>
     </div>
    </Card>
    <span className="sr-only">Đang tải bài học</span>
   </div>
  </main>
 );
}

