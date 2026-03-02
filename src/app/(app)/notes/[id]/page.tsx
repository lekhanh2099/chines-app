"use client";

import { useEffect, useState, use, useRef } from "react";
import { Editor } from "@/components/editor/Editor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, X, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";

export default function NoteEditorPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = use(params);
 const router = useRouter();
 const [initialContent, setInitialContent] = useState<Record<
  string,
  unknown
 > | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [noteId, setNoteId] = useState<string | null>(null);
 const [noteTitle, setNoteTitle] = useState("Loading...");
 const [lastEdited, setLastEdited] = useState<string | null>(null);
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 useEffect(() => {
  const fetchNote = async () => {
   try {
    const {
     data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
     router.push("/login");
     return;
    }

    if (id === "new") {
     router.push("/notes");
     return;
    }

    const { data: note, error } = await supabase
     .from("notes")
     .select("*")
     .eq("id", id)
     .eq("user_id", user.id)
     .single();

    if (error) throw error;

    if (note) {
     setNoteId(note.id);
     setNoteTitle(note.title || "Untitled Note");
     setLastEdited(note.updated_at || note.created_at);
     if (note.content) {
      setInitialContent(note.content as Record<string, unknown>);
     }
    } else {
     toast.error("Không tìm thấy ghi chú.");
     router.push("/notes");
    }
   } catch (error: unknown) {
    console.error(
     "Error fetching note:",
     error instanceof Error ? error.message : "Unknown error",
    );
    toast.error("Không thể tải ghi chú.");
   } finally {
    setIsLoading(false);
   }
  };

  fetchNote();
 }, [id]);

 const handleSave = async (json: Record<string, unknown>) => {
  if (!noteId) return;

  try {
   const { error } = await supabase
    .from("notes")
    .update({ content: json, updated_at: new Date().toISOString() })
    .eq("id", noteId);

   if (error) throw error;
   setLastEdited(new Date().toISOString());
  } catch (error: unknown) {
   console.error(
    "Error saving note:",
    error instanceof Error ? error.message : "Unknown error",
   );
  }
 };

 const handleManualSave = () => {
  toast.success("Ghi chú đã được lưu.");
 };

 if (isLoading) {
  return (
   <div className="flex h-full items-center justify-center bg-bg-primary">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
   </div>
  );
 }

 return (
  <div className="flex h-full w-full overflow-hidden bg-bg-primary">
   <div className="flex-1 flex flex-col min-w-0 border-r border-border-default bg-bg-primary">
    <div className="h-16 border-b border-border-default flex items-center justify-between px-6 shrink-0 bg-bg-primary">
     <Breadcrumb>
      <BreadcrumbList>
       <BreadcrumbItem>
        <BreadcrumbLink href="/notes">Tất cả ghi chú</BreadcrumbLink>
       </BreadcrumbItem>
       <BreadcrumbSeparator />
       <BreadcrumbItem>
        <BreadcrumbPage>{noteTitle}</BreadcrumbPage>
       </BreadcrumbItem>
      </BreadcrumbList>
     </Breadcrumb>

     <div className="flex items-center space-x-4">
      <Button
       onClick={handleManualSave}
       className="bg-accent hover:bg-accent-hover text-white px-4 h-9 shadow-sm"
      >
       Save Note
      </Button>
      <button className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-card-hover transition-colors">
       <MoreHorizontal className="w-5 h-5" />
      </button>
     </div>
    </div>

    <div className="flex-1 overflow-y-auto w-full flex justify-center py-12 px-8">
     <div className="w-full max-w-3xl">
      <div className="mb-10">
       <h1
        className="text-4xl font-extrabold tracking-tight text-text-primary mb-4 focus:outline-none"
        contentEditable
        suppressContentEditableWarning
       >
        {noteTitle}
       </h1>
       <div className="flex items-center text-sm text-text-muted space-x-6 font-medium">
        <div className="flex items-center space-x-2">
         <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-calendar"
         >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
         </svg>
         <span>
          {lastEdited ? format(new Date(lastEdited), "MMM d, yyyy") : "Today"}
         </span>
        </div>
        <div className="flex items-center space-x-2">
         <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-clock"
         >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
         </svg>
         <span>
          Last edited{" "}
          {lastEdited ? format(new Date(lastEdited), "h:mm a") : "just now"}
         </span>
        </div>
       </div>
      </div>

      <div className="min-h-[500px]">
       <Editor
        initialContent={initialContent}
        onChange={(json) => {
         handleSave(json);
        }}
       />
      </div>
     </div>
    </div>
   </div>

   <div className="w-[320px] shrink-0 flex flex-col bg-bg-card border-l border-border-default">
    <div className="h-16 flex items-center justify-between px-6 border-b border-border-default shrink-0">
     <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">
      Inspector
     </h3>
     <button className="text-text-muted hover:text-text-primary transition-colors">
      <X className="w-4 h-4" />
     </button>
    </div>

    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
     <section>
      <h4 className="text-[10px] font-bold tracking-wider text-accent uppercase mb-4">
       Linked Vocabulary
      </h4>
      <div className="flex flex-col gap-3">
       <div className="p-4 rounded-xl border border-border-default bg-bg-primary hover:border-accent/30 transition-colors group cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-1">
         <span className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">
          作业
         </span>
         <button className="text-text-muted hover:text-accent transition-colors">
          <Volume2 className="w-4 h-4" />
         </button>
        </div>
        <div className="text-sm font-medium text-accent mb-2">zuòyè</div>
        <div className="text-sm text-text-secondary leading-snug">
         homework; task; school assignment
        </div>
       </div>

       <div className="p-4 rounded-xl border border-border-default bg-bg-primary hover:border-accent/30 transition-colors group cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-1">
         <span className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">
          咖啡
         </span>
         <button className="text-text-muted hover:text-accent transition-colors">
          <Volume2 className="w-4 h-4" />
         </button>
        </div>
        <div className="text-sm font-medium text-accent mb-2">kāfēi</div>
        <div className="text-sm text-text-secondary leading-snug">coffee</div>
       </div>

       <div className="p-4 rounded-xl border border-border-default bg-bg-primary hover:border-accent/30 transition-colors group cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-1">
         <span className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">
          懂
         </span>
         <button className="text-text-muted hover:text-accent transition-colors">
          <Volume2 className="w-4 h-4" />
         </button>
        </div>
        <div className="text-sm font-medium text-accent mb-2">dǒng</div>
        <div className="text-sm text-text-secondary leading-snug">
         to understand; to know
        </div>
       </div>
      </div>
     </section>

     <section>
      <h4 className="text-[10px] font-bold tracking-wider text-text-muted uppercase mb-4">
       Quick Actions
      </h4>
      <button className="w-full py-4 border-2 border-dashed border-border-default rounded-xl text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium">
       <span>+</span> Add Quick Note
      </button>
     </section>
    </div>

    <div className="p-4 border-t border-border-default bg-bg-primary">
     <p className="text-xs text-text-muted flex items-start gap-2">
      <span className="mt-0.5">ℹ️</span>
      Cards sync across your KMS profile automatically.
     </p>
    </div>
   </div>
  </div>
 );
}
