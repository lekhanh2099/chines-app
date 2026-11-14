"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import { CreateNormalizedChildDialog } from "@/features/hanzihome/editing/components/CreateNormalizedChildDialog";
import type { VocabBulkChildManager } from "@/features/hanzihome/hooks/useVocabBulkChildManager";
import {
 type collectVocabChildren,
 type EditableItem,
 type ManagerTab,
 PAGE_SIZE,
 ScopeSchema,
 SECTION_FILTERS,
} from "@/features/hanzihome/components/vocab/vocab-bulk-edit-utils";

type VocabChildren<TItem extends EditableItem> = ReturnType<typeof collectVocabChildren<TItem>>;

type VocabChildManagerPanelProps<TItem extends EditableItem> = {
 manager: VocabBulkChildManager;
 busy: boolean;
 tab: ManagerTab;
 lessonId: string;
 deepItems: VocabChildren<TItem>["deepItems"];
 localChildren: VocabChildren<TItem>["localChildren"];
 createWordId: string;
 onCreateWordIdChange: (runtimeId: string) => void;
 getEntityId: (item: TItem) => string;
 getItemPath: (item: TItem, index: number) => EditableNodePath;
};

/** Section/example management view of the vocab manager dialog. */
export function VocabChildManagerPanel<TItem extends EditableItem>({
 manager,
 busy,
 tab,
 lessonId,
 deepItems,
 localChildren,
 createWordId,
 onCreateWordIdChange,
 getEntityId,
 getItemPath,
}: VocabChildManagerPanelProps<TItem>) {
 const { showDeleted, selectedIds, selectionMode, entityType, childListQuery, childList } = manager;
 const createWord = deepItems.find((item) => item.runtimeId === createWordId) ?? deepItems[0];
 return (
  <div className="grid gap-3">
   <VocabChildFilterBar manager={manager} busy={busy} tab={tab} />
   <VocabChildSelectionBar manager={manager} />
   {!showDeleted && createWord?.editMeta ? (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border-subtle bg-bg-subtle p-3">
     <Label variant="label" weight="bold" className="grid min-w-56 gap-1">
      Thêm vào một từ
      <Select value={createWord.runtimeId} onValueChange={onCreateWordIdChange}>
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
     <CreateNormalizedChildDialog family="vocab" lessonId={lessonId} parent={createWord.editMeta} />
    </div>
   ) : null}
   <div className="grid gap-2">
    {childListQuery.isPending ? (
     <StudyInstructionText tone="muted" className="rounded-xl border border-border-subtle p-4">
      Đang tải…
     </StudyInstructionText>
    ) : childListQuery.isError ? (
     <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 p-4">
      <StudyInstructionText>Không thể tải danh sách section/ví dụ.</StudyInstructionText>
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
         onCheckedChange={(checked) => manager.toggle(row.id, checked)}
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
   <VocabChildPagination manager={manager} />
  </div>
 );
}

function VocabChildFilterBar({
 manager,
 busy,
 tab,
}: {
 manager: VocabBulkChildManager;
 busy: boolean;
 tab: ManagerTab;
}) {
 const {
  scope,
  setScope,
  sectionFilter,
  setSectionFilter,
  query,
  setQuery,
  showDeleted,
  setShowDeleted,
  setPage,
  selectedIds,
  setSelectedIds,
  selectionMode,
  setSelectionMode,
  childListQuery,
  childList,
  requestPreview,
 } = manager;
 return (
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
     Loại section
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
 );
}

function VocabChildSelectionBar({ manager }: { manager: VocabBulkChildManager }) {
 const { childList, page, pageIds, setSelectedIds, setSelectionMode } = manager;
 return (
  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
   <StudyInstructionText>
    {childList?.total ?? 0} kết quả · Trang {childList?.page ?? page}. Chọn trang chỉ tác động các
    dòng đang thấy; chọn toàn bộ áp dụng đúng bộ lọc hiện tại.
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
 );
}

function VocabChildPagination({ manager }: { manager: VocabBulkChildManager }) {
 const { childList, childListQuery, page, setPage, setSelectedIds, setSelectionMode } = manager;
 if (!childList || childList.total <= PAGE_SIZE) return null;
 return (
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
 );
}
