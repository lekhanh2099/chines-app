"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MutationStatus } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { createPortal } from "react-dom";
import {
 Check,
 Cloud,
 CloudOff,
 Download,
 Eye,
 Loader2,
 PanelLeft,
 PanelLeftClose,
 PanelTopClose,
 PanelTopOpen,
 Pencil,
 Plus,
 Settings2,
 SlidersHorizontal,
 Trash2,
 Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Input } from "@/components/ui/forms/input";
import { Separator } from "@/components/ui/layout/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { useNoteEditor } from "@/features/notes/hooks/useNoteEditor";
import { useRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { selectNoteSplitView, splitViewStore } from "@/stores/notes/split-view-store";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
 mobileHeaderActionsContainer?: HTMLElement | null;
 desktopActionsContainer?: HTMLElement | null;
}

const noteEditorActionButtonClassName = "shrink-0 rounded-full";
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
  isImporting,
  importVersion,
  noteContent,
  readingContent,
  displaySaveStatus,
  updateSplitView,
  deleteNote: deleteNoteMutation,
  isDeleting,
 } = useNoteEditor(noteId);

 const { closeTab, updateTabTitle } = noteTabsStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const isSplitView = useSelector(splitViewStore, selectNoteSplitView(noteId));
 const { toggleSplitView } = splitViewStore.actions;
 const router = useRouter();

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
 const splitViewSynced = useRef(false);

 useEffect(() => {
  if (note?.title) {
   updateTabTitle(noteId, note.title);
  }
 }, [note?.title, noteId, updateTabTitle]);

 const { setSplitView } = splitViewStore.actions;
 useEffect(() => {
  if (note && !splitViewSynced.current) {
   if (note.split_view_enabled) {
    setSplitView(noteId, true);
   }
   splitViewSynced.current = true;
  }
 }, [note, noteId, setSplitView]);

 const handleToggleSplitView = useCallback(() => {
  if (isImporting) return;
  toggleSplitView(noteId);
  const nextState = !isSplitView;
  void updateSplitView(nextState).then(
   () => toast.success(nextState ? t("splitEnabled") : t("splitDisabled")),
   () => {
    toast.error(t("save.error"));
   },
  );
 }, [isImporting, isSplitView, noteId, t, toggleSplitView, updateSplitView]);

 useEffect(() => {
  const handler = (event: KeyboardEvent) => {
   if (event.ctrlKey && event.shiftKey && event.key === "S" && isVisible) {
    event.preventDefault();
    handleToggleSplitView();
   }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [handleToggleSplitView, isVisible]);

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
 const editModeLabel = isReadOnlyMode ? t("editMode") : t("viewMode");
 const toolbarLabel = isToolbarVisible ? t("hideToolbar") : t("showToolbar");
 const splitLabel = isSplitView ? t("disableSplit") : t("enableSplit");
 const splitTitle = isSplitView ? t("disableSplitShortcut") : t("enableSplitShortcut");

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
         <div className="hidden min-w-max items-center gap-2 xl:flex">
          <SaveStatusBadge status={displaySaveStatus} onRetry={handleRetrySave} />
          <Button
           type="button"
           variant={!isReadOnlyMode ? "active" : "outline"}
           size="icon-sm"
           onClick={() => setReadOnlyOverride(!isReadOnlyMode)}
           title={editModeLabel}
           aria-label={editModeLabel}
           className={noteEditorActionButtonClassName}
          >
           {isReadOnlyMode ? <Eye /> : <Pencil />}
          </Button>
          {!isReadOnlyMode ? (
           <Button
            type="button"
            variant={isToolbarVisible ? "active" : "outline"}
            size="icon-sm"
            onClick={() => setIsToolbarVisible((current) => !current)}
            title={toolbarLabel}
            aria-label={toolbarLabel}
            className={noteEditorActionButtonClassName}
           >
            {isToolbarVisible ? <PanelTopClose /> : <PanelTopOpen />}
           </Button>
          ) : null}
          <Button
           type="button"
           variant={isSplitView ? "active" : "outline"}
           size="icon-sm"
           disabled={isImporting}
           onClick={handleToggleSplitView}
           title={splitTitle}
           aria-label={splitLabel}
           className={noteEditorActionButtonClassName}
          >
           {isSplitView ? <PanelLeftClose /> : <PanelLeft />}
          </Button>
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           disabled={isImporting}
           onClick={() => importInputRef.current?.click()}
           title={t("import")}
           aria-label={t("import")}
           className="hidden shrink-0 xl:inline-flex"
          >
           <Upload />
          </Button>
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           onClick={handleExport}
           title={t("export")}
           aria-label={t("export")}
           className="hidden shrink-0 xl:inline-flex"
          >
           <Download />
          </Button>
          <NoteLibraryMetadataDialog note={note} />
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           title={t("delete")}
           aria-label={t("delete")}
           className="shrink-0"
           onClick={() => setShowDeleteConfirm(true)}
          >
           <Trash2 />
          </Button>
         </div>,
         desktopActionsContainer,
        )
      : null}

     <Sheet
      open={mobileActionsOpen}
      onOpenChange={setMobileActionsOpen}
      side="bottom"
      height="tall"
     >
      <SheetHeader title={t("options")} onClose={() => setMobileActionsOpen(false)} />
      <SheetBody className="grid content-start gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
       <section className="grid gap-1">
        <Typography
         as="h3"
         variant="overline"
         tone="muted"
         weight="black"
         transform="uppercase"
         className="px-2.5"
        >
         {t("readMode")}
        </Typography>
        <Button
         type="button"
         variant={!isReadOnlyMode ? "active" : "menu"}
         size="touch"
         align="start"
         className="w-full"
         onClick={() => {
          setReadOnlyOverride(!isReadOnlyMode);
          setMobileActionsOpen(false);
         }}
        >
         {isReadOnlyMode ? <Pencil data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
         {isReadOnlyMode ? t("editMode") : t("viewModeAction")}
        </Button>
        <Button
         type="button"
         variant={isSplitView ? "active" : "menu"}
         size="touch"
         align="start"
         className="w-full"
         onClick={() => {
          handleToggleSplitView();
          setMobileActionsOpen(false);
         }}
        >
         {isSplitView ? (
          <PanelLeftClose data-icon="inline-start" />
         ) : (
          <PanelLeft data-icon="inline-start" />
         )}
         {isSplitView ? t("closeSplit") : t("openSplit")}
        </Button>
        {!isReadOnlyMode ? (
         <Button
          type="button"
          variant={isToolbarVisible ? "active" : "menu"}
          size="touch"
          align="start"
          className="w-full"
          onClick={() => {
           setIsToolbarVisible((current) => !current);
           setMobileActionsOpen(false);
          }}
         >
          {isToolbarVisible ? (
           <PanelTopClose data-icon="inline-start" />
          ) : (
           <PanelTopOpen data-icon="inline-start" />
          )}
          {toolbarLabel}
         </Button>
        ) : null}
       </section>

       <Separator />

       <section className="grid gap-1">
        <Typography
         as="h3"
         variant="overline"
         tone="muted"
         weight="black"
         transform="uppercase"
         className="px-2.5"
        >
         {t("noteSection")}
        </Typography>
        <Button
         type="button"
         variant="menu"
         size="touch"
         align="start"
         className="w-full"
         onClick={() => {
          setMobileActionsOpen(false);
          requestAnimationFrame(() => setMetadataOpen(true));
         }}
        >
         <Settings2 data-icon="inline-start" />
         {t("metadata")}
        </Button>
        <Button
         type="button"
         variant="menu"
         size="touch"
         align="start"
         className="w-full"
         disabled={isImporting}
         onClick={() => {
          setMobileActionsOpen(false);
          requestAnimationFrame(() => importInputRef.current?.click());
         }}
        >
         <Upload data-icon="inline-start" />
         {t("importAction")}
        </Button>
        <Button
         type="button"
         variant="menu"
         size="touch"
         align="start"
         className="w-full"
         onClick={() => {
          handleExport();
          setMobileActionsOpen(false);
         }}
        >
         <Download data-icon="inline-start" />
         {t("exportAction")}
        </Button>
        <Button
         type="button"
         variant="menu"
         size="touch"
         align="start"
         className="w-full"
         disabled={focusModeEnabled}
         onClick={() => {
          setMobileActionsOpen(false);
          router.push("/notes?action=new");
         }}
        >
         <Plus data-icon="inline-start" />
         {t("openNew")}
        </Button>
        <Button
         type="button"
         variant="menu"
         size="touch"
         align="start"
         className="w-full"
         disabled={focusModeEnabled}
         onClick={() => {
          closeTab(noteId);
          setMobileActionsOpen(false);
         }}
        >
         <PanelLeftClose data-icon="inline-start" />
         {t("closeCurrentTab")}
        </Button>
        <Button
         type="button"
         variant="menuDestructive"
         size="touch"
         align="start"
         className="w-full"
         onClick={() => {
          setMobileActionsOpen(false);
          requestAnimationFrame(() => setShowDeleteConfirm(true));
         }}
        >
         <Trash2 data-icon="inline-start" />
         {t("delete")}
        </Button>
       </section>
      </SheetBody>
     </Sheet>

     {metadataOpen ? (
      <NoteLibraryMetadataDialog note={note} open onOpenChange={setMetadataOpen} hideTrigger />
     ) : null}

     <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <DialogContent className="max-w-md" showCloseButton={!isDeleting}>
       <DialogHeader>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogDescription>{t("deleteDescription", { title: note.title })}</DialogDescription>
       </DialogHeader>
       <DialogFooter>
        <DialogClose asChild>
         <Button type="button" variant="outline" disabled={isDeleting}>
          {common("actions.cancel")}
         </Button>
        </DialogClose>
        <Button
         type="button"
         variant="destructive"
         disabled={isDeleting || isImporting}
         onClick={() => void handleDelete()}
        >
         {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
         {isDeleting ? t("deleting") : t("delete")}
        </Button>
       </DialogFooter>
      </DialogContent>
     </Dialog>

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

function SaveStatusBadge({ status, onRetry }: { status: MutationStatus; onRetry: () => void }) {
 const t = useTranslations("Notes.editor.save");
 const common = useTranslations("Common");
 if (status === "idle") return null;

 const config = {
  pending: {
   icon: <Cloud className="h-3.5 w-3.5 animate-pulse" />,
   label: t("saving"),
   className: "text-text-muted",
   visibility: "flex",
  },
  success: {
   icon: <Check className="h-3.5 w-3.5" />,
   label: t("saved"),
   className: "text-success",
   visibility: "hidden sm:flex",
  },
  error: {
   icon: <CloudOff className="h-3.5 w-3.5" />,
   label: t("error"),
   className: "text-danger",
   visibility: "flex",
  },
 };

 const current = config[status];

 return (
  <div
   className={`${current.visibility} h-9 items-center gap-1.5 rounded-xl px-1 text-xs font-medium ${current.className} animate-in fade-in xl:px-2`}
   title={current.label}
   aria-label={current.label}
  >
   {current.icon}
   <span className="hidden xl:inline">{current.label}</span>
   {status === "error" ? (
    <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
     {common("actions.retry")}
    </Button>
   ) : null}
  </div>
 );
}
