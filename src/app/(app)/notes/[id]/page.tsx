"use client";

import { useState, use, useRef, useCallback, useEffect } from "react";
import { Editor } from "@/components/editor/Editor";
import { toast } from "sonner";
import {
 Loader2,
 ChevronDown,
 Trash2,
 Check,
 Cloud,
 CloudOff,
 Calendar,
 Clock,
} from "lucide-react";
import { format } from "date-fns";
import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import type { NoteCategory } from "@/types/database";

const categoryConfig: Record<
 string,
 { label: string; emoji: string; bg: string; border: string; text: string }
> = {
 grammar: {
  label: "Ngữ Pháp",
  emoji: "🟦",
  bg: "bg-blue-50 dark:bg-blue-950/30",
  border: "border-blue-200 dark:border-blue-800/50",
  text: "text-blue-700 dark:text-blue-300",
 },
 vocabulary: {
  label: "Từ Vựng",
  emoji: "🟩",
  bg: "bg-emerald-50 dark:bg-emerald-950/30",
  border: "border-emerald-200 dark:border-emerald-800/50",
  text: "text-emerald-700 dark:text-emerald-300",
 },
 culture: {
  label: "Văn Hóa / Mẹo",
  emoji: "🟪",
  bg: "bg-purple-50 dark:bg-purple-950/30",
  border: "border-purple-200 dark:border-purple-800/50",
  text: "text-purple-700 dark:text-purple-300",
 },
 general: {
  label: "Chung",
  emoji: "⬜",
  bg: "bg-bg-primary",
  border: "border-border-default",
  text: "text-text-secondary",
 },
};

export default function NoteEditorPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = use(params);
 const router = useRouter();

 // All data fetching & mutations via TanStack Query hook
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
 } = useNoteDetail(id);

 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingContentRef = useRef<Record<string, unknown> | null>(null);

 // Debounced auto-save handler
 const handleChange = useCallback(
  (json: Record<string, unknown>) => {
   pendingContentRef.current = json;
   if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
   saveTimerRef.current = setTimeout(() => {
    if (pendingContentRef.current) {
     saveContent(pendingContentRef.current);
     pendingContentRef.current = null;
    }
   }, 3000);
  },
  [saveContent],
 );

 // Flush pending save on unmount
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
  },
  [updateTitle],
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
  router.push("/notes");
 }, [deleteNoteMutation, router]);

 // Derive display state
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

 if (isLoading) {
  return (
   <div className="flex h-full items-center justify-center bg-bg-primary">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
   </div>
  );
 }

 if (!note) {
  return (
   <div className="flex h-full items-center justify-center bg-bg-primary">
    <p className="text-text-muted">Không tìm thấy ghi chú.</p>
   </div>
  );
 }

 return (
  <div className="flex h-full w-full bg-bg-primary">
   <div className="flex-1 flex flex-col min-w-0 bg-bg-primary overflow-y-auto">
    {/* Top bar */}
    <div className="h-14 border-b border-border-default flex items-center justify-between px-6 shrink-0 bg-bg-primary">
     <Breadcrumb>
      <BreadcrumbList>
       <BreadcrumbItem>
        <BreadcrumbLink href="/notes">Ghi chú</BreadcrumbLink>
       </BreadcrumbItem>
       <BreadcrumbSeparator />
       <BreadcrumbItem>
        <BreadcrumbPage className="max-w-60 truncate">
         {noteTitle}
        </BreadcrumbPage>
       </BreadcrumbItem>
      </BreadcrumbList>
     </Breadcrumb>

     <div className="flex items-center gap-3">
      {/* Save status indicator */}
      <SaveStatusBadge status={displaySaveStatus} />

      {/* Delete */}
      {showDeleteConfirm ? (
       <div className="flex items-center gap-2 bg-danger-subtle rounded-lg px-3 py-1.5 animate-in fade-in">
        <span className="text-xs font-medium text-danger-text">Xoá?</span>
        <button
         onClick={handleDelete}
         disabled={isDeleting}
         className="text-xs font-bold text-danger hover:underline disabled:opacity-50"
        >
         {isDeleting ? "Đang xoá..." : "Xác nhận"}
        </button>
        <button
         onClick={() => setShowDeleteConfirm(false)}
         className="text-xs text-text-muted hover:text-text-primary"
        >
         Huỷ
        </button>
       </div>
      ) : (
       <button
        onClick={() => setShowDeleteConfirm(true)}
        className="p-2 text-text-muted hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors"
        title="Xoá ghi chú"
       >
        <Trash2 className="w-4 h-4" />
       </button>
      )}
     </div>
    </div>

    {/* Editor area — gray canvas with white paper */}

    <div
     className={`rounded-2xl border p-6 mb-3 transition-colors ${catConf.bg} ${catConf.border}`}
    >
     <div className="flex items-center gap-2 mb-3">
      <div className="relative">
       <select
        value={category}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className={`appearance-none ${catConf.bg} border ${catConf.border} rounded-lg pl-3 pr-7 py-1 text-xs font-bold cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${catConf.text}`}
       >
        <option value="grammar">🟦 Ngữ Pháp</option>
        <option value="vocabulary">🟩 Từ Vựng</option>
        <option value="culture">🟪 Văn Hóa / Mẹo</option>
        <option value="general">⬜ Chung</option>
       </select>
       <ChevronDown
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${catConf.text}`}
       />
      </div>
     </div>

     <h1
      className="text-3xl font-extrabold tracking-tight text-text-primary focus:outline-none leading-snug"
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => handleTitleChange(e.currentTarget.textContent || "")}
     >
      {noteTitle}
     </h1>

     <div className="flex items-center gap-4 text-xs text-text-muted font-medium mt-3">
      <div className="flex items-center gap-1.5">
       <Calendar className="w-3.5 h-3.5" />
       <span>
        {lastEdited ? format(new Date(lastEdited), "MMM d, yyyy") : "Today"}
       </span>
      </div>
      <div className="flex items-center gap-1.5">
       <Clock className="w-3.5 h-3.5" />
       <span>
        {lastEdited ? format(new Date(lastEdited), "h:mm a") : "just now"}
       </span>
      </div>
     </div>
    </div>

    {/* Editor */}
    <div className="min-h-[60vh]">
     <Editor
      initialContent={note.content as Record<string, unknown> | null}
      onChange={handleChange}
     />
    </div>
   </div>
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
