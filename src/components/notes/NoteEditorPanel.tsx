"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Editor } from "@/components/editor/Editor";
import { toast } from "sonner";
import {
 Loader2,
 ChevronDown,
 Trash2,
 Check,
 Cloud,
 CloudOff,
} from "lucide-react";
import { format } from "date-fns";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import type { NoteCategory } from "@/types/database";

const categoryConfig: Record<
 string,
 { label: string; emoji: string; bg: string; border: string; text: string }
> = {
 grammar: {
  label: "Ngữ Pháp",
  emoji: "🟦",
  bg: "bg-info-subtle",
  border: "border-info/20",
  text: "text-info-text",
 },
 vocabulary: {
  label: "Từ Vựng",
  emoji: "🟩",
  bg: "bg-success-subtle",
  border: "border-success/20",
  text: "text-success-text",
 },
 culture: {
  label: "Văn Hóa / Mẹo",
  emoji: "🟪",
  bg: "bg-purple-subtle",
  border: "border-purple/20",
  text: "text-purple-text",
 },
 general: {
  label: "Chung",
  emoji: "⬜",
  bg: "bg-bg-primary",
  border: "border-border-default",
  text: "text-text-secondary",
 },
};

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
  updateTitle,
  updateCategory,
  deleteNote: deleteNoteMutation,
  isDeleting,
 } = useNoteDetail(noteId);

 const closeTab = useNoteTabsStore((s) => s.closeTab);
 const updateTabTitle = useNoteTabsStore((s) => s.updateTabTitle);

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingContentRef = useRef<Record<string, unknown> | null>(null);

 // Sync tab title with note title
 useEffect(() => {
  if (note?.title) {
   updateTabTitle(noteId, note.title);
  }
 }, [note?.title, noteId, updateTabTitle]);

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

 // Flush on unmount
 useEffect(() => {
  return () => {
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   if (pendingContentRef.current) {
    saveContent(pendingContentRef.current);
   }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const handleTitleChange = useCallback(
  (newTitle: string) => {
   if (!newTitle.trim()) return;
   updateTitle(newTitle);
   updateTabTitle(noteId, newTitle);
  },
  [updateTitle, updateTabTitle, noteId],
 );

 const handleCategoryChange = useCallback(
  (newCategory: string) => {
   updateCategory(newCategory as NoteCategory);
  },
  [updateCategory],
 );

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

 const noteTitle = note?.title || "Loading...";
 const category = note?.category || "general";
 const lastEdited = note?.updated_at || note?.created_at || null;
 const catConf = categoryConfig[category] || categoryConfig.general;

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
       <div className="relative">
        <select
         value={category}
         onChange={(e) => handleCategoryChange(e.target.value)}
         className={`appearance-none ${catConf.bg} border ${catConf.border} rounded-sm pl-2 pr-6 py-0.5 text-[11px] font-semibold cursor-pointer hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-ring transition-colors ${catConf.text}`}
        >
         <option value="grammar">🟦 Ngữ Pháp</option>
         <option value="vocabulary">🟩 Từ Vựng</option>
         <option value="culture">🟪 Văn Hóa / Mẹo</option>
         <option value="general">⬜ Chung</option>
        </select>
        <ChevronDown className={`absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${catConf.text}`} />
       </div>
       {lastEdited && (
        <span className="text-[11px] text-text-muted/70 ml-1">
         {format(new Date(lastEdited), "MMM d, yyyy · h:mm a")}
        </span>
       )}
      </div>

      <div className="flex items-center gap-2">
       <SaveStatusBadge status={displaySaveStatus} />

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

     {/* Editor content */}
     <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto bg-bg-card border border-border-default rounded shadow-theme-sm">
       <div className="px-10 pt-8 pb-4 border-b border-border-default">
        <h1
         className="text-3xl font-bold tracking-tight text-text-primary bg-transparent focus:outline-none leading-snug"
         contentEditable
         suppressContentEditableWarning
         onBlur={(e) =>
          handleTitleChange(e.currentTarget.textContent || "")
         }
        >
         {noteTitle}
        </h1>
       </div>

       <div className="min-h-[60vh]">
        <Editor
         initialContent={note.content as Record<string, unknown> | null}
         onChange={handleChange}
        />
       </div>
      </div>
     </div>
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
