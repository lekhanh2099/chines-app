export function VocabReviewSkeleton() {
 return (
  <div
   className="grid animate-pulse gap-4 rounded-xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="flex items-center justify-between gap-3">
    <div className="grid flex-1 gap-2">
     <div className="h-5 w-48 rounded-md bg-bg-subtle" />
     <div className="h-4 w-72 max-w-full rounded-md bg-bg-subtle" />
    </div>
    <div className="h-10 w-24 rounded-xl bg-bg-subtle" />
   </div>
   <div className="mx-auto grid min-h-80 w-full max-w-2xl place-items-center rounded-2xl border border-border-default bg-bg-primary p-6">
    <div className="grid w-full max-w-lg gap-5">
     <div className="mx-auto h-12 w-40 rounded-xl bg-bg-subtle" />
     <div className="mx-auto h-6 w-64 max-w-full rounded-lg bg-bg-subtle" />
     <div className="grid gap-3">
      <div className="h-12 rounded-xl bg-bg-subtle" />
      <div className="h-12 rounded-xl bg-bg-subtle" />
     </div>
    </div>
   </div>
   <span className="sr-only">Đang tải bài để ôn</span>
  </div>
 );
}
