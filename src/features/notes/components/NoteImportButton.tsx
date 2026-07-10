"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { normalizeImportedNotePayload } from "@/features/notes/note-export.schema";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { cn } from "@/lib/utils";

export function NoteImportButton({
 className,
 compactOnTablet = false,
}: {
 className?: string;
 compactOnTablet?: boolean;
}) {
 const fileInputRef = useRef<HTMLInputElement | null>(null);
 const router = useRouter();
 const createNoteMutation = useCreateNote();
 const focusModeEnabled = useFocusModeStore((s) => s.enabled);

 async function handleImport(file: File) {
  if (focusModeEnabled) {
   toast.warning("Focus mode đang bật. Không thể import thành ghi chú mới.");
   return;
  }

  try {
   const importedPayload = normalizeImportedNotePayload(JSON.parse(await file.text()));
   createNoteMutation.mutate(
    {
     title: importedPayload.note.title,
     tags: importedPayload.note.tags,
     category: importedPayload.note.category,
     content: importedPayload.note.content,
     readingContent: importedPayload.note.readingContent ?? null,
     splitViewEnabled: importedPayload.note.splitViewEnabled,
    },
    {
     onSuccess: (note) => {
      toast.success("Đã import ghi chú.");
      router.push(`/notes/${note.id}`);
     },
     onError: () => {
      toast.error("Không thể tạo ghi chú từ file import.");
     },
    },
   );
  } catch {
   toast.error("File import không đúng định dạng ghi chú.");
  } finally {
   if (fileInputRef.current) fileInputRef.current.value = "";
  }
 }

 return (
  <>
   <input
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
    size={compactOnTablet ? "icon-lg" : "lg"}
    onClick={() => fileInputRef.current?.click()}
    disabled={createNoteMutation.isPending || focusModeEnabled}
    aria-label="Import ghi chú"
    title="Import ghi chú"
    className={cn(compactOnTablet && "2xl:w-auto 2xl:px-3", className)}
   >
    <Upload className="h-4 w-4" />
    <span className={cn(compactOnTablet && "hidden 2xl:inline")}>Import</span>
   </Button>
  </>
 );
}
