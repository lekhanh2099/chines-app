"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import {
 useNoteFolderMutations,
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "@/features/notes/hooks/useNoteLibrary";
import { useClientSession } from "@/components/providers/QueryProvider";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { saveNoteDraft } from "@/features/notes/local/note-draft-store";
import { normalizeImportedNotePayload } from "@/features/notes/note-export.schema";
import { useRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/focus-mode-store";
import { noteTabsStore } from "@/stores/note-tabs-store";
import { splitViewStore } from "@/stores/split-view-store";
import type { JsonFieldValue, JsonObject } from "@/types/json";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
 mobileHeaderActionsContainer?: HTMLElement | null;
 desktopActionsContainer?: HTMLElement | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function createDownloadFileName(title: string): string {
 const slug = title
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64);

 return `${slug || "note"}.json`;
}

function downloadJsonFile(fileName: string, value: JsonFieldValue) {
 const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = fileName;
 document.body.appendChild(link);
 link.click();
 link.remove();
 URL.revokeObjectURL(url);
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
 const {
  note,
  isLoading,
  saveContent,
  isSaving,
  saveStatus,
  saveReadingContent,
  updateSplitView,
  updateTitle,
  updateCategory,
  deleteNote: deleteNoteMutation,
  isDeleting,
 } = useNoteDetail(noteId);

 const { closeTab, updateTabTitle } = noteTabsStore.actions;
 const { userId } = useClientSession();
 const [isDirty, setIsDirty] = useState(false);
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const noteFoldersQuery = useNoteFolders();
 const { createMutation: createFolderMutation } = useNoteFolderMutations();
 const updateLibraryMetadataMutation = useUpdateNoteLibraryMetadata();
 const activeNotes = useSelector(splitViewStore, (state) => state.activeNotes);
 const isSplitView = activeNotes[noteId] ?? false;
 const { toggleSplitView } = splitViewStore.actions;
 const router = useRouter();

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
 const [metadataOpen, setMetadataOpen] = useState(false);
 const [importedContent, setImportedContent] = useState<JsonObject | null>(null);
 const [importedReadingContent, setImportedReadingContent] = useState<
  JsonObject | null | undefined
 >(undefined);
 const isMobileViewport = useSyncExternalStore(
  subscribeToMobileViewport,
  getMobileViewportSnapshot,
  () => false,
 );
 const [readOnlyOverride, setReadOnlyOverride] = useState<boolean | null>(null);
 const isReadOnlyMode = readOnlyOverride ?? isMobileViewport;
 const [isToolbarVisible, setIsToolbarVisible] = useState(true);
 const [importVersion, setImportVersion] = useState(0);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const pendingContentRef = useRef<JsonObject>(null);
 const readingSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const pendingReadingRef = useRef<JsonObject>(null);
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

 const handleChange = useCallback(
  (json: JsonObject) => {
   pendingContentRef.current = json;
   setIsDirty(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, {
     content: json,
     readingContent: pendingReadingRef.current ?? note?.reading_content,
    });
   }
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   saveTimerRef.current = setTimeout(() => {
    if (pendingContentRef.current) {
     saveContent(pendingContentRef.current);
     pendingContentRef.current = null;
     setIsDirty(false);
    }
   }, 1000);
  },
  [note?.reading_content, noteId, saveContent, userId],
 );

 const handleReadingChange = useCallback(
  (json: JsonObject) => {
   pendingReadingRef.current = json;
   setIsDirty(true);
   if (userId) {
    void saveNoteDraft(userId, noteId, {
     content: pendingContentRef.current ?? note?.content ?? {},
     readingContent: json,
    });
   }
   if (readingSaveTimerRef.current) clearTimeout(readingSaveTimerRef.current);
   readingSaveTimerRef.current = setTimeout(() => {
    if (pendingReadingRef.current) {
     saveReadingContent(pendingReadingRef.current);
     pendingReadingRef.current = null;
     setIsDirty(false);
    }
   }, 1000);
  },
  [note?.content, noteId, saveReadingContent, userId],
 );

 useEffect(() => {
  const handleBeforeUnload = () => {
   if (pendingContentRef.current && userId) {
    void saveNoteDraft(userId, noteId, {
     content: pendingContentRef.current,
     readingContent: pendingReadingRef.current ?? note?.reading_content,
    });
   }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
 }, [note?.reading_content, noteId, userId]);

 const handleToggleSplitView = useCallback(() => {
  toggleSplitView(noteId);
  const nextState = !isSplitView;
  updateSplitView(nextState);
  toast.success(nextState ? t("splitEnabled") : t("splitDisabled"));
 }, [isSplitView, noteId, t, toggleSplitView, updateSplitView]);

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

 useEffect(() => {
  return () => {
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   if (pendingContentRef.current) saveContent(pendingContentRef.current);
   if (readingSaveTimerRef.current) clearTimeout(readingSaveTimerRef.current);
   if (pendingReadingRef.current) saveReadingContent(pendingReadingRef.current);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []); // oxlint-disable-line react-hooks-eslint/exhaustive-deps

 const handleDelete = useCallback(async () => {
  try {
   await deleteNoteMutation();
   toast.success(t("deleted"));
   setShowDeleteConfirm(false);
   closeTab(noteId);
  } catch {
   toast.error(t("deleteError"));
  }
 }, [closeTab, deleteNoteMutation, noteId, t]);

 const handleExport = useCallback(() => {
  if (!note) return;

  const folder = note.folder_id
   ? noteFoldersQuery.data?.find((item) => item.id === note.folder_id)
   : null;
  const parentFolder = folder?.parentId
   ? noteFoldersQuery.data?.find((item) => item.id === folder.parentId)
   : null;

  downloadJsonFile(createDownloadFileName(note.title), {
   version: 2,
   exportedAt: new Date().toISOString(),
   note: {
    title: note.title,
    tags: note.tags ?? [],
    category: note.category,
    content: importedContent ?? note.content,
    readingContent:
     importedReadingContent !== undefined ? importedReadingContent : note.reading_content,
    splitViewEnabled: note.split_view_enabled,
    readingStatus: note.reading_status,
    folder: folder
     ? {
        name: folder.name,
        parentName: parentFolder?.name ?? null,
        color: folder.color,
       }
     : null,
    source: note.source_url
     ? {
        url: note.source_url,
        host: note.source_host,
        label: note.source_label,
        author: note.source_author,
        publishedAt: note.source_published_at,
        capturedAt: note.source_captured_at,
       }
     : null,
   },
  });
  toast.success(t("exported"));
 }, [importedContent, importedReadingContent, note, noteFoldersQuery.data, t]);

 const currentNoteTitle = note?.title;
 const currentNoteCategory = note?.category;

 const handleImportFile = useCallback(
  async (file: File) => {
   try {
    const rawPayload: JsonFieldValue = JSON.parse(await file.text());
    const importedPayload = normalizeImportedNotePayload(rawPayload);
    const hasLibraryMetadata =
     typeof rawPayload === "object" &&
     rawPayload !== null &&
     "version" in rawPayload &&
     rawPayload.version === 2;
    const nextContent = importedPayload.note.content;
    const nextReadingContent = importedPayload.note.readingContent ?? null;

    setImportedContent(nextContent);
    setImportedReadingContent(nextReadingContent);
    setImportVersion((version) => version + 1);
    saveContent(nextContent);
    saveReadingContent(nextReadingContent);

    if (importedPayload.note.title && importedPayload.note.title !== currentNoteTitle) {
     updateTitle(importedPayload.note.title);
     updateTabTitle(noteId, importedPayload.note.title);
    }

    if (importedPayload.note.category && importedPayload.note.category !== currentNoteCategory) {
     updateCategory(importedPayload.note.category);
    }

    if (typeof importedPayload.note.splitViewEnabled === "boolean") {
     updateSplitView(importedPayload.note.splitViewEnabled);
    }

    if (hasLibraryMetadata) {
     let importedFolderId: string | null | undefined;
     if (importedPayload.note.folder) {
      const folderSpec = importedPayload.note.folder;
      let parentId: string | null = null;
      if (folderSpec.parentName) {
       const existingParent = noteFoldersQuery.data?.find(
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

      const existingFolder = noteFoldersQuery.data?.find(
       (folder) => folder.parentId === parentId && folder.name === folderSpec.name,
      );
      importedFolderId =
       existingFolder?.id ??
       (
        await createFolderMutation.mutateAsync({
         name: folderSpec.name,
         parentId,
         color: folderSpec.color,
        })
       ).id;
     } else if (importedPayload.note.folder === null) {
      importedFolderId = null;
     }

     await updateLibraryMetadataMutation.mutateAsync({
      noteId,
      folderId: importedFolderId,
      readingStatus: importedPayload.note.readingStatus ?? null,
      source: importedPayload.note.source ?? null,
     });
    }

    toast.success(t("imported"));
   } catch {
    toast.error(t("importError"));
   } finally {
    if (importInputRef.current) importInputRef.current.value = "";
   }
  },
  [
   createFolderMutation,
   currentNoteCategory,
   currentNoteTitle,
   noteFoldersQuery.data,
   noteId,
   saveContent,
   saveReadingContent,
   t,
   updateCategory,
   updateLibraryMetadataMutation,
   updateSplitView,
   updateTabTitle,
   updateTitle,
  ],
 );

 const displaySaveStatus: SaveStatus =
  isSaving || isDirty
   ? "saving"
   : saveStatus === "success"
     ? "saved"
     : saveStatus === "error"
       ? "error"
       : "idle";

 const noteContent = importedContent ?? note?.content ?? null;
 const readingContent =
  importedReadingContent !== undefined ? importedReadingContent : (note?.reading_content ?? null);
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
          <SaveStatusBadge status={displaySaveStatus} />
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
          <SaveStatusBadge status={displaySaveStatus} />
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
         disabled={isDeleting}
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
        readOnly={isReadOnlyMode}
        toolbarVisible={isToolbarVisible}
       />
      </div>
     ) : (
      <div className="note-editor-scroll p-0 sm:p-2 lg:p-4">
       <Editor
        key={`note-${importVersion}`}
        initialContent={noteContent}
        onChange={handleChange}
        readOnly={isReadOnlyMode}
        toolbarVisible={isToolbarVisible}
       />
      </div>
     )}
    </>
   )}
  </div>
 );
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
 const t = useTranslations("Notes.editor.save");
 if (status === "idle") return null;

 const config = {
  saving: {
   icon: <Cloud className="h-3.5 w-3.5 animate-pulse" />,
   label: t("saving"),
   className: "text-text-muted",
   visibility: "flex",
  },
  saved: {
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
  </div>
 );
}
