"use client";

import { useRef } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ActionCard } from "@/components/ui/actions/action-card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Input } from "@/components/ui/forms/input";
import { Typography } from "@/components/ui/display/typography";
import { useImportPdfNote } from "@/features/notes/pdf/useImportPdfNote";
import { useNotePdfErrorMessage } from "@/features/notes/pdf/useNotePdfErrorMessage";
import { useRouter } from "@/i18n/navigation";

/** First tile of the notes grid: pick a PDF and open it as a new note. */
export function NotePdfImportTile() {
 const t = useTranslations("Notes");
 const inputRef = useRef<HTMLInputElement>(null);
 const router = useRouter();
 const pdfImport = useImportPdfNote();
 const errorMessage = useNotePdfErrorMessage();

 const importFile = async (file: File) => {
  try {
   const note = await pdfImport.mutateAsync(file);
   toast.success(t("import.pdfSuccess"));
   router.push(`/notes/${note.id}`);
  } catch (error) {
   toast.error(errorMessage(error instanceof Error ? error : new Error(String(error))));
  } finally {
   if (inputRef.current) inputRef.current.value = "";
  }
 };

 return (
  <div className="grid min-w-0 content-start gap-2">
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
   <ActionCard
    disabled={pdfImport.isPending}
    onClick={() => inputRef.current?.click()}
    className="grid aspect-[3/4] place-content-center justify-items-center gap-3"
   >
    <IconTile tone="accent" size="lg">
     {pdfImport.isPending ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
    </IconTile>
    <Typography as="span" variant="bodySmall" weight="bold" tone="accent">
     {pdfImport.isPending ? t("import.pdfImporting") : t("grid.addPdf")}
    </Typography>
   </ActionCard>
   <Typography as="p" variant="caption" tone="muted" className="px-0.5">
    {t("grid.addPdfHint")}
   </Typography>
  </div>
 );
}
