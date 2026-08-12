import { cn } from "@/lib/utils";

export function NoteEditorSkeleton({
 showTabBar = false,
 splitView = false,
 className,
}: {
 showTabBar?: boolean;
 splitView?: boolean;
 className?: string;
}) {
 return (
  <div
   className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg-primary", className)}
   aria-busy="true"
   aria-live="polite"
  >
   {showTabBar ? (
    <div className="hidden min-h-12 items-center gap-2 border-b border-border-default bg-bg-card px-4 py-2 md:flex">
     <div className="h-9 w-44 rounded-xl bg-bg-subtle" />
     <div className="h-9 w-36 rounded-xl bg-bg-subtle" />
     <div className="ml-auto size-9 rounded-xl bg-bg-subtle" />
    </div>
   ) : null}

   <div className="grid min-h-0 flex-1 animate-pulse gap-3 p-3 sm:p-4">
    <div className="flex h-12 min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-border-default bg-bg-card px-3">
     {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className={cn("h-7 rounded-lg bg-bg-subtle", index < 2 ? "w-7" : "w-12")} />
     ))}
    </div>
    <div className={cn("grid min-h-0 gap-3", splitView && "lg:grid-cols-2")}>
     {Array.from({ length: splitView ? 2 : 1 }, (_, paneIndex) => (
      <div
       key={paneIndex}
       className="grid min-h-96 content-start gap-4 rounded-xl border border-border-default bg-bg-card p-5"
      >
       <div className="h-5 w-32 rounded-md bg-bg-subtle" />
       <div className="h-8 w-full max-w-64 rounded-lg bg-bg-subtle" />
       {Array.from({ length: 7 }, (_, lineIndex) => (
        <div
         key={lineIndex}
         className={cn("h-4 rounded-md bg-bg-subtle", lineIndex % 3 === 2 ? "w-3/4" : "w-full")}
        />
       ))}
      </div>
     ))}
    </div>
   </div>
   <span className="sr-only">Đang tải trình soạn thảo ghi chú</span>
  </div>
 );
}
