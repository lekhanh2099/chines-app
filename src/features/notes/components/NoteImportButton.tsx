"use client";

import { useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useNoteFolderMutations, useNoteFolders } from "@/features/notes/hooks/useNoteLibrary";
import { normalizeImportedNotePayload } from "@/features/notes/note-export.schema";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NoteFolder } from "@/services/notes.service";
import { focusModeStore } from "@/stores/focus-mode-store";

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
 const createNoteMutation = useCreateNote();
 const foldersQuery = useNoteFolders();
 const { createMutation: createFolderMutation } = useNoteFolderMutations();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 async function handleImport(file: File) {
  if (focusModeEnabled) {
   toast.warning(t("import.focusBlocked"));
   return;
  }

  try {
   const importedPayload = normalizeImportedNotePayload(JSON.parse(await file.text()));
   let folderId: NoteFolder["id"] | null = null;
   if (importedPayload.note.folder) {
    const folderSpec = importedPayload.note.folder;
    let parentId: NoteFolder["parentId"] = null;
    if (folderSpec.parentName) {
     const existingParent = foldersQuery.data?.find(
      (folder) => folder.parentId === null && folder.name === folderSpec.parentName,
     );
     parentId =
      existingParent?.id ??
      (
       await createFolderMutation.mutateAsync({
        name: folderSpec.parentName,
        color: folderSpec.color,
       })
      ).id;
    }

    const existingFolder = foldersQuery.data?.find(
     (folder) => folder.parentId === parentId && folder.name === folderSpec.name,
    );
    folderId =
     existingFolder?.id ??
     (
      await createFolderMutation.mutateAsync({
       name: folderSpec.name,
       parentId,
       color: folderSpec.color,
      })
     ).id;
   }

   const note = await createNoteMutation.mutateAsync({
    title: importedPayload.note.title,
    tags: importedPayload.note.tags,
    category: importedPayload.note.category,
    content: importedPayload.note.content,
    readingContent: importedPayload.note.readingContent ?? null,
    splitViewEnabled: importedPayload.note.splitViewEnabled,
    folderId,
    readingStatus: importedPayload.note.readingStatus ?? null,
    source: importedPayload.note.source ?? null,
   });
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
    disabled={createNoteMutation.isPending || focusModeEnabled}
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
