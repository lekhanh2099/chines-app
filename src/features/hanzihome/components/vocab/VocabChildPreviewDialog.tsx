"use client";

import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { VocabBulkChildManager } from "@/features/hanzihome/hooks/useVocabBulkChildManager";

/** Confirms a previewed soft-delete, restore or purge of manager rows. */
export function VocabChildPreviewDialog({
 manager,
 busy,
}: {
 manager: VocabBulkChildManager;
 busy: boolean;
}) {
 const {
  preview,
  setPreview,
  pendingOperation,
  setPendingOperation,
  purgeCount,
  setPurgeCount,
  scope,
  scopeId,
  mutateChildren,
 } = manager;
 return (
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
      <strong>Scope:</strong> {scope} · {scopeId}
     </StudyInstructionText>
     <StudyInstructionText>
      <strong>Số dòng:</strong> {preview?.rowCount ?? 0}
     </StudyInstructionText>
     <StudyInstructionText>
      <strong>Số từ bị ảnh hưởng:</strong> {preview?.wordCount ?? 0}
     </StudyInstructionText>
     <StudyInstructionText>
      <strong>Ownership:</strong> {JSON.stringify(preview?.ownership ?? {})}
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
 );
}
