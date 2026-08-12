"use client";

import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { JsonObjectSchema, type JsonFieldValue, type JsonObject } from "@/types/json";
import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from "react";
import { useSelector } from "@tanstack/react-store";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { toast } from "sonner";
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
 SlidersHorizontal,
 Trash2,
 Upload,
} from "lucide-react";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { normalizeImportedNotePayload } from "@/features/notes/note-export.schema";
import { noteTabsStore } from "@/stores/note-tabs-store";
import { splitViewStore } from "@/stores/split-view-store";
import { Button } from "@/components/ui/button";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { focusModeStore } from "@/stores/focus-mode-store";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { z } from "zod";
import {
 useNoteFolderMutations,
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "@/features/notes/hooks/useNoteLibrary";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
 mobileHeaderActionsContainer?: ReturnType<Document["getElementById"]>;
 desktopActionsContainer?: ReturnType<Document["getElementById"]>;
}

const SaveStatusSchema = z.enum(["idle", "saving", "saved", "error"]);

function createDownloadFileName(title: string): string {
 const slug = title
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64);

 return `${slug || "ghi-chu"}.json`;
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
 const [importedContent, setImportedContent] =
  useState<z.infer<z.ZodNullable<typeof JsonObjectSchema>>>(null);
 const [importedReadingContent, setImportedReadingContent] =
  useState<z.infer<z.ZodOptional<z.ZodNullable<typeof JsonObjectSchema>>>>(undefined);
 const isMobileViewport = useSyncExternalStore(
  subscribeToMobileViewport,
  getMobileViewportSnapshot,
  () => false,
 );
 const [readOnlyOverride, setReadOnlyOverride] =
  useState<z.infer<z.ZodNullable<z.ZodBoolean>>>(null);
 const isReadOnlyMode = readOnlyOverride ?? isMobileViewport;
 const [isToolbarVisible, setIsToolbarVisible] = useState(true);
 const [importVersion, setImportVersion] = useState(0);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const pendingContentRef = useRef<JsonObject>(null);
 const readingSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
 const pendingReadingRef = useRef<JsonObject>(null);
 const importInputRef = useRef<HTMLInputElement>(null);
 const splitViewSynced = useRef(false);

 // Sync tab title with note title
 useEffect(() => {
  if (note?.title) {
   updateTabTitle(noteId, note.title);
  }
 }, [note?.title, noteId, updateTabTitle]);

 // Sync split view state from DB on initial load
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
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   saveTimerRef.current = setTimeout(() => {
    if (pendingContentRef.current) {
     saveContent(pendingContentRef.current);
     pendingContentRef.current = null;
    }
   }, 1000);
  },
  [saveContent],
 );

 const handleReadingChange = useCallback(
  (json: JsonObject) => {
   pendingReadingRef.current = json;
   if (readingSaveTimerRef.current) clearTimeout(readingSaveTimerRef.current);
   readingSaveTimerRef.current = setTimeout(() => {
    if (pendingReadingRef.current) {
     saveReadingContent(pendingReadingRef.current);
     pendingReadingRef.current = null;
    }
   }, 1000);
  },
  [saveReadingContent],
 );

 const handleToggleSplitView = useCallback(() => {
  toggleSplitView(noteId);
  const newState = !isSplitView;
  updateSplitView(newState);
  toast.success(newState ? "Đã bật chế độ Split View" : "Đã tắt Split View");
 }, [noteId, isSplitView, toggleSplitView, updateSplitView]);

 // Keyboard shortcut: Ctrl+Shift+S to toggle split view
 useEffect(() => {
  const handler = (e: KeyboardEvent) => {
   if (e.ctrlKey && e.shiftKey && e.key === "S" && isVisible) {
    e.preventDefault();
    handleToggleSplitView();
   }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
 }, [handleToggleSplitView, isVisible]);

 // Flush on unmount
 useEffect(() => {
  return () => {
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   if (pendingContentRef.current) {
    saveContent(pendingContentRef.current);
   }
   if (readingSaveTimerRef.current) clearTimeout(readingSaveTimerRef.current);
   if (pendingReadingRef.current) {
    saveReadingContent(pendingReadingRef.current);
   }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const handleDelete = useCallback(async () => {
  try {
   await deleteNoteMutation();
   toast.success("Đã xoá ghi chú.");
   setShowDeleteConfirm(false);
   closeTab(noteId);
  } catch {
   toast.error("Không thể xóa ghi chú.");
  }
 }, [deleteNoteMutation, closeTab, noteId]);

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
  toast.success("Đã export ghi chú.");
 }, [importedContent, importedReadingContent, note, noteFoldersQuery.data]);

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
     let importedFolderId: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
     if (importedPayload.note.folder) {
      const folderSpec = importedPayload.note.folder;
      let parentId: z.infer<z.ZodNullable<z.ZodString>> = null;
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

    toast.success("Đã import vào ghi chú hiện tại.");
   } catch {
    toast.error("File import không đúng định dạng ghi chú.");
   } finally {
    if (importInputRef.current) importInputRef.current.value = "";
   }
  },
  [
   currentNoteCategory,
   currentNoteTitle,
   noteId,
   saveContent,
   saveReadingContent,
   updateCategory,
   createFolderMutation,
   noteFoldersQuery.data,
   updateLibraryMetadataMutation,
   updateSplitView,
   updateTabTitle,
   updateTitle,
  ],
 );

 const displaySaveStatus: z.infer<typeof SaveStatusSchema> = isSaving
  ? SaveStatusSchema.enum.saving
  : saveStatus === "success"
    ? "saved"
    : saveStatus === "error"
      ? "error"
      : "idle";

 const noteContent = importedContent ?? note?.content ?? null;
 const readingContent =
  importedReadingContent !== undefined ? importedReadingContent : (note?.reading_content ?? null);

 return (
  <div
   className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg-primary"
   style={{ display: isVisible ? "flex" : "none" }}
  >
   {isLoading ? (
    <NoteEditorSkeleton />
   ) : !note ? (
    <div className="flex h-full items-center justify-center">
     <Typography as="p" tone="muted">
      Không tìm thấy ghi chú.
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
         <div className="flex items-center gap-1.5 xl:hidden">
          <SaveStatusBadge status={displaySaveStatus} />

          <Popover.Root open={mobileActionsOpen} onOpenChange={setMobileActionsOpen} modal={false}>
           <Popover.Trigger
            render={
             <Button
              variant="outline"
              size="icon-round"
              className="shrink-0 xl:hidden"
              aria-label="Tùy chọn ghi chú"
             />
            }
           >
            <SlidersHorizontal className="size-4" />
            <span className="sr-only">Tùy chọn ghi chú</span>
           </Popover.Trigger>
           <Popover.Portal>
            <BasePopoverPositioner
             side="bottom"
             align="end"
             sideOffset={8}
             collisionPadding={8}
             positionMethod="fixed"
            >
             <BasePopoverPopup initialFocus={false} finalFocus={false} variant="mobileActions">
              <Typography
               as="p"
               variant="overline"
               tone="muted"
               weight="black"
               transform="uppercase"
               className="px-2.5 py-1.5"
              >
               Chế độ
              </Typography>
              <Button
               variant={!isReadOnlyMode ? "active" : "ghost"}
               align="start"
               className="w-full"
               onClick={() => {
                setReadOnlyOverride(!isReadOnlyMode);
                setMobileActionsOpen(false);
               }}
              >
               {isReadOnlyMode ? <Pencil /> : <Eye />}
               {isReadOnlyMode ? "Chỉnh sửa" : "Chỉ xem"}
              </Button>
              <Button
               variant={isSplitView ? "active" : "ghost"}
               align="start"
               className="w-full"
               onClick={() => {
                handleToggleSplitView();
                setMobileActionsOpen(false);
               }}
              >
               {isSplitView ? <PanelLeftClose /> : <PanelLeft />}
               {isSplitView ? "Đóng split" : "Mở split"}
              </Button>
              {!isReadOnlyMode ? (
               <Button
                variant={isToolbarVisible ? "active" : "ghost"}
                align="start"
                className="w-full"
                onClick={() => {
                 setIsToolbarVisible((current) => !current);
                 setMobileActionsOpen(false);
                }}
               >
                {isToolbarVisible ? <PanelTopClose /> : <PanelTopOpen />}
                {isToolbarVisible ? "Ẩn thanh định dạng" : "Hiện thanh định dạng"}
               </Button>
              ) : null}

              <div className="h-3 py-1 before:block before:h-px before:bg-border-default" />
              <Typography
               as="p"
               variant="overline"
               tone="muted"
               weight="black"
               transform="uppercase"
               className="px-2.5 py-1.5"
              >
               Ghi chú
              </Typography>
              <NoteLibraryMetadataDialog note={note} compact />
              <Button
               variant="ghost"
               align="start"
               className="w-full"
               onClick={() => {
                setMobileActionsOpen(false);
                requestAnimationFrame(() => importInputRef.current?.click());
               }}
              >
               <Upload /> Import
              </Button>
              <Button
               variant="ghost"
               align="start"
               className="w-full"
               onClick={() => {
                handleExport();
                setMobileActionsOpen(false);
               }}
              >
               <Download /> Export
              </Button>
              <Button
               variant="ghost"
               align="start"
               className="w-full"
               disabled={focusModeEnabled}
               onClick={() => {
                setMobileActionsOpen(false);
                router.push("/notes?action=new");
               }}
              >
               <Plus /> Mở ghi chú mới
              </Button>
              <Button
               variant="ghost"
               align="start"
               className="w-full"
               disabled={focusModeEnabled}
               onClick={() => {
                closeTab(noteId);
                setMobileActionsOpen(false);
               }}
              >
               <PanelLeftClose /> Đóng tab hiện tại
              </Button>
              <Button
               variant="ghost"
               align="start"
               className="w-full"
               onClick={() => {
                setMobileActionsOpen(false);
                requestAnimationFrame(() => setShowDeleteConfirm(true));
               }}
              >
               <Trash2 /> Xóa ghi chú
              </Button>
             </BasePopoverPopup>
            </BasePopoverPositioner>
           </Popover.Portal>
          </Popover.Root>
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
           title={isReadOnlyMode ? "Chuyển sang chỉnh sửa" : "Chỉ xem ghi chú"}
           aria-label={isReadOnlyMode ? "Chuyển sang chỉnh sửa" : "Chỉ xem ghi chú"}
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
            title={isToolbarVisible ? "Ẩn thanh định dạng" : "Hiện thanh định dạng"}
            aria-label={isToolbarVisible ? "Ẩn thanh định dạng" : "Hiện thanh định dạng"}
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
           title={`${isSplitView ? "Tắt" : "Bật"} Split View (Ctrl+Shift+S)`}
           aria-label={`${isSplitView ? "Tắt" : "Bật"} Split View`}
           className={noteEditorActionButtonClassName}
          >
           {isSplitView ? <PanelLeftClose /> : <PanelLeft />}
          </Button>
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           onClick={() => importInputRef.current?.click()}
           title="Import ghi chú"
           aria-label="Import ghi chú"
           className="hidden shrink-0 xl:inline-flex"
          >
           <Upload />
          </Button>
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           onClick={handleExport}
           title="Export ghi chú"
           aria-label="Export ghi chú"
           className="hidden shrink-0 xl:inline-flex"
          >
           <Download />
          </Button>
          <NoteLibraryMetadataDialog note={note} />
          <Button
           type="button"
           variant="outline"
           size="icon-sm"
           title="Xóa ghi chú"
           aria-label="Xóa ghi chú"
           className="shrink-0"
           onClick={() => setShowDeleteConfirm(true)}
          >
           <Trash2 />
          </Button>
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
           <DialogContent className="max-w-md" showCloseButton={!isDeleting}>
            <DialogHeader>
             <DialogTitle>Xóa ghi chú?</DialogTitle>
             <DialogDescription>
              “{note.title}” sẽ bị xóa khỏi danh sách ghi chú của bạn.
             </DialogDescription>
            </DialogHeader>
            <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
               Hủy
              </Button>
             </DialogClose>
             <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
             >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {isDeleting ? "Đang xóa..." : "Xóa"}
             </Button>
            </DialogFooter>
           </DialogContent>
          </Dialog>
         </div>,
         desktopActionsContainer,
        )
      : null}
     {isSplitView ? (
      <div className="note-editor-split-panel min-h-0 flex-1 overflow-hidden p-1 sm:p-2 lg:p-4">
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
      <div className="note-editor-scroll p-1 sm:p-2 lg:p-4">
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

type SaveStatus = z.infer<typeof SaveStatusSchema>;

function SaveStatusBadge({ status }: { status: SaveStatus }) {
 if (status === "idle") return null;

 const config = {
  saving: {
   icon: <Cloud className="w-3.5 h-3.5 animate-pulse" />,
   label: "Đang lưu...",
   className: "text-text-muted",
  },
  saved: {
   icon: <Check className="w-3.5 h-3.5" />,
   label: "Đã lưu",
   className: "text-success",
  },
  error: {
   icon: <CloudOff className="w-3.5 h-3.5" />,
   label: "Lỗi lưu",
   className: "text-danger",
  },
 };

 const c = config[status];

 return (
  <div
   className={`flex h-9 items-center gap-1.5 rounded-xl px-1 text-xs font-medium ${c.className} animate-in fade-in xl:px-2`}
   title={c.label}
   aria-label={c.label}
  >
   {c.icon}
   <span className="hidden xl:inline">{c.label}</span>
  </div>
 );
}
