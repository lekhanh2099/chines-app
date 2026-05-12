"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Editor } from "@/components/editor/Editor";
import { SplitViewEditor } from "@/components/editor/SplitViewEditor";
import { toast } from "sonner";
import {
 Loader2,
 Trash2,
 Check,
 Cloud,
 CloudOff,
 PanelLeftClose,
 PanelLeft,
} from "lucide-react";
import { format } from "date-fns";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { useSplitViewStore } from "@/stores/split-view-store";

interface NoteEditorPanelProps {
 noteId: string;
 isVisible: boolean;
}

export function NoteEditorPanel({ noteId, isVisible }: NoteEditorPanelProps) {
 const {
  note,
  isLoading,
  saveContent,
  isSaving,
  saveStatus,
  saveReadingContent,
  updateSplitView,
  deleteNote: deleteNoteMutation,
  isDeleting,
 } = useNoteDetail(noteId);

 const closeTab = useNoteTabsStore((s) => s.closeTab);
 const updateTabTitle = useNoteTabsStore((s) => s.updateTabTitle);
 const isSplitView = useSplitViewStore((s) => s.isSplitView(noteId));
 const toggleSplitView = useSplitViewStore((s) => s.toggleSplitView);

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingContentRef = useRef<Record<string, unknown> | null>(null);
 const readingSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingReadingRef = useRef<Record<string, unknown> | null>(null);
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

 const displaySaveStatus: "idle" | "saving" | "saved" | "error" = isSaving
  ? "saving"
  : saveStatus === "success"
    ? "saved"
    : saveStatus === "error"
      ? "error"
      : "idle";

 const lastEdited = note?.updated_at || note?.created_at || null;
 const hasReadingContent = !!(
  note?.reading_content && Object.keys(note.reading_content).length > 0
 );

 return (
  <div
   className="flex h-full w-full flex-col bg-bg-primary"
   style={{ display: isVisible ? "flex" : "none" }}
  >
   {isLoading ? (
    <div className="flex h-full items-center justify-center">
     <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
   ) : !note ? (
    <div className="flex h-full items-center justify-center">
     <p className="text-text-muted">Không tìm thấy ghi chú.</p>
    </div>
   ) : (
    <>
     {/* Toolbar */}
     <div className="h-9 border-b border-border-default flex items-center justify-between px-4 shrink-0 bg-bg-card/50">
      <div className="flex items-center gap-2 text-xs text-text-muted">
       {" "}
       <button
        onClick={handleToggleSplitView}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
         isSplitView
          ? "bg-accent-subtle text-accent-text border border-accent/20 shadow-sm"
          : hasReadingContent
            ? "bg-info-subtle text-info-text border border-info/20 hover:bg-info-subtle/80"
            : "text-text-muted hover:text-text-primary hover:bg-bg-subtle border border-transparent"
        }`}
        title={`${isSplitView ? "Tắt" : "Bật"} Split View (Ctrl+Shift+S)`}
       >
        {isSplitView ? (
         <PanelLeftClose className="w-3.5 h-3.5" />
        ) : (
         <PanelLeft className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
         {isSplitView
          ? "Đóng Split"
          : hasReadingContent
            ? "Mở Bài đọc"
            : "Split View"}
        </span>
        {!isSplitView && hasReadingContent && (
         <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
        )}
       </button>
      </div>

      <div className="flex items-center gap-2">
       <SaveStatusBadge status={displaySaveStatus} />

       {lastEdited && (
        <span className="text-[11px] text-text-muted/70 ml-1">
         {format(new Date(lastEdited), "MMM d, yyyy · h:mm a")}
        </span>
       )}
       {showDeleteConfirm ? (
        <div className="flex items-center gap-2 bg-danger-subtle rounded-sm px-2.5 py-0.5 animate-in fade-in">
         <span className="text-[11px] font-medium text-danger-text">Xoá?</span>
         <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-[11px] font-bold text-danger hover:underline disabled:opacity-50"
         >
          {isDeleting ? "..." : "Xác nhận"}
         </button>
         <button
          onClick={() => setShowDeleteConfirm(false)}
          className="text-[11px] text-text-muted hover:text-text-primary"
         >
          Huỷ
         </button>
        </div>
       ) : (
        <button
         onClick={() => setShowDeleteConfirm(true)}
         className="p-1 text-text-muted hover:text-danger hover:bg-danger-subtle rounded-sm transition-colors"
         title="Xoá ghi chú"
        >
         <Trash2 className="w-3.5 h-3.5" />
        </button>
       )}
      </div>
     </div>

     {isSplitView ? (
      <div className="h-full bg-bg-card border border-border-default rounded shadow-theme-sm">
       <SplitViewEditor
        noteId={noteId}
        noteContent={note.content as Record<string, unknown> | null}
        readingContent={note.reading_content as Record<string, unknown> | null}
        onNoteChange={handleChange}
        onReadingChange={handleReadingChange}
       />
      </div>
     ) : (
      <Editor
       initialContent={note.content as Record<string, unknown> | null}
       onChange={handleChange}
      />
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
   className={`flex items-center gap-1.5 text-xs font-medium ${c.className} animate-in fade-in`}
  >
   {c.icon}
   <span>{c.label}</span>
  </div>
 );
}
