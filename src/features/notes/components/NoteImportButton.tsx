"use client";

import { useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { useImportNote } from "@/features/notes/hooks/useCreateNote";
import { isPdfFile } from "@/features/notes/pdf/note-pdf-file";
import { useImportPdfNote } from "@/features/notes/pdf/useImportPdfNote";
import { useNotePdfErrorMessage } from "@/features/notes/pdf/useNotePdfErrorMessage";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/shell/focus-mode-store";

/** Imports a note export (.json) or a PDF, each as a new note, then opens it. */
export function NoteImportButton({
 className,
 compactOnTablet = false,
}: {
 className?: string;
 compactOnTablet?: boolean;
}) {
 const t = useTranslations("Notes");
 const fileInputRef = useRef<HTMLInputElement>(null);
 const router = useRouter();
 const importMutation = useImportNote();
 const pdfImport = useImportPdfNote();
 const pdfErrorMessage = useNotePdfErrorMessage();
 const isImporting = importMutation.isPending || pdfImport.isPending;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 async function handleImport(file: File) {
  if (focusModeEnabled) {
   toast.warning(t("import.focusBlocked"));
   return;
  }

  if (isPdfFile(file)) {
   try {
    const note = await pdfImport.mutateAsync(file);
    toast.success(t("import.pdfSuccess"));
    router.push(`/notes/${note.id}`);
   } catch (error) {
    toast.error(pdfErrorMessage(error instanceof Error ? error : new Error(String(error))));
   } finally {
    if (fileInputRef.current) fileInputRef.current.value = "";
   }
   return;
  }

  try {
   const note = await importMutation.mutateAsync(file);
   toast.success(t("import.success"));
   router.push(`/notes/${note.id}`);
  } catch {
   toast.error(t("import.error"));
  } finally {
   if (fileInputRef.current) fileInputRef.current.value = "";
  }
 }

 return (
  <>
   <Input
    ref={fileInputRef}
    type="file"
    accept="application/json,.json,application/pdf,.pdf"
    className="hidden"
    onChange={(event) => {
     const [file] = Array.from(event.target.files ?? []);
     if (file) void handleImport(file);
    }}
   />
   <Button
    type="button"
    variant="outline"
    size={compactOnTablet ? "toolbar" : "lg"}
    onClick={() => fileInputRef.current?.click()}
    disabled={isImporting || focusModeEnabled}
    aria-label={t("import.label")}
    title={t("import.label")}
    className={className}
   >
    {pdfImport.isPending ? (
     <Loader2 data-icon="inline-start" className="animate-spin" />
    ) : (
     <Upload data-icon="inline-start" />
    )}
    <span className={cn(compactOnTablet && "hidden 2xl:inline")}>
     {pdfImport.isPending ? t("import.pdfImporting") : t("import.button")}
    </span>
   </Button>
  </>
 );
}
