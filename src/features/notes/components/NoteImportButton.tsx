"use client";

import { useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { useImportNote } from "@/features/notes/hooks/useCreateNote";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/shell/focus-mode-store";

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
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 async function handleImport(file: File) {
  if (focusModeEnabled) {
   toast.warning(t("import.focusBlocked"));
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
    accept="application/json,.json"
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
    disabled={importMutation.isPending || focusModeEnabled}
    aria-label={t("import.label")}
    title={t("import.label")}
    className={className}
   >
    <Upload data-icon="inline-start" />
    <span className={cn(compactOnTablet && "hidden 2xl:inline")}>{t("import.button")}</span>
   </Button>
  </>
 );
}
