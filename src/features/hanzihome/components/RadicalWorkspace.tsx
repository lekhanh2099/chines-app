"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import type { StaticRadicalData } from "@/features/hanzihome/types";

type RadicalWorkspaceProps = {
 radicals: StaticRadicalData[];
};

export function RadicalWorkspace({ radicals }: RadicalWorkspaceProps) {
 const [selectedId, setSelectedId] = useState<string | null>(radicals[0]?.id || null);
 const [searchValue, setSearchValue] = useState("");
 const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 const visibleRadicals = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();
  return radicals.filter((radical) => {
   const haystack = [
    radical.radical,
    radical.nameVi,
    radical.coreMeaning.history,
    radical.coreMeaning.modern,
    radical.recognition,
    radical.variants.map((variant) => `${variant.form} ${variant.note}`).join(" "),
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
   <Card padding="lg" className="rounded-xl">
    <p className="text-sm font-semibold text-text-muted">Chưa có dữ liệu bộ thủ.</p>
   </Card>
  );
 }

 const sidebar = (
  <div className="grid gap-3">
   <div>
    <h2 className="text-lg font-black text-text-primary">Toàn bộ bộ thủ</h2>
    <p className="text-sm font-semibold text-text-muted">
     {radicals.length} bộ thủ độc lập với bài học.
    </p>
   </div>
   <Input
    value={searchValue}
    onChange={(event) => setSearchValue(event.target.value)}
    placeholder="Tìm bộ thủ, tên, nghĩa..."
    aria-label="Tìm bộ thủ"
   />

   <div className="grid max-h-[calc(100dvh-15rem)] gap-2 overflow-y-auto pr-1 scrollbar-soft">
    {visibleRadicals.map((radical) => (
     <Button
      key={radical.id}
      variant={radical.id === selectedRadical.id ? "default" : "outline"}
      className="h-auto min-h-14 justify-start rounded-lg py-2.5 text-left"
      onClick={() => setSelectedId(radical.id)}
     >
      <span className="text-xl font-black">{radical.radical}</span>
      <span className="min-w-0 flex-1 whitespace-normal line-clamp-2">{radical.nameVi}</span>
      <span className="shrink-0 text-xs uppercase opacity-75">{radical.strokes ?? "?"} nét</span>
     </Button>
    ))}
   </div>
   {visibleRadicals.length === 0 && (
    <p className="rounded-xl bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
     Không có bộ thủ phù hợp bộ lọc.
    </p>
   )}
  </div>
 );

 return (
  <LessonModuleFrame
   title="Bộ thủ"
   subtitle={`${selectedRadical.radical} · ${selectedRadical.nameVi}`}
   sidebarLabel="Danh sách bộ thủ"
   sidebarSummary={`${radicals.length} bộ`}
   sidebarOpen={isSidebarOpen}
   onSidebarOpenChange={setIsSidebarOpen}
   sidebar={sidebar}
   sidebarSelectionKey={selectedRadical.id}
  >
   <Card padding="lg" className="mx-auto w-full max-w-5xl rounded-xl">
    <div className="grid gap-3">
     <div className="flex flex-wrap items-center gap-4">
      <h2 className="text-7xl font-black text-text-primary">{selectedRadical.radical}</h2>
      <div className="min-w-0">
       <div className="flex flex-wrap items-center gap-2">
        <Badge>#{selectedRadical.index}</Badge>
        <Badge variant="info">{selectedRadical.strokes ?? "?"} nét</Badge>
       </div>
       <h3 className="text-2xl font-black text-text-primary">{selectedRadical.nameVi}</h3>
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
         <Badge key={`${variant.form}-${variant.note}`} variant="purple" size="lg">
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
  </LessonModuleFrame>
 );
}

function RadicalSection({ title, children }: { title: string; children: ReactNode }) {
 return (
  <section className="grid gap-2 rounded-xl bg-bg-subtle p-4 text-base leading-relaxed text-text-secondary">
   <h4 className="text-base font-black text-text-primary">{title}</h4>
   {children}
  </section>
 );
}
