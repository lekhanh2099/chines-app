"use client";

import { type ReactElement, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
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
} from "@/components/ui/overlays/dialog";
import { Typography } from "@/components/ui/display/typography";

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
 const t = useTranslations("Common.softDelete");
 const common = useTranslations("Common.actions");
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
   <DialogContent size="sm" showCloseButton={!isDeleting} closeLabel={common("close")}>
    <DialogHeader>
     <DialogTitle>{t("title", { type: itemType })}</DialogTitle>
     <DialogDescription>{t("description", { label: itemLabel })}</DialogDescription>
    </DialogHeader>
    <DialogBody>
     <Typography as="p" variant="bodySmall" tone="secondary" leading="standard">
      {t("note")}
     </Typography>
    </DialogBody>
    <DialogFooter>
     <DialogClose asChild>
      <Button type="button" variant="outline" disabled={isDeleting}>
       {common("cancel")}
      </Button>
     </DialogClose>
     <Button
      type="button"
      variant="destructive"
      disabled={isDeleting}
      onClick={() => void handleConfirm()}
     >
      <Trash2 data-icon="inline-start" />
      {isDeleting ? t("deleting") : t("delete")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
