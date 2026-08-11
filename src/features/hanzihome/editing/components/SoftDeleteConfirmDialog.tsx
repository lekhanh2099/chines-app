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
import { Typography } from "@/components/ui/typography";

type SoftDeleteConfirmDialogProps = {
 itemLabel: string;
 itemType: string;
 trigger?: ReactElement;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
 onConfirm: () => Promise<void>;
};

export function SoftDeleteConfirmDialog({
 itemLabel,
 itemType,
 trigger,
 open,
 onOpenChange,
 onConfirm,
}: SoftDeleteConfirmDialogProps) {
 const [internalOpen, setInternalOpen] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);
 const resolvedOpen = open ?? internalOpen;

 const updateOpen = (nextOpen: boolean) => {
  if (isDeleting) return;
  if (onOpenChange) onOpenChange(nextOpen);
  else setInternalOpen(nextOpen);
 };

 async function handleConfirm() {
  setIsDeleting(true);
  try {
   await onConfirm();
   if (onOpenChange) onOpenChange(false);
   else setInternalOpen(false);
  } catch {
   // Caller owns the user-facing error; keep the dialog open for retry.
  } finally {
   setIsDeleting(false);
  }
 }

 return (
  <Dialog open={resolvedOpen} onOpenChange={updateOpen}>
   {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
   <DialogContent size="sm" showCloseButton={!isDeleting}>
    <DialogHeader>
     <DialogTitle>Xóa {itemType}?</DialogTitle>
     <DialogDescription>
      “{itemLabel}” sẽ được chuyển vào mục đã xóa và có thể khôi phục sau.
     </DialogDescription>
    </DialogHeader>
    <DialogBody>
     <Typography as="p" variant="bodySmall" tone="secondary" leading="standard">
      Nội dung này sẽ không còn xuất hiện trong chế độ học cho đến khi được khôi phục.
     </Typography>
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
      <Trash2 data-icon="inline-start" />
      {isDeleting ? "Đang xóa..." : "Xóa"}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
