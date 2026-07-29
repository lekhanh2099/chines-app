"use client";

import type { JsonFieldValue } from "@/types/json";
import {
 Children,
 cloneElement,
 isValidElement,
 useState,
 type ReactElement,
 type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SoftDeleteConfirmDialog } from "./SoftDeleteConfirmDialog";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 deleteEditableNodeDirectly,
 reorderCanonicalContent,
 type ReorderDirection,
 type RestorableCanonicalEntityType,
} from "../direct-save";
import { invalidateHanziHomeContent } from "../invalidate-content";
import { isPrimaryEditableEntityType } from "../edit-visibility";
import { isHanziHomeMutationConflict } from "../mutation-error";
import type { EditableNodePath, EditableEntityType, EditableNodeRequest } from "../store/types";
import { EditButton } from "./EditButton";

type EditableNodeWrapperProps = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: EditableNodePath;
 value: EditableNodeRequest["value"];
 label?: string;
 editLabel?: string;
 className?: string;
 editOnly?: boolean;
 children: ReactNode;
};

type ElementWithChildren = ReactElement<{ children?: ReactNode }>;

function isElementWithChildren(value: ReactNode): value is ElementWithChildren {
 return isValidElement<{ children?: ReactNode }>(value);
}

function injectControlsIntoChild(children: ReactNode, controls: ReactNode): ReactNode {
 const childList = Children.toArray(children);
 const firstChild = childList[0];

 if (childList.length === 0) return controls;

 if (isElementWithChildren(firstChild)) {
  return [
   cloneElement(firstChild, undefined, firstChild.props.children, controls),
   ...childList.slice(1),
  ];
 }

 return [controls, ...childList];
}

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
   ? (value as { id?: JsonFieldValue }).id
   : undefined;
 const canDelete =
  Boolean(record) &&
  (record?.entityType === entityType || (typeof valueId === "string" && valueId === entityId));

 const openNode = () => {
  openEditableNode(baseNode);
 };

 const deleteNode = async () => {
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
     queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
    });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    throw error;
   }
   toast.error(error instanceof Error ? error.message : "Không thể xóa nội dung.");
   throw error;
  } finally {
   setIsDeleting(false);
  }
 };

 const reorderNode = async (direction: ReorderDirection) => {
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
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.lessonDetail(lessonId) });
   toast.success("Đã cập nhật thứ tự.");
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({
     queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
    });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp nội dung.");
  } finally {
   setIsReordering(false);
  }
 };

 const controls = (
  <div className="flex items-center justify-end gap-1">
   <EditButton onClick={openNode} label={editLabel} />
   {canReorder ? (
    <>
     <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={`Đưa ${label || entityId} lên`}
      disabled={isReordering || record?.order === 1}
      className="w-7"
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
      className="w-7"
      onClick={() => void reorderNode(1)}
     >
      <ArrowDown className="h-3.5 w-3.5" />
     </Button>
    </>
   ) : null}
   {canDelete ? (
    <SoftDeleteConfirmDialog
     itemType="nội dung"
     itemLabel={label || entityId}
     onConfirm={deleteNode}
     trigger={
      <Button
       type="button"
       variant="outline"
       size="icon-sm"
       aria-label={`Xóa ${label || entityId}`}
       disabled={isDeleting}
       className="w-7"
      >
       <Trash2 className="h-3.5 w-3.5" />
      </Button>
     }
    />
   ) : null}
  </div>
 );
 const childList = Children.toArray(children);
 const firstChild = childList[0];
 let content: ReactNode;

 if (childList.length === 1 && isElementWithChildren(firstChild)) {
  content = cloneElement(
   firstChild,
   undefined,
   injectControlsIntoChild(firstChild.props.children, controls),
  );
 } else {
  content = (
   <>
    {controls}
    {children}
   </>
  );
 }

 return (
  <div
   className={cn("overflow-hidden rounded-xl border border-dashed border-accent/45", className)}
  >
   {content}
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
