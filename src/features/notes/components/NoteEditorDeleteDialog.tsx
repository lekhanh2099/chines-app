"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";

/** Confirmation dialog for deleting the open note. */
export function NoteEditorDeleteDialog({
 noteTitle,
 showDeleteConfirm,
 setShowDeleteConfirm,
 isDeleting,
 isImporting,
 handleDelete,
}: {
 noteTitle: string;
 showDeleteConfirm: boolean;
 setShowDeleteConfirm: Dispatch<SetStateAction<boolean>>;
 isDeleting: boolean;
 isImporting: boolean;
 handleDelete: () => Promise<void>;
}) {
 const t = useTranslations("Notes.editor");
 const common = useTranslations("Common");

 return (
  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
   <DialogContent className="max-w-md" showCloseButton={!isDeleting}>
    <DialogHeader>
     <DialogTitle>{t("deleteTitle")}</DialogTitle>
     <DialogDescription>{t("deleteDescription", { title: noteTitle })}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
     <DialogClose asChild>
      <Button type="button" variant="outline" disabled={isDeleting}>
       {common("actions.cancel")}
      </Button>
     </DialogClose>
     <Button
      type="button"
      variant="destructive"
      disabled={isDeleting || isImporting}
      onClick={() => void handleDelete()}
     >
      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {isDeleting ? t("deleting") : t("delete")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
