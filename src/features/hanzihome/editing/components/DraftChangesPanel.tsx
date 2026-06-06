"use client";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";
import { PatchPreview } from "./PatchPreview";

export function DraftChangesPanel({ lessonId }: { lessonId: string }) {
 const patches = useHanziHomeDraftStore((state) => state.patches).filter(
  (patch) => patch.lessonId === lessonId,
 );
 const removePatch = useHanziHomeDraftStore((state) => state.removePatch);
 const clearLessonDrafts = useHanziHomeDraftStore(
  (state) => state.clearLessonDrafts,
 );

 const exportPatches = () => {
  const blob = new Blob([JSON.stringify(patches, null, 2)], {
   type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hanzihome-${lessonId}-draft-patches.json`;
  anchor.click();
  URL.revokeObjectURL(url);
 };

 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs">
     Drafts {patches.length > 0 ? `(${patches.length})` : ""}
    </Button>
   </DialogTrigger>
   <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
    <DialogHeader>
     <DialogTitle>Draft changes</DialogTitle>
     <DialogDescription>
      Các thay đổi chỉ nằm trong client store, chưa ghi vào JSON hoặc backend.
     </DialogDescription>
    </DialogHeader>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={patches.length === 0}
      onClick={exportPatches}
     >
      <Download className="h-4 w-4" />
      Export JSON
     </Button>
     <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={patches.length === 0}
      onClick={() => clearLessonDrafts(lessonId)}
     >
      <Trash2 className="h-4 w-4" />
      Xóa draft bài này
     </Button>
    </div>
    <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
     {patches.length > 0 ? (
      patches.map((patch) => (
       <div key={patch.id} className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
         <p className="text-sm font-black text-text-primary">
          {patch.entityType} · {patch.entityId}
         </p>
         <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removePatch(patch.id)}
         >
          Xóa
         </Button>
        </div>
        <PatchPreview patch={patch} />
       </div>
      ))
     ) : (
      <p className="rounded-xl border border-dashed border-border-default p-6 text-center text-sm font-semibold text-text-muted">
       Chưa có draft patch cho bài này.
      </p>
     )}
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
