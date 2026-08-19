"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
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
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { useHanziHomeActiveEditableNode } from "@/features/hanzihome/context/selectors";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { cn } from "@/lib/utils";

import { editRegistry } from "../editRegistry";
import { saveEditableNodeDirectly } from "../direct-save";
import { invalidateHanziHomeContent } from "../invalidate-content";
import { isHanziHomeMutationConflict } from "../mutation-error";
import type { EditableNodeRequest } from "../store/types";

const formId = "hanzihome-node-edit-form";

export function EditableDialogShell() {
 const activeNode = useHanziHomeActiveEditableNode();
 const { closeEditableNode } = useHanziHomeFeatureActions();
 const { services } = useHanziHomeFeatureContext();
 const queryClient = useQueryClient();
 const [formVersion, setFormVersion] = useState(0);
 const [isSaving, setIsSaving] = useState(false);
 const registryEntry = activeNode ? editRegistry[activeNode.entityType] : null;
 const isBulkNode =
  activeNode?.entityType === "text_block" || activeNode?.entityType === "exercise";

 const saveDirectly = async (after: EditableNodeRequest["value"]) => {
  if (!activeNode || isSaving) return;
  const record = services.resolveEditableRecord(activeNode);
  if (!record) {
   toast.error("Node này chưa có DB write target.");
   return;
  }

  setIsSaving(true);
  try {
   await saveEditableNodeDirectly({
    node: activeNode,
    record,
    after,
    reason: `Cập nhật ${activeNode.entityType}: ${activeNode.label || activeNode.entityId}`,
   });
   await invalidateHanziHomeContent({
    queryClient,
    lessonId: activeNode.lessonId,
    entityType: activeNode.entityType,
   });
   toast.success("Đã lưu nội dung vào Supabase.");
   closeEditableNode();
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    closeEditableNode();
    await queryClient.invalidateQueries({
     queryKey: hanzihomeQueryKeys.lessonDetail(activeNode.lessonId),
    });
    toast.error("Nội dung đã thay đổi, đang tải lại.");
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể lưu nội dung.");
  } finally {
   setIsSaving(false);
  }
 };

 return (
  <Dialog
   open={Boolean(activeNode)}
   onOpenChange={(open) => {
    if (!open) {
     closeEditableNode();
    }
   }}
  >
   {activeNode && registryEntry ? (
    <DialogContent
     className={cn("max-h-[90vh] overflow-hidden", isBulkNode ? "max-w-5xl" : "max-w-3xl")}
    >
     <DialogHeader>
      <DialogTitle>{activeNode.label || registryEntry.title}</DialogTitle>
      <DialogDescription>{registryEntry.description}</DialogDescription>
     </DialogHeader>
     <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
      <registryEntry.Form
       key={`${activeNode.entityType}-${activeNode.entityId}-${activeNode.path.join(".")}-${formVersion}`}
       value={activeNode.value}
       formId={formId}
       onSubmit={saveDirectly}
      />
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="ghost" disabled={isSaving} onClick={closeEditableNode}>
       Hủy
      </Button>
      <Button
       type="button"
       variant="outline"
       onClick={() => setFormVersion((current) => current + 1)}
       disabled={isSaving}
      >
       <RotateCcw className="h-4 w-4" />
       Reset
      </Button>
      <Button type="submit" form={formId} disabled={isSaving}>
       {isSaving ? "Đang lưu..." : "Lưu"}
      </Button>
     </DialogFooter>
    </DialogContent>
   ) : null}
  </Dialog>
 );
}
