"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

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
import { useHanziHomeActiveEditableNode } from "@/features/hanzihome/context/selectors";
import { createHanziHomeUpdatePatch } from "@/features/hanzihome/editor/editPatchFactory";

import { editRegistry } from "../editRegistry";
import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";
import type { DraftPatch } from "../store/types";
import { PatchPreview } from "./PatchPreview";

const formId = "hanzihome-node-edit-form";

export function EditableDialogShell() {
 const activeNode = useHanziHomeActiveEditableNode();
 const { closeEditableNode } = useHanziHomeFeatureActions();
 const addPatch = useHanziHomeDraftStore((state) => state.addPatch);
 const [previewPatch, setPreviewPatch] = useState<DraftPatch | null>(null);
 const [draftAfter, setDraftAfter] = useState<unknown>(null);
 const [formVersion, setFormVersion] = useState(0);
 const [isValid, setIsValid] = useState(true);
 const registryEntry = activeNode ? editRegistry[activeNode.entityType] : null;

 const draftBase = useMemo(
  () =>
   activeNode ? createHanziHomeUpdatePatch({ node: activeNode, after: activeNode.value }) : null,
  [activeNode],
 );

 const saveDraft = (after: unknown) => {
  if (!draftBase) return;
  addPatch({ ...draftBase, after });
  setPreviewPatch(null);
  closeEditableNode();
 };

 return (
  <Dialog
   open={Boolean(activeNode)}
   onOpenChange={(open) => {
    if (!open) {
     setPreviewPatch(null);
     closeEditableNode();
    }
   }}
  >
   {activeNode && registryEntry ? (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
     <DialogHeader>
      <DialogTitle>{activeNode.label || registryEntry.title}</DialogTitle>
      <DialogDescription>{registryEntry.description}</DialogDescription>
     </DialogHeader>
     <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
      <registryEntry.Form
       key={`${activeNode.entityType}-${activeNode.entityId}-${activeNode.path.join(".")}-${formVersion}`}
       value={activeNode.value}
       formId={formId}
       onSubmit={saveDraft}
       onDraftChange={setDraftAfter}
       onValidityChange={setIsValid}
      />
      {previewPatch ? <PatchPreview patch={previewPatch} /> : null}
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="ghost" onClick={closeEditableNode}>
       Hủy
      </Button>
      <Button
       type="button"
       variant="outline"
       onClick={() => {
        setDraftAfter(null);
        setPreviewPatch(null);
        setIsValid(true);
        setFormVersion((current) => current + 1);
       }}
      >
       <RotateCcw className="h-4 w-4" />
       Reset preview
      </Button>
      <Button
       type="button"
       variant="outline"
       onClick={() =>
        draftBase &&
        setPreviewPatch({
         ...draftBase,
         after: draftAfter ?? activeNode.value,
        })
       }
      >
       Preview diff
      </Button>
      <Button type="submit" form={formId} disabled={!isValid}>
       Lưu draft
      </Button>
     </DialogFooter>
    </DialogContent>
   ) : null}
  </Dialog>
 );
}
