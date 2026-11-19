"use client";

import { useMemo, useState } from "react";
import { Columns2, GitCompareArrows } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
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
import { noteContentLines } from "@/features/notes/note-content-diff";
import { NoteContentDiff } from "./NoteContentDiff";

const conflictViewSchema = z.enum(["diff", "full"]);
type ConflictView = z.output<typeof conflictViewSchema>;

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
 const [view, setView] = useState<ConflictView>(conflictViewSchema.enum.diff);
 const serverLines = useMemo(() => noteContentLines(serverNote.content), [serverNote.content]);
 const serverReadingLines = useMemo(
  () => noteContentLines(serverNote.reading_content),
  [serverNote.reading_content],
 );
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
     <DialogBody className="grid gap-3">
      <SegmentedControl<ConflictView>
       className="w-auto justify-self-start"
       aria-label={t("viewLabel")}
       value={view}
       onChange={setView}
       items={[
        { key: "diff", label: t("diffView"), icon: GitCompareArrows },
        { key: "full", label: t("fullView"), icon: Columns2 },
       ]}
      />
      {view === "diff" ? (
       <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
         <Typography as="span" variant="caption" className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-success-subtle" />
          {t("legendLocal")}
         </Typography>
         <Typography as="span" variant="caption" className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-danger-subtle" />
          {t("legendServer")}
         </Typography>
        </div>
        {recoverableDrafts.length > 0 ? (
         recoverableDrafts.map((draft, index) => (
          <Card key={draft.key} padding="md" className="grid min-w-0 gap-3">
           <Typography as="h3" variant="sectionTitle">
            {t("comparedWithServer", { name: t("recoveryDraft", { number: index + 1 }) })}
           </Typography>
           <NoteContentDiff before={serverLines} after={noteContentLines(draft.content)} />
           {draft.readingContent ? (
            <>
             <Typography as="h4" variant="label" weight="bold">
              {t("readingContent")}
             </Typography>
             <NoteContentDiff
              before={serverReadingLines}
              after={noteContentLines(draft.readingContent)}
             />
            </>
           ) : null}
           <Button
            className="justify-self-start"
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
         <Card padding="md" className="grid min-w-0 gap-3">
          <Typography as="h3" variant="sectionTitle">
           {t("comparedWithServer", { name: t("local") })}
          </Typography>
          {localNote.title !== serverNote.title ? (
           <NoteContentDiff before={[serverNote.title]} after={[localNote.title]} />
          ) : null}
          <NoteContentDiff before={serverLines} after={noteContentLines(localNote.content)} />
          {localNote.reading_content || serverNote.reading_content ? (
           <>
            <Typography as="h4" variant="label" weight="bold">
             {t("readingContent")}
            </Typography>
            <NoteContentDiff
             before={serverReadingLines}
             after={noteContentLines(localNote.reading_content)}
            />
           </>
          ) : null}
         </Card>
        )}
       </div>
      ) : (
       <div className="grid gap-3 md:grid-cols-2">
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
       </div>
      )}
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
