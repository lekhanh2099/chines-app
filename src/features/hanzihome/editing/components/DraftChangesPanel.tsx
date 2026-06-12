"use client";

import { useState } from "react";
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
import type { HanziHomeLesson } from "@/features/hanzihome/types";

import { buildHanziHomeDbEditDraftsFromPatches } from "../store/draftToDbEditDraft";
import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";
import { PatchPreview } from "./PatchPreview";

const EMPTY_SKIPPED_PATCH_IDS: string[] = [];

export function DraftChangesPanel({ lesson }: { lesson: HanziHomeLesson }) {
 const lessonId = lesson.id;
 const [isSaving, setIsSaving] = useState(false);
 const patches = useHanziHomeDraftStore((state) => state.patches).filter(
  (patch) => patch.lessonId === lessonId,
 );
 const skippedPatchIds = useHanziHomeDraftStore(
  (state) =>
   state.skippedPatchIdsByLesson[lessonId] ?? EMPTY_SKIPPED_PATCH_IDS,
 );
 const removePatch = useHanziHomeDraftStore((state) => state.removePatch);
 const clearLessonDrafts = useHanziHomeDraftStore(
  (state) => state.clearLessonDrafts,
 );
 const skippedPatchIdSet = new Set(skippedPatchIds);

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
  const { drafts, unsupported } = buildHanziHomeDbEditDraftsFromPatches(
   lesson,
   patches,
  );

  if (unsupported.length > 0) {
   toast.error(
    `Còn ${unsupported.length} draft chưa map được sang module DB. Mở Drafts để xem chi tiết.`,
   );
   return;
  }

  if (drafts.length === 0) {
   toast.error("Không có draft module hợp lệ để lưu.");
   return;
  }

  setIsSaving(true);
  try {
   for (const draft of drafts) {
    const response = await fetch("/api/hanzihome-db/edit", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ draft }),
    });
    const result = (await response.json().catch(() => null)) as
     | { ok?: boolean; errors?: Array<{ message?: string }> }
     | null;

    if (!response.ok || !result?.ok) {
     throw new Error(
      result?.errors?.[0]?.message || "Không lưu được module HanziHome DB.",
     );
    }
   }

   clearLessonDrafts(lessonId);
   toast.success("Đã lưu draft vào data/hanzihome-db và rebuild/audit xong.");
   window.location.reload();
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không lưu được draft.");
  } finally {
   setIsSaving(false);
  }
 };

 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-8 px-2.5 text-xs"
    >
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
      disabled={patches.length === 0 || skippedPatchIds.length > 0}
      onClick={exportPatches}
     >
      <Download className="h-4 w-4" />
      Export JSON
     </Button>
     <Button
      type="button"
      variant="default"
      size="sm"
      disabled={patches.length === 0 || skippedPatchIds.length > 0 || isSaving}
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
    {skippedPatchIds.length > 0 ? (
     <div className="flex items-start gap-2 rounded-xl border border-warning/35 bg-warning-subtle p-3 text-sm font-semibold text-warning-text">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="grid gap-1">
       <p className="font-black">
        Có {skippedPatchIds.length} draft patch không apply được vì path không
        còn khớp data hiện tại.
       </p>
       <p className="text-xs text-text-secondary">
        Xóa hoặc sửa các patch bị đánh dấu trước khi export để tránh tưởng đã
        lưu nhưng UI không đổi.
       </p>
      </div>
     </div>
    ) : null}
    <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
     {patches.length > 0 ? (
      <UnsupportedPatchNotice lesson={lesson} patches={patches} />
     ) : null}
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
          <p className="text-sm font-black text-text-primary">
           {patch.entityType} · {patch.entityId}
          </p>
          {skippedPatchIdSet.has(patch.id) ? (
           <p className="text-xs font-bold text-warning-text">
            Path lỗi, patch này chưa được apply lên UI.
           </p>
          ) : null}
         </div>
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

function UnsupportedPatchNotice({
 lesson,
 patches,
}: {
 lesson: HanziHomeLesson;
 patches: Parameters<typeof buildHanziHomeDbEditDraftsFromPatches>[1];
}) {
 const { unsupported } = buildHanziHomeDbEditDraftsFromPatches(lesson, patches);

 if (unsupported.length === 0) return null;

 return (
  <div className="grid gap-1 rounded-xl border border-warning/35 bg-warning-subtle p-3 text-xs font-semibold text-warning-text">
   <p className="font-black">
    {unsupported.length} draft chưa lưu DB tự động được.
   </p>
   {unsupported.slice(0, 5).map((item) => (
    <p key={item.patchId}>
     {item.entityType}: {item.reason}
    </p>
   ))}
  </div>
 );
}
