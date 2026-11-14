"use client";

import { useMemo, useState } from "react";
import { BookOpen, Layers3, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Tabs } from "@/components/ui/navigation/tabs";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { saveEditableNodeDirectly } from "@/features/hanzihome/editing/direct-save";
import { invalidateHanziHomeContent } from "@/features/hanzihome/editing/invalidate-content";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import { useVocabBulkChildManager } from "@/features/hanzihome/hooks/useVocabBulkChildManager";
import { VocabChildManagerPanel } from "@/features/hanzihome/components/vocab/VocabChildManagerPanel";
import { VocabChildPreviewDialog } from "@/features/hanzihome/components/vocab/VocabChildPreviewDialog";
import { VocabCoreTable } from "@/features/hanzihome/components/vocab/VocabCoreTable";
import {
 applyCore,
 collectVocabChildren,
 coreRow,
 type EditableItem,
 type ManagerTab,
 ManagerTabSchema,
} from "@/features/hanzihome/components/vocab/vocab-bulk-edit-utils";

export { applyCore, coreRow } from "@/features/hanzihome/components/vocab/vocab-bulk-edit-utils";

type Props<TItem extends EditableItem> = {
 lessonId: string;
 courseId?: string;
 bookId?: string;
 items: TItem[];
 getEntityId: (item: TItem) => string;
 getItemPath: (item: TItem, index: number) => EditableNodePath;
 parentSectionId?: string;
 label?: string;
};

export function VocabBulkEditDialog<TItem extends EditableItem>({
 lessonId,
 courseId = "",
 bookId = "",
 items,
 getEntityId,
 getItemPath,
 parentSectionId,
 label = "Quản lý từ vựng",
}: Props<TItem>) {
 const queryClient = useQueryClient();
 const { services } = useHanziHomeFeatureContext();
 const initialRows = useMemo(
  () => items.map((item) => coreRow(item, getEntityId)),
  [getEntityId, items],
 );
 const [open, setOpen] = useState(false);
 const [tab, setTab] = useState<ManagerTab>(ManagerTabSchema.enum.vocab);
 const [rows, setRows] = useState(initialRows);
 const [busy, setBusy] = useState(false);
 const manager = useVocabBulkChildManager({ open, tab, lessonId, bookId, courseId, setBusy });
 const { deepItems, localChildren } = collectVocabChildren(items);
 const [createWordId, setCreateWordId] = useState(() => deepItems[0]?.runtimeId ?? "");

 const saveCore = async () => {
  const originals = new Map(initialRows.map((row) => [row.id, row]));
  const changed = rows.filter(
   (row) => JSON.stringify(row) !== JSON.stringify(originals.get(row.id)),
  );
  if (!changed.length) return toast.message("Không có thay đổi để lưu.");
  setBusy(true);
  try {
   for (const row of changed) {
    const index = items.findIndex((item) => getEntityId(item) === row.id);
    const item = items[index];
    if (!item) continue;
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
    if (!record) throw new Error(`Từ “${item.hanzi}” chưa có DB write target.`);
    await saveEditableNodeDirectly({
     node,
     record,
     after: applyCore(item, row),
     reason: `Cập nhật từ vựng: ${item.hanzi}`,
    });
   }
   await invalidateHanziHomeContent({ queryClient, lessonId, entityType: "vocab_item" });
   toast.success(`Đã lưu ${changed.length} từ.`);
   setOpen(false);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể lưu từ vựng.");
  } finally {
   setBusy(false);
  }
 };

 return (
  <Dialog
   open={open}
   onOpenChange={(next) => {
    setOpen(next);
    if (next) {
     setRows(initialRows);
     manager.setPreview(null);
    }
   }}
  >
   <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
    <Pencil />
    {label}
   </Button>
   <DialogContent className="max-h-[92dvh] max-w-6xl overflow-hidden">
    <DialogHeader>
     <DialogTitle>Quản lý từ vựng</DialogTitle>
     <DialogDescription>
      Sửa trường lõi và quản lý riêng section, ví dụ. Không còn editor JSON gây hiểu nhầm phạm vi
      lưu.
     </DialogDescription>
    </DialogHeader>
    <DialogBody className="grid max-h-[calc(92dvh-11rem)] gap-4 overflow-y-auto">
     <Tabs
      value={tab}
      onValueChange={(value) => {
       setTab(value);
       manager.setSelectedIds([]);
       manager.setPreview(null);
      }}
      items={[
       { key: "vocab", label: "Từ vựng", icon: BookOpen },
       { key: "sections", label: "Sections", icon: Layers3 },
       { key: "examples", label: "Ví dụ", icon: BookOpen },
      ]}
     />
     {tab === "vocab" ? (
      <VocabCoreTable
       rows={rows}
       onChange={(index, key, value) =>
        setRows((current) =>
         current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
        )
       }
      />
     ) : (
      <VocabChildManagerPanel
       manager={manager}
       busy={busy}
       tab={tab}
       lessonId={lessonId}
       deepItems={deepItems}
       localChildren={localChildren}
       createWordId={createWordId}
       onCreateWordIdChange={setCreateWordId}
       getEntityId={getEntityId}
       getItemPath={getItemPath}
      />
     )}
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
      Đóng
     </Button>
     {tab === "vocab" ? (
      <Button type="button" disabled={busy} onClick={saveCore}>
       {busy ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
     ) : null}
    </DialogFooter>
   </DialogContent>
   <VocabChildPreviewDialog manager={manager} busy={busy} />
  </Dialog>
 );
}
