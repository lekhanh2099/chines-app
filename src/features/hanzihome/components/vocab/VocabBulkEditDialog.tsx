"use client";

import { Label } from "@/components/ui/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { JsonObjectSchema, type JsonFieldValue, type JsonObject } from "@/types/json";
import { useDeferredValue, useMemo, useState, type ComponentProps } from "react";
import { BookOpen, Layers3, Pencil, Trash2 } from "lucide-react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { saveEditableNodeDirectly } from "@/features/hanzihome/editing/direct-save";
import { invalidateHanziHomeContent } from "@/features/hanzihome/editing/invalidate-content";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { CreateNormalizedChildDialog } from "@/features/hanzihome/editing/components/CreateNormalizedChildDialog";
import type { VocabularyItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { asRecord, stringValue } from "../lesson-overview/utils";

type EditableItemMap = {
 lesson: VocabularyItem;
 deep: HanziHomeVocabItem;
};
type EditableItem = EditableItemMap[keyof EditableItemMap];
const ManagerTabSchema = z.enum(["vocab", "sections", "examples"]);
type ManagerTab = z.infer<typeof ManagerTabSchema>;
const ScopeSchema = z.enum(["lesson", "book", "course"]);
type Scope = z.infer<typeof ScopeSchema>;
const SelectionModeSchema = z.enum(["ids", "filter"]);
type SelectionMode = z.infer<typeof SelectionModeSchema>;
const BulkOperationSchema = z.enum(["soft_delete", "restore", "purge"]);
type BulkOperation = z.infer<typeof BulkOperationSchema>;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type CheckboxState = Parameters<NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>>[0];
type CoreRow = {
 id: string;
 hanzi: string;
 pinyin: string;
 meaningVi: string;
 pos: string;
 category: string;
};

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

function coreRow<TItem extends EditableItem>(item: TItem, getId: (item: TItem) => string): CoreRow {
 const record = asRecord(item);
 const meaning = asRecord(record.meaning);
 const pos = asRecord(record.pos);
 return {
  id: getId(item),
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaningVi: stringValue(meaning, "meaning_vi") || stringValue(record, "meaning_vi"),
  pos: stringValue(pos, "raw_vi") || stringValue(pos, "normalized"),
  category: stringValue(record, "category") || "Từ vựng",
 };
}

function applyCore<TItem extends EditableItem>(item: TItem, row: CoreRow): TItem {
 const next = structuredClone(item);
 const record = JsonObjectSchema.parse(next);
 const meaning = asRecord(record.meaning);
 const pos = asRecord(record.pos);
 record.hanzi = row.hanzi.trim();
 record.pinyin = row.pinyin.trim();
 record.category = row.category.trim() || "Từ vựng";
 record.meaning = {
  ...meaning,
  meaning_vi: row.meaningVi.trim(),
  short_definition_vi: row.meaningVi.trim(),
 };
 record.pos = { ...pos, raw_vi: row.pos.trim(), normalized: row.pos.trim() || "unknown" };
 return next;
}

const PreviewSchema = z.object({
 rowCount: z.number(),
 wordCount: z.number(),
 fingerprint: z.string(),
 breakdown: z.record(z.string(), z.number()),
 ownership: z.record(z.string(), z.number()),
 sample: z.array(z.object({ id: z.string(), label: z.string() })),
});
type Preview = z.infer<typeof PreviewSchema>;

const ChildListSchema = z.object({
 page: z.number(),
 pageSize: z.number(),
 total: z.number(),
 rows: z.array(
  z.object({
   id: z.string(),
   vocabItemId: z.string(),
   lessonId: z.string(),
   word: z.string(),
   label: z.string(),
   sectionKey: z.string().nullable(),
   ownerId: z.string().nullable(),
   source: z.string(),
   deletedAt: z.string().nullable(),
  }),
 ),
});

const BulkResponseSchema = z.object({
 list: ChildListSchema.optional(),
 preview: PreviewSchema.optional(),
 result: z.object({ changedCount: z.number() }).optional(),
});

const PAGE_SIZE = 25;
const SECTION_FILTERS = [
 ["all", "Tất cả loại"],
 ["meaning", "Nghĩa"],
 ["word_formation", "Logic / cấu tạo"],
 ["comparison", "So sánh"],
 ["collocations", "Kết hợp thường gặp"],
 ["warnings", "Lưu ý lỗi sai"],
 ["culture", "Văn hóa và ngữ cảnh"],
 ["notes", "Ghi chú"],
 ["custom", "Khác"],
];

async function bulkRequest(body: Partial<JsonObject>) {
 const response = await fetch("/api/hanzihome/content/vocab-children/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
 const payload: JsonFieldValue = await response.json().catch(() => null);
 if (!response.ok) throw new Error("Không thể thực hiện thao tác hàng loạt.");
 return BulkResponseSchema.parse(payload);
}

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
 const [scope, setScope] = useState<Scope>("lesson");
 const [query, setQuery] = useState("");
 const deferredQuery = useDeferredValue(query);
 const [sectionFilter, setSectionFilter] = useState("all");
 const [showDeleted, setShowDeleted] = useState(false);
 const [page, setPage] = useState(1);
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionModeSchema.enum.ids);
 const [preview, setPreview] = useState<Nullable<Preview>>(null);
 const [pendingOperation, setPendingOperation] = useState<BulkOperation>(
  BulkOperationSchema.enum.soft_delete,
 );
 const [purgeCount, setPurgeCount] = useState("");
 const [busy, setBusy] = useState(false);
 const deepItems = items.filter((item): item is TItem & HanziHomeVocabItem => "runtimeId" in item);
 const [createWordId, setCreateWordId] = useState(() => deepItems[0]?.runtimeId ?? "");
 const createWord = deepItems.find((item) => item.runtimeId === createWordId) ?? deepItems[0];
 const sections = deepItems.flatMap((item, itemIndex) =>
  (item.detailSections ?? []).map((section, sectionIndex) => ({
   item,
   itemIndex,
   section,
   sectionIndex,
  })),
 );
 const examples = deepItems.flatMap((item, itemIndex) =>
  item.examples.map((example, exampleIndex) => ({ item, itemIndex, example, exampleIndex })),
 );
 const scopeId = scope === "lesson" ? lessonId : scope === "book" ? bookId : courseId;
 const entityType = tab === "sections" ? "vocab_detail_section" : "vocab_example";
 const sectionKeys =
  tab !== "sections" || sectionFilter === "all"
   ? undefined
   : sectionFilter === "custom"
     ? ["custom:"]
     : [sectionFilter];
 const childListQuery = useQuery({
  queryKey: [
   ...hanzihomeQueryKeys.vocabChildManagerRoot,
   entityType,
   scope,
   scopeId,
   showDeleted,
   sectionFilter,
   deferredQuery,
   page,
  ],
  enabled: open && tab !== "vocab" && Boolean(scopeId),
  placeholderData: keepPreviousData,
  queryFn: async () => {
   const payload = await bulkRequest({
    action: "list",
    entityType,
    scopeType: scope,
    scopeId,
    deleted: showDeleted,
    sectionKeys,
    query: deferredQuery || undefined,
    page,
    pageSize: PAGE_SIZE,
   });
   if (!payload.list) throw new Error("Phản hồi danh sách không hợp lệ.");
   return payload.list;
  },
 });
 const childList = childListQuery.data;
 const pageIds = childList?.rows.map((row) => row.id) ?? [];
 const localChildren = new Map(
  [...sections, ...examples].map((entry) => {
   const child = "section" in entry ? entry.section : entry.example;
   return [child.id, entry];
  }),
 );

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

 const requestPreview = async (operation: BulkOperation) => {
  if (!scopeId) return toast.error("Scope hiện tại chưa có ID hợp lệ.");
  setBusy(true);
  try {
   const payload = await bulkRequest({
    action: "preview",
    entityType,
    scopeType: scope,
    scopeId,
    deleted: operation !== "soft_delete",
    sectionKeys,
    query: deferredQuery || undefined,
    ids: selectionMode === "ids" ? selectedIds : undefined,
   });
   setPendingOperation(operation);
   setPurgeCount("");
   setPreview(payload.preview ?? null);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể tạo preview.");
  } finally {
   setBusy(false);
  }
 };

 const mutateChildren = async () => {
  if (!preview || !scopeId) return;
  setBusy(true);
  try {
   const payload = await bulkRequest({
    action: "mutate",
    entityType,
    scopeType: scope,
    scopeId,
    operation: pendingOperation,
    expectedCount: preview.rowCount,
    expectedFingerprint: preview.fingerprint,
    reason: `${pendingOperation} ${entityType} từ trình quản lý`,
    sectionKeys,
    query: deferredQuery || undefined,
    ids: selectionMode === "ids" ? selectedIds : undefined,
   });
   const operationLabel =
    pendingOperation === "soft_delete"
     ? "xóa mềm"
     : pendingOperation === "restore"
       ? "khôi phục"
       : "xóa vĩnh viễn";
   toast.success(`Đã ${operationLabel} ${payload.result?.changedCount ?? preview.rowCount} dòng.`);
   setPreview(null);
   setSelectedIds([]);
   setSelectionMode("ids");
   await queryClient.invalidateQueries({
    queryKey: hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary"),
   });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.vocabChildManagerRoot });
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Danh sách đã thay đổi. Hãy xem trước lại.",
   );
  } finally {
   setBusy(false);
  }
 };

 const toggle = (id: string, checked: CheckboxState) =>
  setSelectedIds((current) => {
   setSelectionMode("ids");
   return checked === true
    ? [...new Set([...current, id])]
    : current.filter((value) => value !== id);
  });

 return (
  <Dialog
   open={open}
   onOpenChange={(next) => {
    setOpen(next);
    if (next) {
     setRows(initialRows);
     setPreview(null);
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
      Sửa thông tin chính và quản lý riêng nội dung chi tiết, ví dụ.
     </DialogDescription>
    </DialogHeader>
    <DialogBody className="grid max-h-[calc(92dvh-11rem)] gap-4 overflow-y-auto">
     <Tabs
      variant="segmented"
      value={tab}
      onValueChange={(value) => {
       setTab(value);
       setSelectedIds([]);
       setPreview(null);
      }}
      items={[
       { key: "vocab", label: "Từ vựng", icon: BookOpen },
       { key: "sections", label: "Nội dung chi tiết", icon: Layers3 },
       { key: "examples", label: "Ví dụ", icon: BookOpen },
      ]}
     />
     {tab === "vocab" ? (
      <CoreTable
       rows={rows}
       onChange={(index, key, value) =>
        setRows((current) =>
         current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
        )
       }
      />
     ) : (
      <div className="grid gap-3">
       <div className="grid gap-2 md:grid-cols-[11rem_11rem_minmax(0,1fr)_auto]">
        <Label variant="label" weight="bold" className="grid gap-1">
         Phạm vi
         <Select
          value={scope}
          onValueChange={(value) => {
           const parsedScope = ScopeSchema.safeParse(value);
           if (!parsedScope.success) return;
           setScope(parsedScope.data);
           setPage(1);
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
         >
          <SelectTrigger width="full">
           <SelectValue />
          </SelectTrigger>
          <SelectContent>
           <SelectItem value="lesson">Bài hiện tại</SelectItem>
           <SelectItem value="book">Quyển hiện tại</SelectItem>
           <SelectItem value="course">Giáo trình hiện tại</SelectItem>
          </SelectContent>
         </Select>
        </Label>
        {tab === "sections" ? (
         <Label variant="label" weight="bold" className="grid gap-1">
          Loại nội dung
          <Select
           value={sectionFilter}
           onValueChange={(value) => {
            setSectionFilter(value);
            setPage(1);
            setSelectedIds([]);
            setSelectionMode("ids");
           }}
          >
           <SelectTrigger width="full">
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            {SECTION_FILTERS.map(([value, text]) => (
             <SelectItem key={value} value={value}>
              {text}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </Label>
        ) : (
         <span aria-hidden />
        )}
        <Label variant="label" weight="bold" className="grid gap-1">
         Tìm nội dung
         <Input
          value={query}
          onChange={(event) => {
           setQuery(event.target.value);
           setPage(1);
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
          placeholder="Tiêu đề, Hán tự, nghĩa..."
         />
        </Label>
        <div className="flex flex-wrap items-end gap-2">
         <Button
          type="button"
          variant="outline"
          disabled={busy || childListQuery.isFetching}
          onClick={() => {
           setShowDeleted((current) => !current);
           setPage(1);
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
         >
          {showDeleted ? "Nội dung đang dùng" : "Nội dung đã xóa"}
         </Button>
         <Button
          type="button"
          variant={showDeleted ? "default" : "destructive"}
          disabled={busy || (selectionMode === "ids" && !selectedIds.length)}
          onClick={() => requestPreview(showDeleted ? "restore" : "soft_delete")}
         >
          {showDeleted ? null : <Trash2 />}
          {showDeleted
           ? selectionMode === "filter"
            ? `Khôi phục ${childList?.total ?? 0} kết quả`
            : `Khôi phục ${selectedIds.length} dòng`
           : selectionMode === "filter"
             ? `Xóa mềm ${childList?.total ?? 0} kết quả`
             : `Xóa mềm ${selectedIds.length} dòng`}
         </Button>
        </div>
       </div>
       <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
        <StudyInstructionText>
         {childList?.total ?? 0} kết quả · Trang {childList?.page ?? page}. Chọn trang chỉ tác động
         các dòng đang thấy; chọn toàn bộ áp dụng đúng bộ lọc hiện tại.
        </StudyInstructionText>
        <div className="flex flex-wrap gap-2">
         <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!pageIds.length}
          onClick={() => {
           setSelectedIds(pageIds);
           setSelectionMode("ids");
          }}
         >
          Chọn trang ({pageIds.length})
         </Button>
         <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!childList?.total}
          onClick={() => {
           setSelectedIds([]);
           setSelectionMode("filter");
          }}
         >
          Chọn toàn bộ ({childList?.total ?? 0})
         </Button>
         <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
         >
          Bỏ chọn
         </Button>
        </div>
       </div>
       {!showDeleted && createWord?.editMeta ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border-subtle bg-bg-subtle p-3">
         <Label variant="label" weight="bold" className="grid min-w-56 gap-1">
          Thêm vào một từ
          <Select value={createWord.runtimeId} onValueChange={setCreateWordId}>
           <SelectTrigger width="full">
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            {deepItems.map((item) => (
             <SelectItem key={item.runtimeId} value={item.runtimeId}>
              {item.hanzi} · {item.pinyin}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </Label>
         <CreateNormalizedChildDialog
          family="vocab"
          lessonId={lessonId}
          parent={createWord.editMeta}
         />
        </div>
       ) : null}
       <div className="grid gap-2">
        {childListQuery.isPending ? (
         <StudyInstructionText tone="muted" className="rounded-xl border border-border-subtle p-4">
          Đang tải…
         </StudyInstructionText>
        ) : childListQuery.isError ? (
         <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 p-4">
          <StudyInstructionText>
           Không thể tải danh sách nội dung chi tiết và ví dụ.
          </StudyInstructionText>
          <Button type="button" variant="outline" onClick={() => childListQuery.refetch()}>
           Thử lại
          </Button>
         </div>
        ) : !childList?.rows.length ? (
         <StudyInstructionText tone="muted" className="rounded-xl border border-border-subtle p-4">
          Không có nội dung phù hợp.
         </StudyInstructionText>
        ) : (
         childList.rows.map((row) => {
          const localEntry = localChildren.get(row.id);
          const content = (
           <Label
            variant="label"
            className="flex min-h-12 items-start gap-3 rounded-xl border border-border-default bg-bg-primary p-3"
           >
            <Checkbox
             checked={selectionMode === "filter" || selectedIds.includes(row.id)}
             onCheckedChange={(checked) => toggle(row.id, checked)}
             aria-label={`Chọn ${row.label}`}
            />
            <span className="min-w-0">
             <StudyInstructionText as="strong" tone="default" className="block">
              {row.label}
             </StudyInstructionText>
             <StudyInstructionText as="span" variant="bodySmall" tone="muted">
              {row.word} · {row.sectionKey ?? "Ví dụ"} · {row.lessonId}
             </StudyInstructionText>
            </span>
           </Label>
          );
          if (!localEntry || showDeleted) return <div key={row.id}>{content}</div>;
          const child = "section" in localEntry ? localEntry.section : localEntry.example;
          const path =
           "section" in localEntry
            ? [
               ...getItemPath(localEntry.item, localEntry.itemIndex),
               "detailSections",
               localEntry.sectionIndex,
              ]
            : [
               ...getItemPath(localEntry.item, localEntry.itemIndex),
               "examples",
               localEntry.exampleIndex,
              ];
          return (
           <EditableNodeWrapper
            key={row.id}
            lessonId={lessonId}
            entityType={entityType}
            entityId={row.id}
            parentEntityType="vocab_item"
            parentEntityId={getEntityId(localEntry.item)}
            path={path}
            value={child}
            label={row.label}
           >
            {content}
           </EditableNodeWrapper>
          );
         })
        )}
       </div>
       {childList && childList.total > PAGE_SIZE ? (
        <div className="flex items-center justify-end gap-2">
         <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1 || childListQuery.isFetching}
          onClick={() => {
           setPage((current) => Math.max(1, current - 1));
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
         >
          Trang trước
         </Button>
         <StudyInstructionText as="span" variant="bodySmall" tone="muted">
          {page}/{Math.ceil(childList.total / PAGE_SIZE)}
         </StudyInstructionText>
         <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page * PAGE_SIZE >= childList.total || childListQuery.isFetching}
          onClick={() => {
           setPage((current) => current + 1);
           setSelectedIds([]);
           setSelectionMode("ids");
          }}
         >
          Trang sau
         </Button>
        </div>
       ) : null}
      </div>
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
   <Dialog open={Boolean(preview)} onOpenChange={(next) => !next && setPreview(null)}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>
       {pendingOperation === "soft_delete" ? "Xác nhận xóa mềm" : "Nội dung đã xóa"}
      </DialogTitle>
      <DialogDescription>
       {pendingOperation === "soft_delete"
        ? "Có thể khôi phục về sau."
        : "Khôi phục hoặc chuyển sang xóa vĩnh viễn. Fingerprint sẽ chặn thao tác nếu tập dữ liệu đổi."}
      </DialogDescription>
     </DialogHeader>
     <DialogBody className="grid gap-2">
      <StudyInstructionText>
       <strong>Phạm vi:</strong> {scope} · {scopeId}
      </StudyInstructionText>
      <StudyInstructionText>
       <strong>Số dòng:</strong> {preview?.rowCount ?? 0}
      </StudyInstructionText>
      <StudyInstructionText>
       <strong>Số từ bị ảnh hưởng:</strong> {preview?.wordCount ?? 0}
      </StudyInstructionText>
      <StudyInstructionText>
       <strong>Quyền sở hữu:</strong> {JSON.stringify(preview?.ownership ?? {})}
      </StudyInstructionText>
      {pendingOperation === "purge" ? (
       <Label variant="label" weight="bold" className="grid gap-1">
        Nhập lại số dòng để xóa vĩnh viễn
        <Input
         inputMode="numeric"
         value={purgeCount}
         onChange={(event) => setPurgeCount(event.target.value)}
        />
       </Label>
      ) : null}
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
       Hủy
      </Button>
      {pendingOperation === "restore" ? (
       <>
        <Button
         type="button"
         variant="destructive"
         disabled={busy || !preview?.rowCount}
         onClick={() => {
          setPendingOperation("purge");
          setPurgeCount("");
         }}
        >
         Xóa vĩnh viễn
        </Button>
        <Button type="button" disabled={busy || !preview?.rowCount} onClick={mutateChildren}>
         Khôi phục {preview?.rowCount ?? 0} dòng
        </Button>
       </>
      ) : (
       <Button
        type="button"
        variant={pendingOperation === "purge" ? "destructive" : "default"}
        disabled={
         busy ||
         !preview?.rowCount ||
         (pendingOperation === "purge" && purgeCount !== String(preview?.rowCount ?? 0))
        }
        onClick={mutateChildren}
       >
        {pendingOperation === "purge" ? "Xóa vĩnh viễn" : "Xóa mềm"} {preview?.rowCount ?? 0} dòng
       </Button>
      )}
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Dialog>
 );
}

function CoreTable({
 rows,
 onChange,
}: {
 rows: CoreRow[];
 onChange: (index: number, key: keyof CoreRow, value: string) => void;
}) {
 return (
  <div className="overflow-x-auto">
   <div className="grid min-w-[52rem] gap-2">
    {rows.map((row, index) => (
     <div
      key={row.id}
      className="grid grid-cols-[0.8fr_1fr_1.8fr_0.8fr_1fr] gap-2 rounded-xl border border-border-default p-2"
     >
      <Input
       aria-label={`Tiếng Trung ${index + 1}`}
       value={row.hanzi}
       onChange={(event) => onChange(index, "hanzi", event.target.value)}
      />
      <Input
       aria-label={`Pinyin ${index + 1}`}
       value={row.pinyin}
       onChange={(event) => onChange(index, "pinyin", event.target.value)}
      />
      <Input
       aria-label={`Nghĩa ${index + 1}`}
       value={row.meaningVi}
       onChange={(event) => onChange(index, "meaningVi", event.target.value)}
      />
      <Input
       aria-label={`Từ loại ${index + 1}`}
       value={row.pos}
       onChange={(event) => onChange(index, "pos", event.target.value)}
      />
      <Input
       aria-label={`Nhóm ${index + 1}`}
       value={row.category}
       onChange={(event) => onChange(index, "category", event.target.value)}
      />
     </div>
    ))}
   </div>
  </div>
 );
}
