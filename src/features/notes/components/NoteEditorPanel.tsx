"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useSelector } from "@tanstack/react-store";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { NoteConflictDialog } from "@/features/notes/components/NoteConflictDialog";
import { useNoteEditor } from "@/features/notes/hooks/useNoteEditor";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { NoteEditorDeleteDialog } from "./NoteEditorDeleteDialog";
import { NoteEditorDesktopActions } from "./NoteEditorDesktopActions";
import { NoteEditorMobileActionsSheet } from "./NoteEditorMobileActionsSheet";
import { SaveStatusBadge } from "./NoteEditorSaveStatusBadge";
import { useNoteEditorPanelSync } from "./useNoteEditorPanelSync";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
 mobileHeaderActionsContainer?: HTMLElement | null;
 desktopActionsContainer?: HTMLElement | null;
}

const mobileReadOnlyQuery = "(max-width: 767px)";

function subscribeToMobileViewport(onChange: () => void) {
 const media = window.matchMedia(mobileReadOnlyQuery);
 media.addEventListener("change", onChange);
 return () => media.removeEventListener("change", onChange);
}

function getMobileViewportSnapshot() {
 return window.matchMedia(mobileReadOnlyQuery).matches;
}

export function NoteEditorPanel({
 noteId,
 isVisible,
 mobileHeaderActionsContainer,
 desktopActionsContainer,
}: NoteEditorPanelProps) {
 const t = useTranslations("Notes.editor");
 const common = useTranslations("Common");
 const notesLabels = useTranslations("Notes");
 const {
  note,
  isLoading,
  error,
  refetch,
  handleChange,
  handleReadingChange,
  importNote,
  exportNote,
  retrySave,
  conflict,
  resolveConflict,
  recoverableDrafts,
  recoverDraft,
  isImporting,
  importVersion,
  noteContent,
  readingContent,
  displaySaveStatus,
  updateSplitView,
  deleteNote: deleteNoteMutation,
  isDeleting,
 } = useNoteEditor(noteId);

 const { closeTab } = noteTabsStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
 const [metadataOpen, setMetadataOpen] = useState(false);
 const isMobileViewport = useSyncExternalStore(
  subscribeToMobileViewport,
  getMobileViewportSnapshot,
  () => false,
 );
 const [readOnlyOverride, setReadOnlyOverride] = useState<boolean | null>(null);
 const isReadOnlyMode = readOnlyOverride ?? isMobileViewport;
 const [isToolbarVisible, setIsToolbarVisible] = useState(true);
 const importInputRef = useRef<HTMLInputElement>(null);
 const mobileActionsTriggerRef = useRef<HTMLButtonElement>(null);
 const { isSplitView, handleToggleSplitView } = useNoteEditorPanelSync({
  noteId,
  isVisible,
  note,
  isImporting,
  updateSplitView,
 });

 const handleDelete = useCallback(async () => {
  if (isImporting) return;
  try {
   await deleteNoteMutation();
   toast.success(t("deleted"));
   setShowDeleteConfirm(false);
   closeTab(noteId);
  } catch {
   toast.error(t("deleteError"));
  }
 }, [closeTab, deleteNoteMutation, isImporting, noteId, t]);

 const handleExport = useCallback(() => {
  try {
   exportNote();
   toast.success(t("exported"));
  } catch {
   toast.error(t("save.error"));
  }
 }, [exportNote, t]);

 const handleImportFile = useCallback(
  async (file: File) => {
   if (isImporting) return;
   try {
    await importNote(file);
    toast.success(t("imported"));
   } catch {
    toast.error(t("importError"));
   } finally {
    if (importInputRef.current) importInputRef.current.value = "";
   }
  },
  [importNote, isImporting, t],
 );

 const handleRetrySave = () => {
  void retrySave().catch(() => toast.error(t("save.error")));
 };

 return (
  <div
   className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg-primary"
   style={{ display: isVisible ? "flex" : "none" }}
  >
   {isLoading ? (
    <NoteEditorSkeleton splitView={isSplitView} />
   ) : error ? (
    <QueryErrorCard
     title={notesLabels("loadError.title")}
     description={notesLabels("loadError.description")}
     retryLabel={common("actions.retry")}
     onRetry={() => {
      void refetch();
     }}
    />
   ) : !note ? (
    <div className="flex h-full items-center justify-center">
     <Typography as="p" tone="muted">
      {t("notFound")}
     </Typography>
    </div>
   ) : (
    <>
     {conflict ? (
      <NoteConflictDialog
       localNote={note}
       serverNote={conflict}
       onResolve={resolveConflict}
       recoverableDrafts={recoverableDrafts}
       onRecover={recoverDraft}
      />
     ) : null}
     <Input
      ref={importInputRef}
      type="file"
      accept="application/json,.json"
      className="hidden"
      onChange={(event) => {
       const [file] = Array.from(event.target.files ?? []);
       if (file) void handleImportFile(file);
      }}
     />

     {mobileHeaderActionsContainer && isVisible
      ? createPortal(
         <div className="flex items-center gap-0.5 xl:hidden">
          <SaveStatusBadge status={displaySaveStatus} onRetry={handleRetrySave} />
          <Button
           type="button"
           variant="ghost"
           size="icon"
           className="shrink-0 xl:hidden"
           ref={mobileActionsTriggerRef}
           aria-label={t("options")}
           title={t("options")}
           aria-haspopup="dialog"
           aria-expanded={mobileActionsOpen}
           onClick={() => setMobileActionsOpen(true)}
          >
           <SlidersHorizontal />
          </Button>
         </div>,
         mobileHeaderActionsContainer,
        )
      : null}

     {desktopActionsContainer && isVisible
      ? createPortal(
         <NoteEditorDesktopActions
          note={note}
          displaySaveStatus={displaySaveStatus}
          handleRetrySave={handleRetrySave}
          importInputRef={importInputRef}
          isReadOnlyMode={isReadOnlyMode}
          setReadOnlyOverride={setReadOnlyOverride}
          isToolbarVisible={isToolbarVisible}
          setIsToolbarVisible={setIsToolbarVisible}
          isSplitView={isSplitView}
          handleToggleSplitView={handleToggleSplitView}
          isImporting={isImporting}
          handleExport={handleExport}
          setShowDeleteConfirm={setShowDeleteConfirm}
         />,
         desktopActionsContainer,
        )
      : null}

     <NoteEditorMobileActionsSheet
      noteId={noteId}
      mobileActionsOpen={mobileActionsOpen}
      setMobileActionsOpen={setMobileActionsOpen}
      mobileActionsTriggerRef={mobileActionsTriggerRef}
      importInputRef={importInputRef}
      isReadOnlyMode={isReadOnlyMode}
      setReadOnlyOverride={setReadOnlyOverride}
      isSplitView={isSplitView}
      handleToggleSplitView={handleToggleSplitView}
      isToolbarVisible={isToolbarVisible}
      setIsToolbarVisible={setIsToolbarVisible}
      setMetadataOpen={setMetadataOpen}
      setShowDeleteConfirm={setShowDeleteConfirm}
      isImporting={isImporting}
      focusModeEnabled={focusModeEnabled}
      handleExport={handleExport}
     />

     {metadataOpen ? (
      <NoteLibraryMetadataDialog note={note} open onOpenChange={setMetadataOpen} hideTrigger />
     ) : null}

     <NoteEditorDeleteDialog
      noteTitle={note.title}
      showDeleteConfirm={showDeleteConfirm}
      setShowDeleteConfirm={setShowDeleteConfirm}
      isDeleting={isDeleting}
      isImporting={isImporting}
      handleDelete={handleDelete}
     />

     {isSplitView ? (
      <div className="note-editor-split-panel min-h-0 flex-1 overflow-hidden p-0 sm:p-2 lg:p-4">
       <SplitViewEditor
        key={`split-${importVersion}`}
        noteId={noteId}
        noteContent={noteContent}
        readingContent={readingContent}
        onNoteChange={handleChange}
        onReadingChange={handleReadingChange}
        readOnly={isReadOnlyMode || isImporting}
        toolbarVisible={isToolbarVisible}
       />
      </div>
     ) : (
      <div className="note-editor-scroll p-0 sm:p-2 lg:p-4">
       <Editor
        key={`note-${importVersion}`}
        initialContent={noteContent}
        onChange={handleChange}
        readOnly={isReadOnlyMode || isImporting}
        toolbarVisible={isToolbarVisible}
       />
      </div>
     )}
    </>
   )}
  </div>
 );
}
