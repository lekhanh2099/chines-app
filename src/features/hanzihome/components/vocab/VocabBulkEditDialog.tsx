"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import { FileJson, ListChecks, Pencil, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Tabs } from "@/components/ui/tabs";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { saveEditableNodeDirectly } from "@/features/hanzihome/editing/direct-save";
import { invalidateHanziHomeContent } from "@/features/hanzihome/editing/invalidate-content";
import { isHanziHomeMutationConflict } from "@/features/hanzihome/editing/mutation-error";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { VocabularyItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { asRecord, stringValue } from "../lesson-overview/utils";

type VocabBulkEditableItem = VocabularyItem | HanziHomeVocabItem;

type VocabBulkRow = {
 id: string;
 hanzi: string;
 pinyin: string;
 meaningVi: string;
 pos: string;
 category: string;
};

type BulkEditMode = "table" | "json";

type VocabBulkEditDialogProps<TItem extends VocabBulkEditableItem> = {
 lessonId: string;
 items: TItem[];
 getEntityId: (item: TItem) => string;
 getItemPath: (item: TItem, index: number) => EditableNodePath;
 parentSectionId?: string;
 label?: string;
};

function vocabMeaning(item: VocabBulkEditableItem) {
 const record = asRecord(item);
 const meaning = asRecord(record.meaning);

 return (
  stringValue(record, "meaning_vi") ||
  stringValue(meaning, "short_definition_vi") ||
  stringValue(meaning, "meaning_vi") ||
  stringValue(record, "meaning") ||
  stringValue(record, "vi") ||
  stringValue(record, "gloss_vi") ||
  stringValue(record, "definition_vi") ||
  stringValue(record, "translation_vi")
 );
}

function vocabPos(item: VocabBulkEditableItem) {
 const record = asRecord(item);
 const pos = record.pos;

 if (typeof pos === "string") return pos === "unknown" ? "" : pos;

 const posRecord = asRecord(pos);
 return stringValue(posRecord, "raw_vi") || stringValue(posRecord, "normalized");
}

function itemToBulkRow<TItem extends VocabBulkEditableItem>(
 item: TItem,
 getEntityId: (item: TItem) => string,
): VocabBulkRow {
 const record = asRecord(item);

 return {
  id: getEntityId(item),
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaningVi: vocabMeaning(item),
  pos: vocabPos(item),
  category: stringValue(record, "category") || "Từ vựng",
 };
}

function rowChanged(left: VocabBulkRow, right: VocabBulkRow | undefined) {
 return JSON.stringify(left) !== JSON.stringify(right);
}

function isVocabBulkJsonItem(value: unknown): value is VocabBulkEditableItem {
 const record = asRecord(value);
 return (
  (typeof record.id === "string" || typeof record.runtimeId === "string") &&
  typeof record.hanzi === "string" &&
  typeof record.pinyin === "string"
 );
}

function entityIdFromJsonItem(value: VocabBulkEditableItem) {
 const record = asRecord(value);
 return stringValue(record, "runtimeId") || stringValue(record, "id");
}

function parseJsonItems(value: string) {
 const parsed: unknown = JSON.parse(value);
 if (!Array.isArray(parsed) || !parsed.every(isVocabBulkJsonItem)) {
  throw new Error(
   "JSON phải là array vocab item đầy đủ và mỗi item cần có id/runtimeId, hanzi, pinyin.",
  );
 }
 return parsed;
}

function itemWithBulkRow<TItem extends VocabBulkEditableItem>(
 item: TItem,
 row: VocabBulkRow,
): TItem {
 const next = structuredClone(item) as TItem;
 const record = next as unknown as Record<string, unknown>;
 const meaning = asRecord(record.meaning);

 record.hanzi = row.hanzi.trim();
 record.pinyin = row.pinyin.trim();
 record.meaning_vi = row.meaningVi.trim();
 record.category = row.category.trim() || "Từ vựng";

 if ("meaning" in record && meaning) {
  record.meaning = {
   ...meaning,
   meaning_vi: row.meaningVi.trim(),
   short_definition_vi: row.meaningVi.trim(),
  };
 }

 if (typeof record.pos === "string" || !record.pos || Array.isArray(record.pos)) {
  record.pos = row.pos.trim() || "unknown";
 } else {
  const pos = asRecord(record.pos);
  record.pos = {
   ...pos,
   raw_vi: row.pos.trim(),
   normalized: row.pos.trim() || "unknown",
  };
 }

 return next;
}

function applyRowsToItems<TItem extends VocabBulkEditableItem>(
 items: TItem[],
 rows: VocabBulkRow[],
 getEntityId: (item: TItem) => string,
) {
 const rowsById = new Map(rows.map((row) => [row.id, row]));
 return items.map((item) => {
  const row = rowsById.get(getEntityId(item));
  return row ? itemWithBulkRow(item, row) : item;
 });
}

export function VocabBulkEditDialog<TItem extends VocabBulkEditableItem>({
 lessonId,
 items,
 getEntityId,
 getItemPath,
 parentSectionId,
 label = "Sửa tất cả",
}: VocabBulkEditDialogProps<TItem>) {
 const queryClient = useQueryClient();
 const { services } = useHanziHomeFeatureContext();
 const initialRows = useMemo(
  () => items.map((item) => itemToBulkRow(item, getEntityId)),
  [getEntityId, items],
 );
 const initialRowsById = useMemo(
  () => new Map(initialRows.map((row) => [row.id, row])),
  [initialRows],
 );
 const itemsById = useMemo(
  () => new Map(items.map((item, index) => [getEntityId(item), { item, index }])),
  [getEntityId, items],
 );
 const [open, setOpen] = useState(false);
 const [mode, setMode] = useState<BulkEditMode>("table");
 const [rows, setRows] = useState(initialRows);
 const [jsonValue, setJsonValue] = useState(() => JSON.stringify(items, null, 2));
 const [jsonError, setJsonError] = useState<string | null>(null);
 const [isSaving, setIsSaving] = useState(false);
 const changedRows = rows.filter((row) => rowChanged(row, initialRowsById.get(row.id)));

 const openDialog = () => {
  setRows(initialRows);
  setJsonValue(JSON.stringify(items, null, 2));
  setJsonError(null);
  setMode("table");
  setOpen(true);
 };
 const closeDialog = () => setOpen(false);
 const resetRows = () => {
  setRows(initialRows);
  setJsonValue(JSON.stringify(items, null, 2));
  setJsonError(null);
 };
 const changeMode = (nextMode: BulkEditMode) => {
  if (nextMode === "json") {
   setJsonValue(JSON.stringify(applyRowsToItems(items, rows, getEntityId), null, 2));
   setJsonError(null);
  }
  setMode(nextMode);
 };
 const updateRow = (index: number, key: keyof VocabBulkRow, value: string) => {
  setRows((current) =>
   current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
  );
 };
 const saveRows = async () => {
  const rowsToSave = rows.filter((row) => rowChanged(row, initialRowsById.get(row.id)));
  if (rowsToSave.length === 0) {
   toast.message("Không có thay đổi để lưu.");
   return;
  }

  setIsSaving(true);
  try {
   for (const row of rowsToSave) {
    const itemEntry = itemsById.get(row.id);
    if (!itemEntry) throw new Error(`Không tìm thấy từ có id "${row.id}".`);

    const { item, index } = itemEntry;
    const node: EditableNodeRequest = {
     lessonId,
     entityType: "vocab_item",
     entityId: row.id,
     parentEntityType: parentSectionId ? "section" : undefined,
     parentEntityId: parentSectionId,
     path: getItemPath(item, index),
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
   toast.success(`Đã lưu ${rowsToSave.length} từ.`);
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

 const saveJsonItems = async () => {
  let parsedItems: VocabBulkEditableItem[];
  try {
   parsedItems = parseJsonItems(jsonValue);
   const unknownItem = parsedItems.find((item) => !itemsById.has(entityIdFromJsonItem(item)));
   if (unknownItem) {
    throw new Error(`Không tìm thấy từ có id "${entityIdFromJsonItem(unknownItem)}".`);
   }
   setJsonError(null);
  } catch (error) {
   setJsonError(error instanceof Error ? error.message : "JSON chưa hợp lệ.");
   return;
  }

  const itemsToSave = parsedItems.filter((item) => {
   const original = itemsById.get(entityIdFromJsonItem(item))?.item;
   return original && JSON.stringify(item) !== JSON.stringify(original);
  });
  if (itemsToSave.length === 0) {
   toast.message("Không có thay đổi để lưu.");
   return;
  }

  setIsSaving(true);
  try {
   for (const itemAfter of itemsToSave) {
    const entityId = entityIdFromJsonItem(itemAfter);
    const itemEntry = itemsById.get(entityId);
    if (!itemEntry) throw new Error(`Không tìm thấy từ có id "${entityId}".`);

    const { item, index } = itemEntry;
    const node: EditableNodeRequest = {
     lessonId,
     entityType: "vocab_item",
     entityId,
     parentEntityType: parentSectionId ? "section" : undefined,
     parentEntityId: parentSectionId,
     path: getItemPath(item, index),
     value: item,
     label: item.hanzi,
    };
    const record = services.resolveEditableRecord(node);
    if (!record) throw new Error(`Từ "${item.hanzi}" chưa có DB write target.`);

    await saveEditableNodeDirectly({
     node,
     record,
     after: itemAfter,
     reason: `Cập nhật từ vựng: ${item.hanzi}`,
    });
   }

   await invalidateHanziHomeContent({ queryClient, lessonId, entityType: "vocab_item" });
   toast.success(`Đã lưu ${itemsToSave.length} từ.`);
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
  <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? openDialog() : closeDialog())}>
   <Button type="button" variant="outline" size="sm" onClick={openDialog}>
    <Pencil className="h-4 w-4" />
    {label}
   </Button>
   <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
    <DialogHeader>
     <DialogTitle>Sửa từ vựng</DialogTitle>
     <DialogDescription>
      Cập nhật nhiều từ trong một lần. Khi lưu, chỉ những dòng đã đổi mới được gửi lên.
     </DialogDescription>
    </DialogHeader>
    <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
     <Tabs
      value={mode}
      onValueChange={changeMode}
      items={[
       { key: "table", label: "Bảng", icon: ListChecks },
       { key: "json", label: "JSON", icon: FileJson },
      ]}
     />
     {mode === "table" ? (
      <VocabBulkTable rows={rows} onUpdateRow={updateRow} />
     ) : (
      <div className="grid gap-2">
       <label id="hanzihome-vocab-bulk-json-label" className="text-sm font-bold text-text-primary">
        JSON
       </label>
       <div className="h-[clamp(26rem,58dvh,42rem)] overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner focus-within:ring-2 focus-within:ring-ring [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full">
        <CodeMirror
         aria-labelledby="hanzihome-vocab-bulk-json-label"
         value={jsonValue}
         height="100%"
         basicSetup={{
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
         }}
         theme="light"
         onChange={(nextValue) => {
          setJsonValue(nextValue);
          if (jsonError) setJsonError(null);
         }}
        />
       </div>
       {jsonError ? <p className="text-sm font-medium text-destructive">{jsonError}</p> : null}
      </div>
     )}
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="ghost" disabled={isSaving} onClick={closeDialog}>
      Hủy
     </Button>
     <Button type="button" variant="outline" disabled={isSaving} onClick={resetRows}>
      <RotateCcw className="h-4 w-4" />
      Reset
     </Button>
     <Button
      type="button"
      disabled={isSaving || (mode === "table" && changedRows.length === 0)}
      onClick={mode === "json" ? saveJsonItems : saveRows}
     >
      {isSaving ? "Đang lưu..." : `Lưu${changedRows.length ? ` ${changedRows.length} dòng` : ""}`}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

function VocabBulkTable({
 rows,
 onUpdateRow,
}: {
 rows: VocabBulkRow[];
 onUpdateRow: (index: number, key: keyof VocabBulkRow, value: string) => void;
}) {
 return (
  <div className="overflow-x-auto">
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
      className="study-content-surface grid grid-cols-[minmax(7rem,0.9fr)_minmax(8rem,1fr)_minmax(14rem,1.8fr)_minmax(7rem,0.8fr)_minmax(8rem,1fr)] gap-2 rounded-lg border p-2"
     >
      <Input
       aria-label={`Tiếng Trung ${index + 1}`}
       value={row.hanzi}
       onChange={(event) => onUpdateRow(index, "hanzi", event.target.value)}
      />
      <Input
       aria-label={`Pinyin ${index + 1}`}
       value={row.pinyin}
       onChange={(event) => onUpdateRow(index, "pinyin", event.target.value)}
      />
      <Input
       aria-label={`Nghĩa ${index + 1}`}
       value={row.meaningVi}
       onChange={(event) => onUpdateRow(index, "meaningVi", event.target.value)}
      />
      <Input
       aria-label={`Từ loại ${index + 1}`}
       value={row.pos}
       onChange={(event) => onUpdateRow(index, "pos", event.target.value)}
      />
      <Input
       aria-label={`Nhóm ${index + 1}`}
       value={row.category}
       onChange={(event) => onUpdateRow(index, "category", event.target.value)}
      />
     </div>
    ))}
   </div>
  </div>
 );
}
