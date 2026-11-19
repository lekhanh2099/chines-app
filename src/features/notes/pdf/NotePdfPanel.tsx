"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, FileUp, FileX, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Input } from "@/components/ui/forms/input";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { NotePdfViewer } from "./NotePdfViewer";
import {
 NotePdfSizeError,
 NotePdfTypeError,
 NotePdfUnreadableError,
 type useNotePdf,
} from "./useNotePdf";

type NotePdf = ReturnType<typeof useNotePdf>;

/** The PDF side of a note: an import prompt, or the PDF with its ink. */
export function NotePdfPanel({ notePdf }: { notePdf: NotePdf }) {
 const t = useTranslations("Notes.editor.pdf");
 const common = useTranslations("Common");
 const inputRef = useRef<HTMLInputElement>(null);
 const [confirmReplace, setConfirmReplace] = useState(false);
 const [confirmRemove, setConfirmRemove] = useState(false);
 const [dragging, setDragging] = useState(false);
 const { attachment, isImporting, isRemoving } = notePdf;

 const importFile = async (file: File) => {
  try {
   await notePdf.importPdf(file);
   toast.success(t("imported"));
  } catch (error) {
   toast.error(
    t(
     error instanceof NotePdfTypeError
      ? "typeError"
      : error instanceof NotePdfSizeError
        ? "sizeError"
        : error instanceof NotePdfUnreadableError
          ? "unreadableError"
          : "importError",
    ),
   );
  } finally {
   if (inputRef.current) inputRef.current.value = "";
  }
 };
 const remove = async () => {
  try {
   await notePdf.removePdf();
   setConfirmRemove(false);
   toast.success(t("removed"));
  } catch {
   toast.error(t("removeError"));
  }
 };
 const handleDrop = (event: DragEvent<HTMLElement>) => {
  event.preventDefault();
  setDragging(false);
  const [file] = Array.from(event.dataTransfer.files);
  if (file && !isImporting) void importFile(file);
 };

 const fileInput = (
  <Input
   ref={inputRef}
   type="file"
   accept="application/pdf,.pdf"
   className="hidden"
   onChange={(event) => {
    const [file] = Array.from(event.target.files ?? []);
    if (file) void importFile(file);
   }}
  />
 );

 if (notePdf.isLoading) {
  return (
   <div className="grid h-full place-content-center">
    <Spinner className="size-6" />
   </div>
  );
 }

 if (notePdf.loadFailed) {
  return (
   <div className="grid h-full place-content-center p-4">
    <QueryErrorCard
     title={t("loadError")}
     description={t("loadErrorDescription")}
     retryLabel={common("actions.retry")}
     onRetry={() => void notePdf.retryLoad()}
    />
   </div>
  );
 }

 if (!attachment) {
  return (
   <div
    className="grid h-full min-h-0 place-content-center overflow-auto p-4"
    onDragOver={(event) => {
     event.preventDefault();
     setDragging(true);
    }}
    onDragLeave={() => setDragging(false)}
    onDrop={handleDrop}
   >
    {fileInput}
    <EmptyState
     surface={dragging ? "accent" : "card"}
     size="spacious"
     className="max-w-lg"
     icon={<FileText aria-hidden="true" className="size-8 text-accent-text" />}
     title={t("emptyTitle")}
     description={t("emptyDescription")}
     actions={
      <Button
       type="button"
       size="touch"
       disabled={isImporting}
       onClick={() => inputRef.current?.click()}
      >
       {isImporting ? <Loader2 className="animate-spin" /> : <FileUp />}
       {isImporting ? t("importing") : t("choose")}
      </Button>
     }
    />
   </div>
  );
 }

 return (
  <>
   {fileInput}
   <NotePdfViewer
    key={attachment.id}
    attachment={attachment}
    onReplace={() => setConfirmReplace(true)}
    onRemove={() => setConfirmRemove(true)}
   />

   <Dialog open={confirmReplace} onOpenChange={setConfirmReplace}>
    <DialogContent className="max-w-md" showCloseButton={!isImporting}>
     <DialogHeader>
      <DialogTitle>{t("replaceTitle")}</DialogTitle>
      <DialogDescription>
       {t("replaceDescription", { name: attachment.file_name })}
      </DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <DialogClose asChild>
       <Button type="button" variant="outline">
        {common("actions.cancel")}
       </Button>
      </DialogClose>
      <Button
       type="button"
       disabled={isImporting}
       onClick={() => {
        setConfirmReplace(false);
        inputRef.current?.click();
       }}
      >
       <FileUp />
       {t("confirmReplace")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>

   <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
    <DialogContent className="max-w-md" showCloseButton={!isRemoving}>
     <DialogHeader>
      <DialogTitle>{t("removeTitle")}</DialogTitle>
      <DialogDescription>
       {t("removeDescription", { name: attachment.file_name })}
      </DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <DialogClose asChild>
       <Button type="button" variant="outline" disabled={isRemoving}>
        {common("actions.cancel")}
       </Button>
      </DialogClose>
      <Button
       type="button"
       variant="destructive"
       disabled={isRemoving}
       onClick={() => void remove()}
      >
       {isRemoving ? <Loader2 className="animate-spin" /> : <FileX />}
       {isRemoving ? t("removing") : t("confirmRemove")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
