import { Suspense } from "react";

import { HanziHomeStaticLearningClient } from "@/features/hanzihome/components/HanziHomeStaticLearningClient";
import { hanzihomeMeta } from "@/features/hanzihome/static-data";

export function HanziHomeStaticLearningPage() {
 return (
  <main className="page-shell min-h-screen bg-stone-50">
   <section className="hanzihome-static-page">
    <Suspense fallback={<DatasetSummary />}>
     <HanziHomeStaticLearningClient>
      <DatasetSummary />
     </HanziHomeStaticLearningClient>
    </Suspense>
   </section>
  </main>
 );
}

function DatasetSummary() {
 return (
  <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-600 shadow-theme-sm">
   Dataset:{" "}
   <span className="font-black text-stone-900">
    {hanzihomeMeta.counts.lessons}
   </span>{" "}
   bài ·{" "}
   <span className="font-black text-stone-900">
    {hanzihomeMeta.counts.vocab}
   </span>{" "}
   từ ·{" "}
   <span className="font-black text-stone-900">
    {hanzihomeMeta.counts.grammarPoints}
   </span>{" "}
   điểm ngữ pháp ·{" "}
   <span className="font-black text-stone-900">
    {hanzihomeMeta.counts.radicals}
   </span>{" "}
   bộ thủ.
  </div>
 );
}
