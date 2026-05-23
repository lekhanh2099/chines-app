"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

export function RadicalWorkspace({ lesson }: { lesson: HanziHomeLesson }) {
 const [selectedId, setSelectedId] = useState<string | null>(
  lesson.radicals[0]?.id || null,
 );
 const selectedRadical = useMemo(
  () =>
   lesson.radicals.find((radical) => radical.id === selectedId) ||
   lesson.radicals[0] ||
   null,
  [lesson.radicals, selectedId],
 );

 if (!selectedRadical) {
  return (
   <Card padding="lg" className="rounded-2xl">
    <p className="text-sm font-semibold text-text-muted">Chưa có dữ liệu bộ thủ cho bài này.</p>
   </Card>
  );
 }

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
   <Card padding="md" className="rounded-2xl">
    <div className="grid gap-2">
     {lesson.radicals.map((radical) => (
      <Button
       key={radical.id}
       variant={radical.id === selectedRadical.id ? "default" : "outline"}
       className="h-auto justify-start rounded-2xl py-3"
       onClick={() => setSelectedId(radical.id)}
      >
       <span className="text-xl font-black">{radical.radical}</span>
       <span className="min-w-0 truncate">{radical.nameVi}</span>
      </Button>
     ))}
    </div>
   </Card>

   <Card padding="lg" className="rounded-2xl">
    <div className="grid gap-5">
     <div>
      <div className="flex flex-wrap items-center gap-3">
       <h2 className="text-6xl font-black text-text-primary">
        {selectedRadical.radical}
       </h2>
       <div>
        <h3 className="text-2xl font-black text-text-primary">
         {selectedRadical.nameVi}
        </h3>
        <Badge>{selectedRadical.strokes} nét</Badge>
       </div>
      </div>
     </div>

     <section className="grid gap-2">
      <h4 className="text-base font-black text-text-primary">Ý nghĩa cốt lõi</h4>
      <p className="text-sm leading-relaxed text-text-secondary">
       {selectedRadical.coreMeaning.modern}
      </p>
      <p className="text-sm leading-relaxed text-text-muted">
       {selectedRadical.coreMeaning.history}
      </p>
     </section>

     {selectedRadical.variants.length > 0 && (
      <section className="grid gap-2">
       <h4 className="text-base font-black text-text-primary">Biến thể</h4>
       <div className="flex flex-wrap gap-2">
        {selectedRadical.variants.map((variant) => (
         <Badge key={`${variant.form}-${variant.note}`} variant="purple" size="lg">
          {variant.form} · {variant.note}
         </Badge>
        ))}
       </div>
      </section>
     )}

     <section className="grid gap-2">
      <h4 className="text-base font-black text-text-primary">Nhận diện</h4>
      <p className="text-sm leading-relaxed text-text-secondary">
       {selectedRadical.recognition}
      </p>
     </section>
    </div>
   </Card>
  </div>
 );
}
