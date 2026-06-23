"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import {
 deleteEditableNodeDirectly,
 reorderCanonicalContent,
 type RestorableCanonicalEntityType,
} from "../direct-save";
import { invalidateHanziHomeContent } from "../invalidate-content";
import { isPrimaryEditableEntityType } from "../edit-visibility";
import { isHanziHomeMutationConflict } from "../mutation-error";
import type { EditableNodePath, EditableEntityType } from "../store/types";
import { EditButton } from "./EditButton";

type EditableNodeWrapperProps = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: EditableNodePath;
 value: unknown;
 label?: string;
 editLabel?: string;
 className?: string;
 editOnly?: boolean;
 children: ReactNode;
};

export function EditableNodeWrapper({
 lessonId,
 entityType,
 entityId,
 parentEntityType,
 parentEntityId,
 path,
 value,
 label,
 editLabel,
 className,
 editOnly = false,
 children,
}: EditableNodeWrapperProps) {
 const editMode = useHanziHomeEditMode();
 const queryClient = useQueryClient();
 const { services } = useHanziHomeFeatureContext();
 const { openEditableNode } = useHanziHomeFeatureActions();
 const [isDeleting, setIsDeleting] = useState(false);
 const [isReordering, setIsReordering] = useState(false);

 if (!editMode) return editOnly ? null : children;
 if (!isPrimaryEditableEntityType(entityType)) return editOnly ? null : children;

 const baseNode = {
  lessonId,
  entityType,
  entityId,
  parentEntityType,
  parentEntityId,
  path,
  value,
  label,
 };
 const record = services.resolveEditableRecord(baseNode);
 const canReorder =
  Boolean(record?.order && record.orderField) && record?.entityType === entityType;
 const valueId =
  value && typeof value === "object" && !Array.isArray(value) && "id" in value
   ? (value as { id?: unknown }).id
   : undefined;
 const canDelete =
  Boolean(record) &&
  (record?.entityType === entityType || (typeof valueId === "string" && valueId === entityId));

 const openNode = () => {
  openEditableNode(baseNode);
 };

 const deleteNode = async () => {
  if (!window.confirm(`Xóa mềm "${label || entityId}"? Bạn có thể khôi phục sau.`)) return;
  if (!record) {
   toast.error("Node này chưa có DB delete target.");
   return;
  }

  setIsDeleting(true);
  try {
   await deleteEditableNodeDirectly({
    node: baseNode,
    record,
    reason: `Xóa ${label || entityId}`,
   });
   await invalidateHanziHomeContent({ queryClient, lessonId, entityType });
   toast.success("Đã chuyển nội dung vào mục đã xóa.");
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({
     queryKey: ["hanzihome", "lesson-detail", lessonId],
    });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể xóa nội dung.");
  } finally {
   setIsDeleting(false);
  }
 };

 const reorderNode = async (direction: -1 | 1) => {
  if (!record?.order || !record.orderField) return;
  if (!isRestorableEntityType(record.entityType)) {
   toast.error("Node này chưa hỗ trợ sắp xếp trực tiếp.");
   return;
  }
  setIsReordering(true);
  try {
   await reorderCanonicalContent({
    entityType: record.entityType,
    entityId: record.dbId,
    expectedUpdatedAt: record.updatedAt,
    orderField: record.orderField,
    order: record.order + direction,
    reason: `Sắp xếp ${label || entityId}`,
   });
   await queryClient.invalidateQueries({ queryKey: ["hanzihome", "lesson-detail", lessonId] });
   toast.success("Đã cập nhật thứ tự.");
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({
     queryKey: ["hanzihome", "lesson-detail", lessonId],
    });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp nội dung.");
  } finally {
   setIsReordering(false);
  }
 };

 return (
  <div
   className={cn("overflow-hidden rounded-xl border border-dashed border-accent/45", className)}
  >
   <div className="flex min-h-10 items-center justify-end gap-1 border-b border-accent/20 bg-accent-subtle/30 px-2 py-1.5">
    <EditButton onClick={openNode} label={editLabel} />
    {canReorder ? (
     <>
      <Button
       type="button"
       variant="outline"
       size="icon-sm"
       aria-label={`Đưa ${label || entityId} lên`}
       disabled={isReordering || record?.order === 1}
       className="h-7 w-7 bg-bg-card/95 shadow-theme-sm"
       onClick={() => void reorderNode(-1)}
      >
       <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
       type="button"
       variant="outline"
       size="icon-sm"
       aria-label={`Đưa ${label || entityId} xuống`}
       disabled={isReordering}
       className="h-7 w-7 bg-bg-card/95 shadow-theme-sm"
       onClick={() => void reorderNode(1)}
      >
       <ArrowDown className="h-3.5 w-3.5" />
      </Button>
     </>
    ) : null}
    {canDelete ? (
     <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={`Xóa ${label || entityId}`}
      disabled={isDeleting}
      className="h-7 w-7 bg-bg-card/95 text-danger-text shadow-theme-sm"
      onClick={deleteNode}
     >
      <Trash2 className="h-3.5 w-3.5" />
     </Button>
    ) : null}
   </div>
   {children}
  </div>
 );
}

function isRestorableEntityType(value: string): value is RestorableCanonicalEntityType {
 return [
  "course",
  "book",
  "lesson",
  "section",
  "lesson_text",
  "vocab_item",
  "vocab_example",
  "vocab_detail_section",
  "grammar_point",
  "grammar_example",
  "grammar_detail_section",
 ].includes(value);
}
