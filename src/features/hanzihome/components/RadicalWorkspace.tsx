"use client";

import { useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { useHanziHomeSearchNavigationIntent } from "@/features/hanzihome/search/searchNavigationStore";
import { RadicalEditDialog } from "./RadicalEditDialog";
import { RadicalSection } from "./RadicalSection";

type RadicalWorkspaceProps = {
 radicals: StaticRadicalData[];
};

export function RadicalWorkspace({ radicals }: RadicalWorkspaceProps) {
 const searchIntent = useHanziHomeSearchNavigationIntent();
 const canEdit = useHanziHomeCanEdit();
 const [selectedId, setSelectedId] = useState<string | null>(
  () =>
   (searchIntent?.module === "radicals" ? searchIntent.targetId : null) ?? radicals[0]?.id ?? null,
 );
 const [searchValue, setSearchValue] = useState("");
 const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 const [editMode, setEditMode] = useState(false);
 const [editingRadical, setEditingRadical] = useState<StaticRadicalData | null>(null);
 const visibleRadicals = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();
  return radicals.filter((radical) => {
   const haystack = [
    radical.radical,
    radical.nameVi ?? "",
    radical.coreMeaning.history ?? "",
    radical.coreMeaning.modern ?? "",
    radical.recognition ?? "",
    radical.variants.map((variant) => `${variant.form} ${variant.note}`).join(" "),
    radical.relatedComponents
     ?.map((component) => `${component.form} ${component.note}`)
     .join(" ") ?? "",
    radical.groups?.map((group) => `${group.name} ${group.chars.join(" ")}`).join(" ") ?? "",
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
 const selectedRelatedComponents = selectedRadical?.relatedComponents ?? [];
 const selectedGroups = selectedRadical?.groups ?? [];

 if (!selectedRadical) {
  return (
   <Card padding="lg" className="rounded-xl">
    <p className=" font-semibold text-text-muted">Chưa có dữ liệu bộ thủ.</p>
   </Card>
  );
 }

 const sidebar = (
  <div className="grid min-w-0 gap-3 overflow-x-hidden">
   <div>
    <h2 className="text-lg font-black text-text-primary">Toàn bộ bộ thủ</h2>
    <p className=" font-semibold text-text-muted">{radicals.length} bộ thủ độc lập với bài học.</p>
   </div>
   <Input
    value={searchValue}
    onChange={(event) => setSearchValue(event.target.value)}
    placeholder="Tìm bộ thủ, tên, nghĩa..."
    aria-label="Tìm bộ thủ"
   />

   <div className="grid min-w-0 gap-2 overflow-x-hidden">
    {visibleRadicals.map((radical) => (
     <Button
      key={radical.id}
      variant={radical.id === selectedRadical.id ? "default" : "outline"}
      className="h-auto min-h-14 w-full min-w-0 max-w-full shrink justify-start overflow-hidden whitespace-normal rounded-lg py-2.5 text-left"
      onClick={() => setSelectedId(radical.id)}
     >
      <span className="shrink-0 text-xl font-black" lang="zh-CN">
       {radical.radical}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 overflow-hidden whitespace-normal wrap-break-word">
       {radical.nameVi || "Chưa có tên"}
      </span>
      <span className="shrink-0 text-xs uppercase opacity-75">{radical.strokes ?? "?"} nét</span>
     </Button>
    ))}
   </div>
   {visibleRadicals.length === 0 && (
    <p className="rounded-xl bg-bg-subtle p-4  font-semibold text-text-muted">
     Không có bộ thủ phù hợp bộ lọc.
    </p>
   )}
  </div>
 );

 return (
  <LessonModuleFrame
   title="Bộ thủ"
   subtitle={`${selectedRadical.radical} · ${selectedRadical.nameVi || "Chưa có tên"}`}
   sidebarLabel="Danh sách bộ thủ"
   sidebarSummary={`${radicals.length} bộ`}
   sidebarOpen={isSidebarOpen}
   onSidebarOpenChange={setIsSidebarOpen}
   sidebar={sidebar}
   sidebarSelectionKey={selectedRadical.id}
   actions={
    canEdit ? (
     <Button
      type="button"
      variant={editMode ? "default" : "outline"}
      size="sm"
      className="h-8 shrink-0 px-2.5 text-xs"
      onClick={() => setEditMode((current) => !current)}
     >
      {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
      {editMode ? "Tắt sửa" : "Sửa"}
     </Button>
    ) : null
   }
  >
   <Card padding="lg" className="mx-auto w-full max-w-5xl rounded-xl">
    <div className="grid gap-3">
     {editMode ? (
      <div className="flex justify-end">
       <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 bg-bg-card/95 px-2.5 text-xs shadow-theme-sm"
        disabled={!selectedRadical.editMeta}
        onClick={() => setEditingRadical(selectedRadical)}
       >
        <Pencil className="h-4 w-4" />
        Sửa bộ thủ này
       </Button>
      </div>
     ) : null}
     <div className="flex flex-wrap items-center gap-4">
      <h2 className="text-7xl font-black text-text-primary">{selectedRadical.radical}</h2>
      <div className="min-w-0">
       <div className="flex flex-wrap items-center gap-2">
        <Badge>#{selectedRadical.index}</Badge>
        <Badge variant="info">{selectedRadical.strokes ?? "?"} nét</Badge>
       </div>
       <h3 className="text-2xl font-black text-text-primary">
        {selectedRadical.nameVi || "Chưa có tên"}
       </h3>
      </div>
     </div>

     <RadicalSection title="Ý nghĩa cốt lõi">
      <p>{selectedRadical.coreMeaning.modern || "Chưa có mô tả hiện đại."}</p>
      {selectedRadical.coreMeaning.history && (
       <p className="text-text-muted">{selectedRadical.coreMeaning.history}</p>
      )}
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

     {selectedRelatedComponents.length > 0 && (
      <RadicalSection title="Thành phần liên quan">
       <div className="grid gap-2 sm:grid-cols-2">
        {selectedRelatedComponents.map((component) => (
         <div
          key={`${component.form}-${component.note}`}
          className="grid gap-1 rounded-lg border border-border-subtle bg-bg-elevated p-3"
         >
          <p className="text-2xl font-black text-text-primary" lang="zh-CN">
           {component.form}
          </p>
          <p className="text-sm text-text-secondary">{component.note}</p>
         </div>
        ))}
       </div>
      </RadicalSection>
     )}

     <RadicalSection title="Nhận diện">
      <p>{selectedRadical.recognition || "Chưa có ghi chú nhận diện."}</p>
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

     {selectedGroups.length > 0 && (
      <RadicalSection title="Nhóm chữ thường gặp">
       <div className="grid gap-3">
        {selectedGroups.map((group) => (
         <div key={group.name} className="grid gap-2">
          <p className="font-black text-text-primary">{group.name}</p>
          <div className="flex flex-wrap gap-2">
           {group.chars.map((char) => (
            <Badge key={`${group.name}-${char}`} variant="info" size="lg">
             <span lang="zh-CN">{char}</span>
            </Badge>
           ))}
          </div>
         </div>
        ))}
       </div>
      </RadicalSection>
     )}
    </div>
   </Card>
   <RadicalEditDialog
    radical={editingRadical}
    open={Boolean(editingRadical)}
    onOpenChange={(open) => {
     if (!open) setEditingRadical(null);
    }}
   />
  </LessonModuleFrame>
 );
}
