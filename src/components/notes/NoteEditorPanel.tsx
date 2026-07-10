"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
 Trash2,
 Upload,
} from "lucide-react";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { normalizeImportedNotePayload, type JsonObject } from "@/features/notes/note-export.schema";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { useSplitViewStore } from "@/stores/split-view-store";
import { Button } from "@/components/ui/button";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
 headerActionsContainer?: HTMLElement | null;
}

function createDownloadFileName(title: string): string {
 const slug = title
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64);

 return `${slug || "ghi-chu"}.json`;
}

function downloadJsonFile(fileName: string, value: unknown) {
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

const noteEditorActionButtonClassName =
 "h-9 min-h-9 w-9 gap-1.5 rounded-xl px-0 xl:w-auto xl:px-2.5";

export function NoteEditorPanel({
 noteId,
 isVisible,
 headerActionsContainer,
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

 const closeTab = useNoteTabsStore((s) => s.closeTab);
 const updateTabTitle = useNoteTabsStore((s) => s.updateTabTitle);
 const isSplitView = useSplitViewStore((s) => s.isSplitView(noteId));
 const toggleSplitView = useSplitViewStore((s) => s.toggleSplitView);

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [importedContent, setImportedContent] = useState<JsonObject | null>(null);
 const [importedReadingContent, setImportedReadingContent] = useState<
  JsonObject | null | undefined
 >(undefined);
 const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
 const [isToolbarVisible, setIsToolbarVisible] = useState(true);
 const [importVersion, setImportVersion] = useState(0);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingContentRef = useRef<Record<string, unknown> | null>(null);
 const readingSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingReadingRef = useRef<Record<string, unknown> | null>(null);
 const importInputRef = useRef<HTMLInputElement | null>(null);
 const splitViewSynced = useRef(false);

 // Sync tab title with note title
 useEffect(() => {
  if (note?.title) {
   updateTabTitle(noteId, note.title);
  }
 }, [note?.title, noteId, updateTabTitle]);

 // Sync split view state from DB on initial load
 const setSplitView = useSplitViewStore((s) => s.setSplitView);
 useEffect(() => {
  if (note && !splitViewSynced.current) {
   if (note.split_view_enabled) {
    setSplitView(noteId, true);
   }
   splitViewSynced.current = true;
  }
 }, [note, noteId, setSplitView]);

 const handleChange = useCallback(
  (json: Record<string, unknown>) => {
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
  (json: Record<string, unknown>) => {
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

 const handleDelete = useCallback(() => {
  deleteNoteMutation();
  toast.success("Đã xoá ghi chú.");
  closeTab(noteId);
 }, [deleteNoteMutation, closeTab, noteId]);

 const handleExport = useCallback(() => {
  if (!note) return;

  downloadJsonFile(createDownloadFileName(note.title), {
   version: 1,
   exportedAt: new Date().toISOString(),
   note: {
    title: note.title,
    tags: note.tags ?? [],
    category: note.category,
    content: importedContent ?? (note.content as JsonObject),
    readingContent:
     importedReadingContent !== undefined
      ? importedReadingContent
      : (note.reading_content as JsonObject | null),
    splitViewEnabled: note.split_view_enabled,
   },
  });
  toast.success("Đã export ghi chú.");
 }, [importedContent, importedReadingContent, note]);

 const currentNoteTitle = note?.title;
 const currentNoteCategory = note?.category;

 const handleImportFile = useCallback(
  async (file: File) => {
   try {
    const importedPayload = normalizeImportedNotePayload(JSON.parse(await file.text()));
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
   updateSplitView,
   updateTabTitle,
   updateTitle,
  ],
 );

 const displaySaveStatus: "idle" | "saving" | "saved" | "error" = isSaving
  ? "saving"
  : saveStatus === "success"
    ? "saved"
    : saveStatus === "error"
      ? "error"
      : "idle";

 const noteContent = importedContent ?? (note?.content as Record<string, unknown> | null);
 const readingContent =
  importedReadingContent !== undefined
   ? importedReadingContent
   : (note?.reading_content as Record<string, unknown> | null);
 const hasReadingContent = !!(readingContent && Object.keys(readingContent).length > 0);

 return (
  <div
   className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg-primary"
   style={{ display: isVisible ? "flex" : "none" }}
  >
   {isLoading ? (
    <NoteEditorSkeleton />
   ) : !note ? (
    <div className="flex h-full items-center justify-center">
     <p className="text-text-muted">Không tìm thấy ghi chú.</p>
    </div>
   ) : (
    <>
     <input
      ref={importInputRef}
      type="file"
      accept="application/json,.json"
      className="hidden"
      onChange={(event) => {
       const [file] = Array.from(event.target.files ?? []);
       if (file) void handleImportFile(file);
      }}
     />

     {headerActionsContainer && isVisible
      ? createPortal(
         <div className="flex min-w-max items-center justify-start gap-1.5 xl:gap-2">
          <SaveStatusBadge status={displaySaveStatus} />

          <Button
           type="button"
           variant={isReadOnlyMode ? "active" : "outline"}
           size="sm"
           onClick={() => setIsReadOnlyMode((current) => !current)}
           title={isReadOnlyMode ? "Chuyển sang chỉnh sửa" : "Chỉ xem ghi chú"}
           aria-label={isReadOnlyMode ? "Chuyển sang chỉnh sửa" : "Chỉ xem ghi chú"}
           className={noteEditorActionButtonClassName}
          >
           {isReadOnlyMode ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
           <span className="hidden xl:inline">{isReadOnlyMode ? "Chỉ xem" : "Sửa"}</span>
          </Button>

          {!isReadOnlyMode ? (
           <Button
            type="button"
            variant={isToolbarVisible ? "active" : "outline"}
            size="sm"
            onClick={() => setIsToolbarVisible((current) => !current)}
            title={isToolbarVisible ? "Ẩn thanh định dạng" : "Hiện thanh định dạng"}
            aria-label={isToolbarVisible ? "Ẩn thanh định dạng" : "Hiện thanh định dạng"}
            className={noteEditorActionButtonClassName}
           >
            {isToolbarVisible ? (
             <PanelTopClose className="h-3.5 w-3.5" />
            ) : (
             <PanelTopOpen className="h-3.5 w-3.5" />
            )}
            <span className="hidden xl:inline">
             {isToolbarVisible ? "Ẩn toolbar" : "Hiện toolbar"}
            </span>
           </Button>
          ) : null}

          <Button
           type="button"
           variant={isSplitView ? "active" : "outline"}
           size="sm"
           onClick={handleToggleSplitView}
           title={`${isSplitView ? "Tắt" : "Bật"} Split View (Ctrl+Shift+S)`}
           aria-label={`${isSplitView ? "Tắt" : "Bật"} Split View`}
           className={noteEditorActionButtonClassName}
          >
           {isSplitView ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
           ) : (
            <PanelLeft className="h-3.5 w-3.5" />
           )}
           <span className="hidden xl:inline">
            {isSplitView ? "Đóng split" : hasReadingContent ? "Mở bài đọc" : "Split view"}
           </span>
           {!isSplitView && hasReadingContent ? (
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
           ) : null}
          </Button>

          <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={() => importInputRef.current?.click()}
           title="Import ghi chú"
           aria-label="Import ghi chú"
           className={noteEditorActionButtonClassName}
          >
           <Upload className="h-3.5 w-3.5" />
           <span className="hidden xl:inline">Import</span>
          </Button>
          <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={handleExport}
           title="Export ghi chú"
           aria-label="Export ghi chú"
           className={noteEditorActionButtonClassName}
          >
           <Download className="h-3.5 w-3.5" />
           <span className="hidden xl:inline">Export</span>
          </Button>

          {showDeleteConfirm ? (
           <div className="flex items-center gap-1 rounded-xl border border-danger/25 bg-danger-subtle p-1">
            <Button
             type="button"
             variant="destructive"
             size="sm"
             onClick={handleDelete}
             disabled={isDeleting}
             className="h-8 rounded-lg"
            >
             {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
             Xóa
            </Button>
            <Button
             type="button"
             variant="ghost"
             size="sm"
             onClick={() => setShowDeleteConfirm(false)}
             className="h-8 rounded-lg"
            >
             Hủy
            </Button>
           </div>
          ) : (
           <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setShowDeleteConfirm(true)}
            title="Xóa ghi chú"
            className="h-9 w-9 rounded-xl"
           >
            <Trash2 className="h-3.5 w-3.5" />
           </Button>
          )}
         </div>,
         headerActionsContainer,
        )
      : null}
     {isSplitView ? (
      <div className="note-editor-split-panel m-2 min-h-0 flex-1 overflow-hidden lg:m-4">
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
      <div className="note-editor-scroll m-2 lg:m-4">
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

type SaveStatus = "idle" | "saving" | "saved" | "error";

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
