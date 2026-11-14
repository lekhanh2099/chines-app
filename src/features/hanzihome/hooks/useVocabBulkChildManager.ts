"use client";

import { useDeferredValue, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import {
 bulkRequest,
 type Preview,
} from "@/features/hanzihome/components/vocab/vocab-bulk-edit-api";
import {
 BulkOperationSchema,
 type BulkOperation,
 type CheckboxState,
 type ManagerTab,
 type Nullable,
 PAGE_SIZE,
 type Scope,
 type SelectionMode,
 SelectionModeSchema,
 sectionKeysForFilter,
} from "@/features/hanzihome/components/vocab/vocab-bulk-edit-utils";

type VocabBulkChildManagerInput = {
 open: boolean;
 tab: ManagerTab;
 lessonId: string;
 bookId: string;
 courseId: string;
 setBusy: (busy: boolean) => void;
};

/**
 * Owns the vocab section/example manager: scope and filters, paging, row
 * selection, the server child list query and the preview-then-mutate flow.
 */
export function useVocabBulkChildManager({
 open,
 tab,
 lessonId,
 bookId,
 courseId,
 setBusy,
}: VocabBulkChildManagerInput) {
 const queryClient = useQueryClient();
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
 const scopeId = scope === "lesson" ? lessonId : scope === "book" ? bookId : courseId;
 const entityType: EditableNodeRequest["entityType"] =
  tab === "sections" ? "vocab_detail_section" : "vocab_example";
 const sectionKeys = sectionKeysForFilter(tab, sectionFilter);
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
   toast.error(error instanceof Error ? error.message : "Selection đã thay đổi. Hãy preview lại.");
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

 return {
  scope,
  setScope,
  query,
  setQuery,
  sectionFilter,
  setSectionFilter,
  showDeleted,
  setShowDeleted,
  page,
  setPage,
  selectedIds,
  setSelectedIds,
  selectionMode,
  setSelectionMode,
  preview,
  setPreview,
  pendingOperation,
  setPendingOperation,
  purgeCount,
  setPurgeCount,
  scopeId,
  entityType,
  childListQuery,
  childList,
  pageIds,
  requestPreview,
  mutateChildren,
  toggle,
 };
}

export type VocabBulkChildManager = ReturnType<typeof useVocabBulkChildManager>;
