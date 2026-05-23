"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StaticRadicalData } from "@/features/hanzihome/types";

type RadicalWorkspaceProps = {
 radicals: StaticRadicalData[];
};

export function RadicalWorkspace({ radicals }: RadicalWorkspaceProps) {
 const [selectedId, setSelectedId] = useState<string | null>(
  radicals[0]?.id || null,
 );
 const [searchValue, setSearchValue] = useState("");
 const visibleRadicals = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();
  return radicals.filter((radical) => {
   const haystack = [
    radical.radical,
    radical.nameVi,
    radical.coreMeaning.history,
    radical.coreMeaning.modern,
    radical.recognition,
    radical.variants
     .map((variant) => `${variant.form} ${variant.note}`)
     .join(" "),
   ]
    .join(" ")
    .toLowerCase();

   return !keyword || haystack.includes(keyword);
  });
 }, [radicals, searchValue]);
 const selectedRadical = useMemo(
  () =>
   radicals.find((radical) => radical.id === selectedId) ||
   visibleRadicals[0] ||
   radicals[0] ||
   null,
  [radicals, selectedId, visibleRadicals],
 );

 if (!selectedRadical) {
  return (
   <Card padding="lg" className="rounded-2xl">
    <p className="text-sm font-semibold text-text-muted">
     Chưa có dữ liệu bộ thủ.
    </p>
   </Card>
  );
 }

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(20rem,23.75rem)_minmax(0,1fr)]">
   <Card
    padding="md"
    className="rounded-2xl lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-soft "
   >
    <div className="grid gap-3">
     <div>
      <h2 className="text-lg font-black text-text-primary">Toàn bộ bộ thủ</h2>
      <p className="text-sm font-semibold text-text-muted">
       {radicals.length} bộ thủ độc lập với bài học. Sau này có thể derive bộ
       thủ theo từ vựng bài khi cần.
      </p>
     </div>
     <Input
      value={searchValue}
      onChange={(event) => setSearchValue(event.target.value)}
      placeholder="Tìm bộ thủ, tên, nghĩa..."
      aria-label="Tìm bộ thủ"
     />

     <div className="grid gap-2">
      {visibleRadicals.map((radical) => (
       <Button
        key={radical.id}
        variant={radical.id === selectedRadical.id ? "default" : "outline"}
        className="h-auto justify-start rounded-2xl py-3"
        onClick={() => setSelectedId(radical.id)}
       >
        <span className="text-xl font-black">{radical.radical}</span>
        <span className="min-w-0 flex-1 truncate">{radical.nameVi}</span>
        <span className="text-xs uppercase opacity-75">
         {radical.strokes ?? "?"} nét
        </span>
       </Button>
      ))}
     </div>
     {visibleRadicals.length === 0 && (
      <p className="rounded-2xl bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
       Không có bộ thủ phù hợp bộ lọc.
      </p>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-2xl">
    <div className="grid gap-5">
     <div className="flex flex-wrap items-center gap-4">
      <h2 className="text-7xl font-black text-text-primary">
       {selectedRadical.radical}
      </h2>
      <div className="min-w-0">
       <div className="flex flex-wrap items-center gap-2">
        <Badge>#{selectedRadical.index}</Badge>
        <Badge variant="info">{selectedRadical.strokes ?? "?"} nét</Badge>
       </div>
       <h3 className="mt-2 text-2xl font-black text-text-primary">
        {selectedRadical.nameVi}
       </h3>
      </div>
     </div>

     <RadicalSection title="Ý nghĩa cốt lõi">
      <p>{selectedRadical.coreMeaning.modern}</p>
      <p className="text-text-muted">{selectedRadical.coreMeaning.history}</p>
     </RadicalSection>

     {selectedRadical.variants.length > 0 && (
      <RadicalSection title="Biến thể">
       <div className="flex flex-wrap gap-2">
        {selectedRadical.variants.map((variant) => (
         <Badge
          key={`${variant.form}-${variant.note}`}
          variant="purple"
          size="lg"
         >
          {variant.form} · {variant.note}
         </Badge>
        ))}
       </div>
      </RadicalSection>
     )}

     <RadicalSection title="Nhận diện">
      <p>{selectedRadical.recognition}</p>
     </RadicalSection>

     {selectedRadical.distinguish.length > 0 && (
      <RadicalSection title="Phân biệt">
       <ul className="grid gap-2">
        {selectedRadical.distinguish.map((item) => (
         <li key={item}>{item}</li>
        ))}
       </ul>
      </RadicalSection>
     )}
    </div>
   </Card>
  </div>
 );
}

function RadicalSection({
 title,
 children,
}: {
 title: string;
 children: ReactNode;
}) {
 return (
  <section className="grid gap-2 rounded-2xl bg-bg-subtle p-4 text-base leading-relaxed text-text-secondary">
   <h4 className="text-base font-black text-text-primary">{title}</h4>
   {children}
  </section>
 );
}
