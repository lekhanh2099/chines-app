import { WorkspaceCommandHeader } from "@/components/layout/workspace-command-header";

export function NotesWorkspaceSkeleton() {
 return (
  <div
   className="flex h-[calc(100dvh_-_3.5rem_-_88px_-_env(safe-area-inset-bottom))] min-h-0 animate-pulse flex-col overflow-hidden bg-bg-primary md:h-[calc(100dvh_-_3.5rem)]"
   aria-busy="true"
   aria-live="polite"
  >
   <WorkspaceCommandHeader
    title={<span className="block h-6 w-28 rounded-md bg-bg-subtle" />}
    badge={<span className="block h-6 w-16 rounded-full bg-bg-subtle" />}
    description={<span className="block h-4 w-96 max-w-full rounded-md bg-bg-subtle" />}
    controls={
     <>
      <div className="h-11 min-w-0 flex-1 rounded-xl bg-bg-subtle md:max-w-sm" />
      {Array.from({ length: 3 }, (_, index) => (
       <div key={index} className="size-11 shrink-0 rounded-xl bg-bg-subtle" />
      ))}
     </>
    }
   >
    <div className="flex gap-2 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-1">
     {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="h-10 w-28 shrink-0 rounded-xl bg-bg-subtle" />
     ))}
    </div>
   </WorkspaceCommandHeader>

   <div className="min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-4 lg:px-6 lg:py-4 xl:px-8">
    <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-theme-sm">
     {Array.from({ length: 6 }, (_, index) => (
      <div
       key={index}
       className="flex min-h-24 items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
      >
       <div className="size-9 shrink-0 rounded-xl bg-bg-subtle" />
       <div className="grid min-w-0 flex-1 gap-2">
        <div className="h-4 w-64 max-w-full rounded-md bg-bg-subtle" />
        <div className="h-3 w-32 rounded-full bg-bg-subtle" />
        <div className="flex gap-2">
         <div className="h-6 w-20 rounded-full bg-bg-subtle" />
         <div className="h-6 w-14 rounded-full bg-bg-subtle" />
        </div>
       </div>
       <div className="hidden h-4 w-24 rounded-md bg-bg-subtle sm:block" />
      </div>
     ))}
    </div>
   </div>
   <span className="sr-only">Đang tải ghi chú</span>
  </div>
 );
}
