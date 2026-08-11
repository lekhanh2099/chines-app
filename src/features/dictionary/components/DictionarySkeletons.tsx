import { PageContainer } from "@/components/layout/page-container";

export function DictionarySrsSkeleton() {
 return (
  <main className="hanzihome-static-page" aria-busy="true" aria-live="polite">
   <div className="grid animate-pulse gap-4">
    <div className="h-36 rounded-xl border border-border-default bg-bg-card" />
    <div className="h-20 rounded-xl border border-border-default bg-bg-card" />
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
     {Array.from({ length: 6 }, (_, index) => (
      <div
       key={index}
       className="grid min-h-40 gap-3 rounded-xl border border-border-default bg-bg-card p-4"
      >
       <div className="flex justify-between gap-3">
        <div className="grid flex-1 gap-2">
         <div className="h-8 w-16 rounded-lg bg-bg-subtle" />
         <div className="h-4 w-28 rounded-md bg-bg-subtle" />
        </div>
        <div className="h-7 w-20 rounded-full bg-bg-subtle" />
       </div>
       <div className="h-4 w-24 rounded-md bg-bg-subtle" />
       <div className="h-4 w-full rounded-md bg-bg-subtle" />
      </div>
     ))}
    </div>
   </div>
   <span className="sr-only">Đang tải kho SRS từ vựng</span>
  </main>
 );
}

export function DictionaryWordSkeleton() {
 return (
  <PageContainer className="bg-bg-primary">
   <div
    className="flex w-full min-w-0 animate-pulse flex-col gap-5"
    aria-busy="true"
    aria-live="polite"
   >
    <div className="flex justify-between gap-3">
     <div className="h-12 w-32 rounded-xl bg-bg-subtle" />
     <div className="h-12 w-40 rounded-xl bg-bg-subtle" />
    </div>
    <div className="min-h-56 rounded-xl border border-border-default bg-bg-card p-5">
     <div className="grid gap-4">
      <div className="h-16 w-28 rounded-xl bg-bg-subtle" />
      <div className="h-5 w-48 rounded-md bg-bg-subtle" />
      <div className="h-4 w-96 max-w-full rounded-md bg-bg-subtle" />
     </div>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
     <div className="grid gap-5">
      {Array.from({ length: 3 }, (_, index) => (
       <div key={index} className="h-44 rounded-xl border border-border-default bg-bg-card" />
      ))}
     </div>
     <div className="grid content-start gap-5">
      <div className="h-72 rounded-xl border border-border-default bg-bg-card" />
      <div className="h-40 rounded-xl border border-border-default bg-bg-card" />
     </div>
    </div>
    <span className="sr-only">Đang tải dữ liệu từ điển</span>
   </div>
  </PageContainer>
 );
}
