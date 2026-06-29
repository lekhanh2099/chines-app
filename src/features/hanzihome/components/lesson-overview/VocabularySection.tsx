"use client";

import { useMemo, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import type { VocabularyItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { saveEditableNodeDirectly } from "@/features/hanzihome/editing/direct-save";
import { invalidateHanziHomeContent } from "@/features/hanzihome/editing/invalidate-content";
import { isHanziHomeMutationConflict } from "@/features/hanzihome/editing/mutation-error";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";

import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";

type VocabBulkRow = {
 id: string;
 hanzi: string;
 pinyin: string;
 meaningVi: string;
 pos: string;
 category: string;
};

function vocabMeaning(item: VocabularyItem) {
 const record = asRecord(item);

 return (
  item.meaning_vi ||
  stringValue(record, "meaning") ||
  stringValue(record, "vi") ||
  stringValue(record, "gloss_vi") ||
  stringValue(record, "definition_vi") ||
  stringValue(record, "translation_vi")
 );
}

function vocabPos(item: VocabularyItem) {
 if (typeof item.pos === "string") return item.pos === "unknown" ? "" : item.pos;

 const record = asRecord(item.pos);
 return stringValue(record, "raw_vi") || stringValue(record, "normalized");
}

function itemToBulkRow(item: VocabularyItem): VocabBulkRow {
 const record = asRecord(item);

 return {
  id: item.id,
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaningVi: vocabMeaning(item),
  pos: vocabPos(item),
  category: stringValue(record, "category") || "Từ vựng",
 };
}

function rowChanged(left: VocabBulkRow, right: VocabBulkRow) {
 return JSON.stringify(left) !== JSON.stringify(right);
}

function itemWithBulkRow(item: VocabularyItem, row: VocabBulkRow): VocabularyItem {
 const next = structuredClone(item) as VocabularyItem;
 next.hanzi = row.hanzi.trim();
 next.pinyin = row.pinyin.trim();
 next.meaning_vi = row.meaningVi.trim();
 next.category = row.category.trim() || "Từ vựng";

 next.pos = row.pos.trim() || "unknown";

 return next;
}

export function VocabMiniGrid({
 lessonId,
 parentSectionId,
 itemsPath,
 items,
 displayMode,
}: {
 lessonId?: string;
 parentSectionId?: string;
 itemsPath?: EditableNodePath;
 items: VocabularyItem[];
 displayMode: LessonDisplayMode;
}) {
 const editMode = useHanziHomeEditMode();
 const canBulkEdit = Boolean(editMode && lessonId && itemsPath && items.length > 0);

 return (
  <div className="grid gap-2">
   {canBulkEdit ? (
    <div className="flex items-center justify-end">
     <VocabBulkEditDialog
      lessonId={lessonId as string}
      parentSectionId={parentSectionId}
      itemsPath={itemsPath as EditableNodePath}
      items={items}
     />
    </div>
   ) : null}
   <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => {
     const meaning = vocabMeaning(item);
     return (
      <div key={item.id} className="rounded-xl border border-border-default bg-bg-primary p-3">
       <div className="flex flex-wrap items-end gap-2">
        <p className="text-2xl font-black text-text-primary" lang="zh-CN">
         {item.hanzi}
        </p>
        {displayMode.showPinyin && item.pinyin && (
         <p className="font-bold text-accent-text">{item.pinyin}</p>
        )}
       </div>
       {meaning && <p className=" font-semibold leading-relaxed text-text-secondary">{meaning}</p>}
       {item.pos !== "unknown" && <Badge>{item.pos}</Badge>}
      </div>
     );
    })}
   </div>
  </div>
 );
}

function VocabBulkEditDialog({
 lessonId,
 parentSectionId,
 itemsPath,
 items,
}: {
 lessonId: string;
 parentSectionId?: string;
 itemsPath: EditableNodePath;
 items: VocabularyItem[];
}) {
 const queryClient = useQueryClient();
 const { services } = useHanziHomeFeatureContext();
 const initialRows = useMemo(() => items.map(itemToBulkRow), [items]);
 const [open, setOpen] = useState(false);
 const [rows, setRows] = useState(initialRows);
 const [isSaving, setIsSaving] = useState(false);
 const changedRows = rows.filter((row, index) => rowChanged(row, initialRows[index]));

 const resetRows = () => setRows(initialRows);
 const updateRow = (index: number, key: keyof VocabBulkRow, value: string) => {
  setRows((current) =>
   current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
  );
 };

 const saveRows = async () => {
  if (changedRows.length === 0) {
   toast.message("Không có thay đổi để lưu.");
   return;
  }

  setIsSaving(true);
  try {
   for (const row of changedRows) {
    const index = rows.findIndex((item) => item.id === row.id);
    const item = items[index];
    if (!item) continue;

    const node: EditableNodeRequest = {
     lessonId,
     entityType: "vocab_item",
     entityId: item.id,
     parentEntityType: "section",
     parentEntityId: parentSectionId,
     path: [...itemsPath, index],
     value: item,
     label: item.hanzi,
    };
    const record = services.resolveEditableRecord(node);
    if (!record) throw new Error(`Từ "${item.hanzi}" chưa có DB write target.`);

    await saveEditableNodeDirectly({
     node,
     record,
     after: itemWithBulkRow(item, row),
     reason: `Cập nhật từ vựng: ${item.hanzi}`,
    });
   }

   await invalidateHanziHomeContent({ queryClient, lessonId, entityType: "vocab_item" });
   toast.success(`Đã lưu ${changedRows.length} từ.`);
   setOpen(false);
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({ queryKey: ["hanzihome", "lesson-detail", lessonId] });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    setOpen(false);
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể lưu từ vựng.");
  } finally {
   setIsSaving(false);
  }
 };

 return (
  <Dialog
   open={open}
   onOpenChange={(nextOpen) => {
    setOpen(nextOpen);
    if (nextOpen) setRows(initialRows);
   }}
  >
   <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
    <Pencil className="h-4 w-4" />
    Sửa tất cả
   </Button>
   <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
    <DialogHeader>
     <DialogTitle>Sửa từ vựng</DialogTitle>
     <DialogDescription>
      Cập nhật nhiều từ trong một lần. Khi lưu, chỉ những dòng đã đổi mới được gửi lên.
     </DialogDescription>
    </DialogHeader>
    <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
     <div className="grid min-w-[52rem] gap-2">
      <div className="grid grid-cols-[minmax(7rem,0.9fr)_minmax(8rem,1fr)_minmax(14rem,1.8fr)_minmax(7rem,0.8fr)_minmax(8rem,1fr)] gap-2 px-1 text-xs font-black uppercase tracking-wide text-text-muted">
       <span>Tiếng Trung</span>
       <span>Pinyin</span>
       <span>Nghĩa</span>
       <span>Từ loại</span>
       <span>Nhóm</span>
      </div>
      {rows.map((row, index) => (
       <div
        key={row.id}
        className="grid grid-cols-[minmax(7rem,0.9fr)_minmax(8rem,1fr)_minmax(14rem,1.8fr)_minmax(7rem,0.8fr)_minmax(8rem,1fr)] gap-2 rounded-lg border border-border-default bg-bg-primary p-2"
       >
        <Input
         aria-label={`Tiếng Trung ${index + 1}`}
         value={row.hanzi}
         onChange={(event) => updateRow(index, "hanzi", event.target.value)}
        />
        <Input
         aria-label={`Pinyin ${index + 1}`}
         value={row.pinyin}
         onChange={(event) => updateRow(index, "pinyin", event.target.value)}
        />
        <Input
         aria-label={`Nghĩa ${index + 1}`}
         value={row.meaningVi}
         onChange={(event) => updateRow(index, "meaningVi", event.target.value)}
        />
        <Input
         aria-label={`Từ loại ${index + 1}`}
         value={row.pos}
         onChange={(event) => updateRow(index, "pos", event.target.value)}
        />
        <Input
         aria-label={`Nhóm ${index + 1}`}
         value={row.category}
         onChange={(event) => updateRow(index, "category", event.target.value)}
        />
       </div>
      ))}
     </div>
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setOpen(false)}>
      Hủy
     </Button>
     <Button type="button" variant="outline" disabled={isSaving} onClick={resetRows}>
      <RotateCcw className="h-4 w-4" />
      Reset
     </Button>
     <Button type="button" disabled={isSaving || changedRows.length === 0} onClick={saveRows}>
      {isSaving ? "Đang lưu..." : `Lưu${changedRows.length ? ` ${changedRows.length} dòng` : ""}`}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
