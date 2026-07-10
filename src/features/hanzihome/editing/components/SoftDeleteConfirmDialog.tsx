"use client";

import { type ReactElement, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

type SoftDeleteConfirmDialogProps = {
 itemLabel: string;
 itemType: string;
 trigger: ReactElement;
 onConfirm: () => Promise<void>;
};

export function SoftDeleteConfirmDialog({
 itemLabel,
 itemType,
 trigger,
 onConfirm,
}: SoftDeleteConfirmDialogProps) {
 const [open, setOpen] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);

 async function handleConfirm() {
  setIsDeleting(true);
 try {
   await onConfirm();
   setOpen(false);
  } catch {
   // The caller owns the user-facing error message; keep the dialog open for retry.
  } finally {
   setIsDeleting(false);
  }
 }

 return (
  <Dialog open={open} onOpenChange={(nextOpen) => !isDeleting && setOpen(nextOpen)}>
   <DialogTrigger asChild>{trigger}</DialogTrigger>
   <DialogContent className="max-w-md" showCloseButton={!isDeleting}>
    <DialogHeader>
     <DialogTitle>Xóa {itemType}?</DialogTitle>
     <DialogDescription>
      “{itemLabel}” sẽ được chuyển vào mục đã xóa và có thể khôi phục sau.
     </DialogDescription>
    </DialogHeader>
    <DialogBody>
     <p className="text-sm font-medium leading-6 text-text-secondary">
      Nội dung này sẽ không còn xuất hiện trong chế độ học cho đến khi được khôi phục.
     </p>
    </DialogBody>
    <DialogFooter>
     <DialogClose asChild>
      <Button type="button" variant="outline" disabled={isDeleting}>
       Hủy
      </Button>
     </DialogClose>
     <Button
      type="button"
      variant="destructive"
      disabled={isDeleting}
      onClick={() => void handleConfirm()}
     >
      <Trash2 />
      {isDeleting ? "Đang xóa..." : "Xóa"}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
