"use client";

import { Label } from "@/components/ui/forms/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Bookmark, Trash2 } from "lucide-react";
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
} from "@/components/ui/overlays/dialog";
import { Editor } from "@/components/editor/Editor";
import { Typography } from "@/components/ui/display/typography";

import type { NoteDialogState, Nullable } from "./annotation-note-dialog-model";
import type { LessonTextAnnotation } from "./types";

export function LessonAnnotationNoteDialog({
 noteDialog,
 noteText,
 noteConflict,
 isMutating,
 onNoteTextChange,
 onDismiss,
 onDelete,
 onSave,
 onUseServer,
}: {
 noteDialog: Nullable<NoteDialogState>;
 noteText: string;
 noteConflict: Nullable<LessonTextAnnotation>;
 isMutating: boolean;
 onNoteTextChange: (value: string) => void;
 onDismiss: () => void;
 onDelete: () => Promise<void>;
 onSave: (resolveConflict?: boolean) => Promise<void>;
 onUseServer: () => void;
}) {
 const conflict = useTranslations("Notes.editor.conflict");

 return (
  <Dialog open={!!noteDialog} onOpenChange={(open) => !open && onDismiss()}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle icon={<Bookmark />}>Ghi chú đoạn đọc</DialogTitle>
     <DialogDescription>
      {noteDialog?.kind === "annotation"
       ? noteDialog.annotation.selectedText
       : noteDialog?.anchor.selectedText}
     </DialogDescription>
    </DialogHeader>
    <DialogBody>
     {noteConflict ? (
      <div role="alert" className="grid gap-3">
       <Typography tone="danger">{conflict("description")}</Typography>
       <Typography as="h3" variant="sectionTitle">
        {conflict("local")}
       </Typography>
       <Typography className="whitespace-pre-wrap">{noteText}</Typography>
       {noteConflict.note ? (
        <>
         <Typography as="h3" variant="sectionTitle">
          {conflict("serverTitle", {
           title: noteConflict.note.title,
           revision: noteConflict.note.revision,
          })}
         </Typography>
         <Editor
          key={`${noteConflict.note.id}:${noteConflict.note.revision}:content`}
          initialContent={noteConflict.note.content}
          readOnly
          toolbarVisible={false}
         />
         {noteConflict.note.reading_content ? (
          <Editor
           key={`${noteConflict.note.id}:${noteConflict.note.revision}:reading`}
           initialContent={noteConflict.note.reading_content}
           readOnly
           toolbarVisible={false}
          />
         ) : null}
        </>
       ) : null}
      </div>
     ) : null}
     <Label variant="label" tone="secondary" weight="bold" className="grid gap-2">
      Nội dung ghi chú
      <Textarea
       value={noteText}
       onChange={(event) => onNoteTextChange(event.target.value)}
       rows={6}
       autoFocus
       density="comfortable"
       className="w-full"
       placeholder="Điều cần nhớ về đoạn này…"
      />
     </Label>
    </DialogBody>
    <DialogFooter>
     {noteDialog?.kind === "annotation" ? (
      <Button variant="destructive" onClick={onDelete} disabled={isMutating || !!noteConflict}>
       <Trash2 />
       Xóa highlight
      </Button>
     ) : null}
     <div className="flex-1" />
     <DialogClose asChild>
      <Button variant="outline">Hủy</Button>
     </DialogClose>
     {noteConflict ? (
      <>
       <Button variant="outline" disabled={isMutating} onClick={onUseServer}>
        {conflict("useServer")}
       </Button>
       <Button
        disabled={!noteText.trim() || isMutating}
        onClick={() => {
         void onSave(true);
        }}
       >
        {conflict("keepLocal")}
       </Button>
      </>
     ) : (
      <Button
       onClick={() => {
        void onSave();
       }}
       disabled={!noteText.trim() || isMutating}
      >
       Lưu
      </Button>
     )}
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
