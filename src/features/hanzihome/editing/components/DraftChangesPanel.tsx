"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { buildHanziHomeDbEditDraftsFromPatches } from "@/features/hanzihome/editor/editDraftBuilder";
import { saveHanziHomeDbEditDraftClient } from "@/features/hanzihome/editor/editSaveClient";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";
import { PatchPreview } from "./PatchPreview";
import { UnsupportedPatchNotice } from "./UnsupportedPatchNotice";

const EMPTY_SKIPPED_PATCH_IDS: string[] = [];

type SaveSummary = {
 savedCount: number;
 skippedCount: number;
 targetPaths: string[];
};

export function DraftChangesPanel() {
 const { originalLesson: lesson } = useHanziHomeRuntime();
 const lessonId = lesson.id;
 const [isSaving, setIsSaving] = useState(false);
 const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);
 const patches = useHanziHomeDraftStore((state) => state.patches).filter(
  (patch) => patch.lessonId === lessonId,
 );
 const skippedPatchIds = useHanziHomeDraftStore(
  (state) => state.skippedPatchIdsByLesson[lessonId] ?? EMPTY_SKIPPED_PATCH_IDS,
 );
 const removePatch = useHanziHomeDraftStore((state) => state.removePatch);
 const clearLessonDrafts = useHanziHomeDraftStore((state) => state.clearLessonDrafts);
 const skippedPatchIdSet = useMemo(() => new Set(skippedPatchIds), [skippedPatchIds]);
 const activePatches = useMemo(
  () => patches.filter((patch) => !skippedPatchIdSet.has(patch.id)),
  [patches, skippedPatchIdSet],
 );
 const buildResult = useMemo(
  () => buildHanziHomeDbEditDraftsFromPatches(lesson, activePatches),
  [activePatches, lesson],
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

 const saveToDbModules = async () => {
  const { drafts, unsupported } = buildResult;

  if (drafts.length === 0) {
   toast.error(
    unsupported.length > 0 || skippedPatchIds.length > 0
     ? "Không có draft module hợp lệ để lưu. Mở Drafts để xem patch bị skip/unsupported."
     : "Không có draft module hợp lệ để lưu.",
   );
   return;
  }

  setIsSaving(true);
  setSaveSummary(null);
  try {
   const savedPatchIds = new Set<string>();
   const targetPaths: string[] = [];

   for (const entry of drafts) {
    const result = await saveHanziHomeDbEditDraftClient(entry.draft);

    if (!result.ok) {
     throw new Error(result?.errors?.[0]?.message || "Không lưu được module HanziHome DB.");
    }

    for (const patchId of entry.patchIds) savedPatchIds.add(patchId);
    if (result.targetPath) targetPaths.push(result.targetPath);
   }

   for (const patchId of savedPatchIds) removePatch(patchId);

   const skippedCount = skippedPatchIds.length + unsupported.length;
   setSaveSummary({
    savedCount: savedPatchIds.size,
    skippedCount,
    targetPaths: [...new Set(targetPaths)],
   });

   toast.success(
    skippedCount > 0
     ? `Đã lưu ${savedPatchIds.size} patch hợp lệ. Còn ${skippedCount} patch bị bỏ qua.`
     : "Đã lưu draft vào data/hanzihome-db và rebuild/audit xong.",
   );

   if (savedPatchIds.size === patches.length) {
    clearLessonDrafts(lessonId);
    window.location.reload();
   }
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không lưu được draft.");
  } finally {
   setIsSaving(false);
  }
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
      Có thể export JSON hoặc lưu dev-only vào data/hanzihome-db rồi rebuild/audit.
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
      variant="default"
      size="sm"
      disabled={patches.length === 0 || isSaving}
      onClick={saveToDbModules}
     >
      <Save className="h-4 w-4" />
      {isSaving ? "Đang lưu..." : "Lưu DB"}
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
    {saveSummary ? (
     <div className="grid gap-1 rounded-xl border border-success/35 bg-success-subtle p-3 text-xs font-semibold text-success-text">
      <p className="font-black">
       Đã lưu {saveSummary.savedCount} patch. Bỏ qua {saveSummary.skippedCount} patch.
      </p>
      {saveSummary.targetPaths.length > 0 ? (
       <p className="text-text-secondary">Files: {saveSummary.targetPaths.join(", ")}</p>
      ) : null}
     </div>
    ) : null}
    {skippedPatchIds.length > 0 ? (
     <div className="flex items-start gap-2 rounded-xl border border-warning/35 bg-warning-subtle p-3  font-semibold text-warning-text">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="grid gap-1">
       <p className="font-black">
        Có {skippedPatchIds.length} draft patch không apply được vì path không còn khớp data hiện
        tại.
       </p>
       <p className="text-xs text-text-secondary">
        Xóa hoặc sửa các patch bị đánh dấu trước khi export để tránh tưởng đã lưu nhưng UI không
        đổi.
       </p>
      </div>
     </div>
    ) : null}
    <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
     {patches.length > 0 ? <UnsupportedPatchNotice unsupported={buildResult.unsupported} /> : null}
     {patches.length > 0 ? (
      patches.map((patch) => (
       <div
        key={patch.id}
        className={
         skippedPatchIdSet.has(patch.id)
          ? "grid gap-2 rounded-xl border border-warning/35 bg-warning-subtle p-3"
          : "grid gap-2"
        }
       >
        <div className="flex items-center justify-between gap-2">
         <div className="min-w-0">
          <p className="font-black text-text-primary">
           {patch.entityType} · {patch.entityId}
          </p>
          {skippedPatchIdSet.has(patch.id) ? (
           <p className="text-xs font-bold text-warning-text">
            Path lỗi, patch này chưa được apply lên UI.
           </p>
          ) : null}
         </div>
         <Button type="button" variant="ghost" size="sm" onClick={() => removePatch(patch.id)}>
          Xóa
         </Button>
        </div>
        <PatchPreview patch={patch} />
       </div>
      ))
     ) : (
      <p className="rounded-xl border border-dashed border-border-default p-6 text-center  font-semibold text-text-muted">
       Chưa có draft patch cho bài này.
      </p>
     )}
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
