"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { EmptyState } from "@/features/grammar/components/ui";
import type { HanziHomeRadical } from "@/features/hanzihome/static-data";
import { cn } from "@/lib/utils";

export function StaticRadicalWorkspace({
 radicals,
}: {
 radicals: HanziHomeRadical[];
}) {
 const [query, setQuery] = useState("");
 const [radicalId, setRadicalId] = useState<string | null>(null);
 const normalizedQuery = query.trim().toLowerCase();
 const visibleRadicals = useMemo(() => {
  if (!normalizedQuery) return radicals;
  return radicals.filter((radical) => {
   const haystack = [
    radical.index,
    radical.radical,
    radical.nameVi,
    radical.strokes,
    radical.coreMeaning.history,
    radical.coreMeaning.modern,
    radical.recognition,
    ...radical.variants.map((item) => `${item.form} ${item.note}`),
    ...radical.relatedComponents.map((item) => `${item.form} ${item.note}`),
    ...radical.distinguish,
    ...radical.groups.flatMap((group) => [group.name, ...group.chars]),
   ]
    .join(" ")
    .toLowerCase();
   return haystack.includes(normalizedQuery);
  });
 }, [normalizedQuery, radicals]);
 const activeRadical =
  visibleRadicals.find((radical) => radical.id === radicalId) ||
  radicals.find((radical) => radical.id === radicalId) ||
  visibleRadicals[0] ||
  radicals[0] ||
  null;

 if (!activeRadical) {
  return (
   <EmptyState
    title="Chưa có dữ liệu bộ thủ"
    description="Bundle hiện tại không có record bộ thủ để hiển thị."
    compact
   />
  );
 }

 return (
  <div className="hanzihome-radical-split-layout">
   <aside className="flex min-w-0 flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-theme-sm">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
      Bộ thủ
     </p>
     <h2 className="mt-1 text-lg font-black text-stone-950">
      244 mục tra nhanh
     </h2>
    </div>
    <label className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-stone-50 px-3">
     <Search className="h-4 w-4 shrink-0 text-stone-400" />
     <Input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder="Tìm 人, bộ Nhân, người..."
      className="h-10 min-w-0 border-0 bg-transparent px-0 text-sm font-bold shadow-none focus-visible:ring-0"
     />
    </label>
    <div className="flex items-center justify-between gap-2 text-xs font-black text-stone-500">
     <span>{visibleRadicals.length} kết quả</span>
     <span>{activeRadical.strokes} nét</span>
    </div>
    <div
     data-radical-list
     className="no-scrollbar grid max-h-[13rem] min-w-0 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:max-h-[52dvh] sm:grid-cols-2 lg:grid-cols-1"
    >
     {visibleRadicals.map((radical) => (
      <button
       key={radical.id}
       type="button"
       onClick={() => setRadicalId(radical.id)}
       className={cn(
        "flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-left transition",
        radical.id === activeRadical.id
         ? "bg-red-50 text-red-600"
         : "text-stone-700 hover:bg-stone-50",
       )}
      >
       <span>{radical.radical}</span>
       <span className="min-w-0">
        <span className="block truncate text-sm font-black">
         {radical.nameVi}
        </span>
        <span className="block truncate text-xs font-bold text-stone-400">
         #{radical.index} · {radical.strokes} nét
        </span>
       </span>
      </button>
     ))}
    </div>
   </aside>

   <section
    data-radical-detail
    className="min-w-0 rounded-3xl border border-stone-200 bg-white p-4 shadow-theme-sm sm:p-5"
   >
    <div className="hanzihome-radical-detail-grid">
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
       Bộ {activeRadical.index}
      </p>
      <div className="mt-2 flex min-w-0 flex-wrap items-end gap-3">
       <div className="flex w-fit shrink-0 items-center justify-center rounded-3xl bg-red-50 p-2 text-6xl font-black text-red-600">
        {activeRadical.radical}
       </div>
       <div className="min-w-0 flex-1">
        <h2 className="break-words text-2xl font-black text-stone-950 sm:text-3xl">
         {activeRadical.nameVi}
        </h2>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {activeRadical.strokes} nét · {activeRadical.variants.length || 1} dạng
         viết
        </p>
       </div>
      </div>
      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
       <RadicalInfoCard
        title="Nghĩa gốc"
        content={
         activeRadical.coreMeaning.history || "Chưa có ghi chú nghĩa gốc."
        }
       />
       <RadicalInfoCard
        title="Nghĩa hiện đại"
        content={
         activeRadical.coreMeaning.modern || "Chưa có ghi chú nghĩa hiện đại."
        }
       />
      </div>
      <RadicalSection title="Cách nhận diện">
       <p className="break-words text-sm font-bold leading-7 text-stone-700">
        {activeRadical.recognition}
       </p>
      </RadicalSection>
      {activeRadical.distinguish.length > 0 && (
       <RadicalSection title="Dễ nhầm">
        <div className="grid min-w-0 gap-2">
         {activeRadical.distinguish.map((item) => (
          <p
           key={item}
           className="min-w-0 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-bold leading-6 text-amber-900"
          >
           {item}
          </p>
         ))}
        </div>
       </RadicalSection>
      )}
     </div>

     <div className="min-w-0 space-y-4">
      <RadicalSection title="Biến thể">
       <div className="grid min-w-0 gap-2">
        {activeRadical.variants.map((variant) => (
         <RadicalToken
          key={`${variant.form}-${variant.note}`}
          symbol={variant.form}
          label={variant.note || "Dạng viết liên quan"}
         />
        ))}
       </div>
      </RadicalSection>
      {activeRadical.relatedComponents.length > 0 && (
       <RadicalSection title="Linh kiện liên quan">
        <div className="grid min-w-0 gap-2">
         {activeRadical.relatedComponents.map((component) => (
          <RadicalToken
           key={`${component.form}-${component.note}`}
           symbol={component.form}
           label={component.note || "Linh kiện liên quan"}
          />
         ))}
        </div>
       </RadicalSection>
      )}
      {activeRadical.groups.length > 0 && (
       <RadicalSection title="Nhóm chữ">
        <div className="grid min-w-0 gap-2">
         {activeRadical.groups.map((group) => (
          <div key={group.name} className="min-w-0 rounded-2xl bg-stone-50 p-3">
           <p className="text-sm font-black text-stone-900">{group.name}</p>
           <p className="mt-2 break-words text-2xl font-black text-red-600">
            {group.chars.join(" ")}
           </p>
          </div>
         ))}
        </div>
       </RadicalSection>
      )}
     </div>
    </div>
   </section>
  </div>
 );
}

function RadicalInfoCard({
 title,
 content,
}: {
 title: string;
 content: string;
}) {
 return (
  <div className="min-w-0 rounded-2xl bg-stone-50 p-3">
   <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-400">
    {title}
   </p>
   <p className="mt-2 break-words text-sm font-bold leading-7 text-stone-700">
    {content}
   </p>
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
  <section className="mt-5 min-w-0">
   <h3 className="text-sm font-black uppercase tracking-[0.14em] text-stone-400">
    {title}
   </h3>
   <div className="mt-2 min-w-0">{children}</div>
  </section>
 );
}

function RadicalToken({ symbol, label }: { symbol: string; label: string }) {
 return (
  <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-stone-50 p-2">
   <span className="flex w-fit flex-nowrap items-center justify-center rounded-xl bg-white p-2 text-2xl font-black text-stone-950 shadow-theme-sm">
    {symbol}
   </span>
   <span className="min-w-0 break-words text-sm font-bold leading-6 text-stone-700">
    {label}
   </span>
  </div>
 );
}
