import { Typography } from "@/components/ui/typography";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadicalSection } from "@/features/hanzihome/components/RadicalSection";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
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
      size="toolbar"
      disabled={!radical.editMeta}
      onClick={onEdit}
     >
      <Pencil />
      Sửa bộ thủ này
     </Button>
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
    <div className="app-brand-gradient flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-theme-sm sm:size-24">
     <HanziText size="radicalHero" tone="inverse" weight="black" leading="none">
      {radical.radical}
     </HanziText>
    </div>
    <MandarinSpeakButton text={radical.radical} />
    <div className="grid min-w-0 gap-2">
     <div className="flex flex-wrap items-center gap-2">
      <Badge>#{radical.index}</Badge>
      <Badge variant="info">{radical.strokes ?? "?"} nét</Badge>
     </div>
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
      {radical.nameVi || "Chưa có tên"}
     </Typography>
    </div>
   </div>

   <RadicalSection title="Ý nghĩa cốt lõi">
    <StudyInstructionText>
     {radical.coreMeaning.modern || "Chưa có mô tả hiện đại."}
    </StudyInstructionText>
    {radical.coreMeaning.history ? (
     <StudyInstructionText tone="muted">{radical.coreMeaning.history}</StudyInstructionText>
    ) : null}
   </RadicalSection>

   {radical.variants.length > 0 ? (
    <RadicalSection title="Biến thể">
     <div className="flex flex-wrap gap-2">
      {radical.variants.map((variant) => (
       <Badge key={`${variant.form}-${variant.note}`} variant="purple" size="lg">
        <HanziText as="span" size="inherit">
         {variant.form}
        </HanziText>
        <span>· {variant.note}</span>
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
        <HanziText as="p" size="large" variant="pageTitle" tone="default" weight="black">
         {component.form}
        </HanziText>
        <StudyInstructionText variant="bodySmall" tone="secondary">
         {component.note}
        </StudyInstructionText>
       </div>
      ))}
     </div>
    </RadicalSection>
   ) : null}

   <RadicalSection title="Nhận diện">
    <StudyInstructionText>
     {radical.recognition || "Chưa có ghi chú nhận diện."}
    </StudyInstructionText>
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
        <StudyInstructionText tone="default" weight="black">
         {group.name}
        </StudyInstructionText>
        <div className="flex flex-wrap gap-2">
         {group.chars.map((char) => (
          <Badge key={`${group.name}-${char}`} variant="info" size="lg">
           <HanziText as="span" size="inherit">
            {char}
           </HanziText>
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
