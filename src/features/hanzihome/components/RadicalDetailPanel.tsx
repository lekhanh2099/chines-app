import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadicalSection } from "@/features/hanzihome/components/RadicalSection";
import { getHanziFontFamily } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";
import type { StaticRadicalData } from "@/features/hanzihome/types";

type RadicalDetailPanelProps = {
 radical: StaticRadicalData;
 editMode: boolean;
 onEdit: () => void;
};

export function RadicalDetailPanel({ radical, editMode, onEdit }: RadicalDetailPanelProps) {
 const relatedComponents = radical.relatedComponents ?? [];
 const groups = radical.groups ?? [];

 return (
  <div className="grid gap-3 lg:grid-cols-2">
   {editMode ? (
    <div className="flex justify-end lg:col-span-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!radical.editMeta}
      onClick={onEdit}
     >
      <Pencil />
      Sửa bộ thủ này
     </Button>
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
    <div className="app-brand-gradient flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-5xl font-black leading-none text-primary-foreground shadow-theme-sm sm:size-24 sm:text-6xl">
     <span lang="zh-CN" style={{ fontFamily: getHanziFontFamily("songti") }}>
      {radical.radical}
     </span>
    </div>
    <NativeMandarinSpeakButton text={radical.radical} />
    <div className="min-w-0">
     <div className="mb-2 flex flex-wrap items-center gap-2">
      <Badge>#{radical.index}</Badge>
      <Badge variant="info">{radical.strokes ?? "?"} nét</Badge>
     </div>
     <h2 className="text-2xl font-black text-text-primary">{radical.nameVi || "Chưa có tên"}</h2>
    </div>
   </div>

   <RadicalSection title="Ý nghĩa cốt lõi">
    <p>{radical.coreMeaning.modern || "Chưa có mô tả hiện đại."}</p>
    {radical.coreMeaning.history ? (
     <p className="text-text-muted">{radical.coreMeaning.history}</p>
    ) : null}
   </RadicalSection>

   {radical.variants.length > 0 ? (
    <RadicalSection title="Biến thể">
     <div className="flex flex-wrap gap-2">
      {radical.variants.map((variant) => (
       <Badge key={`${variant.form}-${variant.note}`} variant="purple" size="lg">
        {variant.form} · {variant.note}
       </Badge>
      ))}
     </div>
    </RadicalSection>
   ) : null}

   {relatedComponents.length > 0 ? (
    <RadicalSection title="Thành phần liên quan" className="lg:col-span-2">
     <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {relatedComponents.map((component) => (
       <div
        key={`${component.form}-${component.note}`}
        className="grid gap-1 rounded-lg border border-border-subtle bg-bg-elevated p-3"
       >
        <p
         className="text-2xl font-black text-text-primary"
         lang="zh-CN"
         style={{ fontFamily: getHanziFontFamily("songti") }}
        >
         {component.form}
        </p>
        <p className="text-sm text-text-secondary">{component.note}</p>
       </div>
      ))}
     </div>
    </RadicalSection>
   ) : null}

   <RadicalSection title="Nhận diện">
    <p>{radical.recognition || "Chưa có ghi chú nhận diện."}</p>
   </RadicalSection>

   {radical.distinguish.length > 0 ? (
    <RadicalSection title="Phân biệt">
     <ul className="grid gap-2">
      {radical.distinguish.map((item) => (
       <li key={item}>{item}</li>
      ))}
     </ul>
    </RadicalSection>
   ) : null}

   {groups.length > 0 ? (
    <RadicalSection title="Nhóm chữ thường gặp" className="lg:col-span-2">
     <div className="grid gap-3">
      {groups.map((group) => (
       <div key={group.name} className="grid gap-2">
        <p className="font-black text-text-primary">{group.name}</p>
        <div className="flex flex-wrap gap-2">
         {group.chars.map((char) => (
          <Badge key={`${group.name}-${char}`} variant="info" size="lg">
           <span lang="zh-CN" style={{ fontFamily: getHanziFontFamily("songti") }}>
            {char}
           </span>
          </Badge>
         ))}
        </div>
       </div>
      ))}
     </div>
    </RadicalSection>
   ) : null}
  </div>
 );
}
