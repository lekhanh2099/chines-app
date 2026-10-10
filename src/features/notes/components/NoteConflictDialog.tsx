"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import type { NoteDetail } from "@/services/notes/notes.service";
import type { NoteDraftRecord } from "@/features/notes/local/note-draft-store";

export function NoteConflictDialog({
 localNote,
 serverNote,
 onResolve,
 recoverableDrafts,
 onRecover,
}: {
 localNote: NoteDetail;
 serverNote: NoteDetail;
 onResolve: (useServer: boolean) => Promise<void>;
 recoverableDrafts: NoteDraftRecord[];
 onRecover: (draft: NoteDraftRecord) => Promise<void>;
}) {
 const t = useTranslations("Notes.editor.conflict");
 const [open, setOpen] = useState(true);
 const [resolving, setResolving] = useState(false);
 const resolve = async (useServer: boolean) => {
  setResolving(true);
  try {
   await onResolve(useServer);
  } catch {
   toast.error(t("error"));
  } finally {
   setResolving(false);
  }
 };
 const recover = async (draft: NoteDraftRecord) => {
  setResolving(true);
  try {
   await onRecover(draft);
  } catch {
   toast.error(t("error"));
  } finally {
   setResolving(false);
  }
 };
 return (
  <>
   <div role="alert" className="flex flex-wrap items-center gap-2 p-3">
    <Typography variant="bodySmall" tone="danger">
     {t("description")}
    </Typography>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
     {t("review")}
    </Button>
   </div>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent size="xl">
     <DialogHeader>
      <DialogTitle>{recoverableDrafts.length > 0 ? t("recoveryTitle") : t("title")}</DialogTitle>
      <DialogDescription>{t("description")}</DialogDescription>
     </DialogHeader>
     <DialogBody className="grid gap-3 md:grid-cols-2">
      {recoverableDrafts.length > 0 ? (
       recoverableDrafts.map((draft, index) => (
        <Card key={draft.key} padding="md" className="min-w-0">
         <Typography as="h3" variant="sectionTitle">
          {t("recoveryDraft", { number: index + 1 })}
         </Typography>
         {draft.content ? (
          <Editor initialContent={draft.content} readOnly toolbarVisible={false} />
         ) : null}
         {draft.readingContent ? (
          <Editor initialContent={draft.readingContent} readOnly toolbarVisible={false} />
         ) : null}
         <Button
          disabled={resolving}
          onClick={() => {
           void recover(draft);
          }}
         >
          {t("recover")}
         </Button>
        </Card>
       ))
      ) : (
       <>
        <Card padding="md" className="min-w-0">
         <Typography as="h3" variant="sectionTitle">
          {t("local")}
         </Typography>
         <Typography variant="bodySmall">{localNote.title}</Typography>
         <Editor initialContent={localNote.content} readOnly toolbarVisible={false} />
         {localNote.reading_content ? (
          <Editor initialContent={localNote.reading_content} readOnly toolbarVisible={false} />
         ) : null}
        </Card>
       </>
      )}
      <Card padding="md" className="min-w-0">
       <Typography as="h3" variant="sectionTitle">
        {t("serverTitle", { title: serverNote.title, revision: serverNote.revision })}
       </Typography>
       <Editor initialContent={serverNote.content} readOnly toolbarVisible={false} />
       {serverNote.reading_content ? (
        <Editor initialContent={serverNote.reading_content} readOnly toolbarVisible={false} />
       ) : null}
      </Card>
     </DialogBody>
     <DialogFooter>
      <Button
       variant="outline"
       disabled={resolving}
       onClick={() => {
        void resolve(true);
       }}
      >
       {t("useServer")}
      </Button>
      <Button
       disabled={resolving || recoverableDrafts.length > 0}
       onClick={() => {
        void resolve(false);
       }}
      >
       {t("keepLocal")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
