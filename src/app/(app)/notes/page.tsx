"use client";

import { useState, Suspense } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Search, Plus, FileText, Clock } from "lucide-react";
import { Tabs } from "@base-ui/react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
 Dialog,
 DialogTrigger,
 DialogContent,
 DialogTitle,
 DialogDescription,
 DialogHeader,
 DialogFooter,
 DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { QuickNoteButton } from "@/components/notes/QuickNoteButton";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useNoteRouting } from "@/hooks/useNoteRouting";
import type { NoteCategory } from "@/types/database";

const categoryEmoji: Record<string, string> = {
 grammar: "🟦",
 vocabulary: "🟩",
 culture: "🟪",
 general: "⬜",
};

export default function NotesPage() {
 return (
  <Suspense
   fallback={
    <div className="flex items-center justify-center h-full">
     <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
    </div>
   }
  >
   <NotesPageInner />
  </Suspense>
 );
}

function NotesPageInner() {
 const [searchQuery, setSearchQuery] = useState("");
 const [activeTab, setActiveTab] = useState<string>("all");

 const categoryFilter: NoteCategory | undefined =
  activeTab === "all" ? undefined : (activeTab as NoteCategory);
 const { data: notes, isLoading } = useNotesList(categoryFilter);

 // Smart routing — redirects unless ?view=all or ?action=new
 const { isRedirecting, isNewAction } = useNoteRouting(
  notes,
  isLoading,
 );

 // ── Loading / Redirecting skeleton ──
 if (isLoading || isRedirecting) {
  return (
   <div className="flex items-center justify-center h-full">
    <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
   </div>
  );
 }

 // ── Case: ?action=new  →  auto-create a note ──
 if (isNewAction) {
  return <NewNoteView />;
 }

 // ── Case: ?view=all  →  List View ──
 const allNotes = notes ?? [];
 const filteredNotes = allNotes.filter((note) =>
  note.title.toLowerCase().includes(searchQuery.toLowerCase()),
 );

 return (
  <div className="flex flex-col h-full overflow-hidden">
   {/* Header */}
   <div className="px-8 py-5 border-b border-border-default shrink-0">
    <div className="flex items-center justify-between mb-4">
     <h1 className="text-lg font-bold text-text-primary">Tất cả ghi chú</h1>

     <div className="flex items-center gap-3">
      <div className="relative w-56">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
       <Input
        placeholder="Tìm kiếm..."
        className="pl-9 h-9 bg-bg-input border-border-default text-[13px] rounded focus-visible:ring-ring"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>

      <QuickNoteButton variant="outline" />
      <CreateNoteDialog />
     </div>
    </div>

    <Tabs.Root
     defaultValue="all"
     value={activeTab}
     onValueChange={(val) => setActiveTab(val)}
    >
     <Tabs.List className="flex items-center gap-1">
      {[
       { value: "all", label: "Tất cả" },
       { value: "grammar", label: "Ngữ pháp" },
       { value: "vocabulary", label: "Từ vựng" },
      ].map((tab) => (
       <Tabs.Tab
        key={tab.value}
        value={tab.value}
        className="px-3 py-1.5 rounded text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors data-[selected]:bg-accent data-[selected]:text-text-inverse"
       >
        {tab.label}
       </Tabs.Tab>
      ))}
     </Tabs.List>
    </Tabs.Root>
   </div>

   {/* List */}
   <div className="flex-1 overflow-y-auto">
    {filteredNotes.length === 0 ? (
     <div className="text-center py-24">
      <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
      <p className="text-sm font-medium text-text-secondary mb-1">
       Chưa có ghi chú nào
      </p>
      <p className="text-xs text-text-muted mb-5">
       Tạo ghi chú đầu tiên để bắt đầu.
      </p>
      <div className="flex items-center justify-center gap-2">
       <QuickNoteButton size="sm" />
       <CreateNoteDialog />
      </div>
     </div>
    ) : (
     <div className="divide-y divide-border-default">
      {filteredNotes.map((note) => (
       <Link
        href={`/notes/${note.id}`}
        key={note.id}
        className="flex items-center gap-4 px-8 py-3.5 hover:bg-bg-card-hover transition-colors group"
       >
        <span className="text-base leading-none">
         {categoryEmoji[note.category] || "⬜"}
        </span>

        <span className="flex-1 min-w-0 text-[13px] font-medium text-text-primary truncate group-hover:text-accent-text transition-colors">
         {note.title}
        </span>

        {note.tags && note.tags.length > 0 && (
         <div className="flex items-center gap-1.5 shrink-0">
          {note.tags.slice(0, 2).map((tag) => (
           <span
            key={tag}
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-bg-subtle text-text-muted"
           >
            {tag}
           </span>
          ))}
         </div>
        )}

        <span className="flex items-center gap-1 text-xs text-text-muted shrink-0 tabular-nums">
         <Clock className="w-3 h-3" />
         {format(new Date(note.updated_at), "dd/MM/yy", { locale: vi })}
        </span>
       </Link>
      ))}
     </div>
    )}
   </div>
  </div>
 );
}

/* ─── New Note View (auto-create onboarding) ─── */
function NewNoteView() {
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    title: "Ghi chú đầu tiên của tôi",
    tags: [],
    category: "general",
    content: {
     root: {
      children: [
       {
        children: [
         {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: "Bắt đầu viết ở đây...",
          type: "text",
          version: 1,
         },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: "",
       },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
     },
    },
   },
   {
    onSuccess: (note) => {
     router.replace(`/notes/${note.id}`);
    },
   },
  );
 };

 return (
  <div className="flex items-center justify-center h-full">
   <div className="text-center max-w-md">
    <div className="w-16 h-16 rounded bg-bg-subtle flex items-center justify-center mx-auto mb-6">
     <FileText className="w-8 h-8 text-text-muted" />
    </div>
    <h2 className="text-2xl font-bold text-text-primary mb-2">
     Chào mừng bạn! 👋
    </h2>
    <p className="text-text-secondary mb-8 leading-relaxed">
     Đây là không gian ghi chú của bạn. Tạo ghi chú đầu tiên để bắt đầu lưu trữ
     kiến thức tiếng Trung.
    </p>
    <button
     onClick={handleCreate}
     disabled={createNoteMutation.isPending}
     className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
    >
     {createNoteMutation.isPending ? (
      <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
      <Plus className="w-4 h-4" />
     )}
     Tạo ghi chú đầu tiên
    </button>
   </div>
  </div>
 );
}

function CreateNoteDialog() {
 const [isOpen, setIsOpen] = useState(false);
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "Ngữ pháp",
   category: "general",
  },
  onSubmit: async ({ value }) => {
   const tagsArray = value.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

   createNoteMutation.mutate(
    {
     title: value.title,
     tags: tagsArray,
     category: value.category as NoteCategory,
     content: {
      type: "doc",
      content: [{ type: "paragraph" }],
     },
    },
    {
     onSuccess: (note) => {
      setIsOpen(false);
      router.push(`/notes/${note.id}`);
     },
     onError: (error) => {
      console.error("Error creating note:", error);
     },
    },
   );
  },
 });

 return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
   <DialogTrigger asChild>
    <Button className="bg-accent hover:bg-accent-hover text-white px-5 rounded h-10 shadow-sm font-semibold gap-2">
     <Plus className="w-4 h-4" />
     Tạo Ghi Chú Mới
    </Button>
   </DialogTrigger>

   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>Tạo ghi chú mới</DialogTitle>
     <DialogDescription>
      Nhập tiêu đề và phân loại cho ghi chú của bạn
     </DialogDescription>
    </DialogHeader>

    <form
     onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
     }}
    >
     <DialogBody>
      <form.Field
       name="title"
       validators={{
        onChange: ({ value }) =>
         !value ? "Tiêu đề không được để trống" : undefined,
       }}
      >
       {(field) => (
        <div className="space-y-2">
         <label className="text-sm font-bold text-text-primary">
          Tiêu đề ghi chú
         </label>
         <Input
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="VD: Bài 6 - Chọn lọc ngữ pháp"
          className="border-border-default focus-visible:ring-accent"
         />
         {field.state.meta.errors ? (
          <p className="text-xs text-danger font-medium">
           {field.state.meta.errors}
          </p>
         ) : null}
        </div>
       )}
      </form.Field>

      <form.Field
       name="tags"
      >
       {(field) => (
        <div className="space-y-2 mt-4">
         <label className="text-sm font-bold text-text-primary">
          Phân loại (Cách nhau bằng dấu phẩy)
         </label>
         <Input
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="VD: Ngữ pháp, HSK 2"
          className="border-border-default focus-visible:ring-accent"
         />
        </div>
       )}
      </form.Field>

      <form.Field
       name="category"
      >
       {(field) => (
        <div className="space-y-2 mt-4">
         <label className="text-sm font-bold text-text-primary">Danh mục</label>
         <select
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className="w-full h-10 bg-bg-card border border-border-default rounded px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
         >
          <option value="grammar">🟦 Ngữ Pháp</option>
          <option value="vocabulary">🟩 Từ Vựng</option>
          <option value="culture">🟪 Văn Hóa / Mẹo</option>
          <option value="general">⬜ Chung</option>
         </select>
        </div>
       )}
      </form.Field>
     </DialogBody>

     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       onClick={() => setIsOpen(false)}
       className="text-text-secondary"
      >
       Hủy
      </Button>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
       {([canSubmit, isSubmitting]) => (
        <Button
         type="submit"
         disabled={!canSubmit}
         className="bg-accent hover:bg-accent-hover text-white"
        >
         {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
         ) : null}
         Tạo Ghi Chú
        </Button>
       )}
      </form.Subscribe>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
