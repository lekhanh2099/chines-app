"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
 Loader2,
 Search,
 Plus,
 GraduationCap,
 CheckCircle2,
 Clock,
} from "lucide-react";
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
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";

const statusConfig: Record<string, { label: string; color: string }> = {
 draft: { label: "Bản nháp", color: "text-text-muted bg-bg-subtle" },
 reviewed: { label: "Đã ôn", color: "text-info-text bg-info-subtle" },
 mastered: { label: "Thuần thục", color: "text-success bg-success/10" },
};

export default function GrammarPage() {
 const [searchQuery, setSearchQuery] = useState("");

 // TanStack Query: filtered by "grammar" category
 const { data: notes = [], isLoading } = useNotesList("grammar");

 const filteredNotes = notes.filter((note) =>
  note.title.toLowerCase().includes(searchQuery.toLowerCase()),
 );

 return (
  <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
   <div className="px-8 py-6 border-b border-border-default shrink-0">
    <div className="flex items-center justify-between mb-6">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
       <GraduationCap className="w-5 h-5 text-accent" />
      </div>
      <div>
       <h1 className="text-lg font-bold text-text-primary">Ngữ Pháp</h1>
       <p className="text-sm text-text-muted">
        Tất cả ghi chú ngữ pháp của bạn
       </p>
      </div>
     </div>

     <div className="flex items-center gap-4">
      <div className="relative w-64">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
       <Input
        placeholder="Tìm kiếm ghi chú ngữ pháp..."
        className="pl-9 bg-bg-card border-none ring-1 ring-border-default focus-visible:ring-accent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>

      <CreateGrammarNoteDialog />
     </div>
    </div>

    <div className="flex items-center gap-3 text-sm text-text-muted">
     <span className="font-medium">{notes.length} ghi chú ngữ pháp</span>
     <span className="text-border-default">•</span>
     <span>
      {notes.filter((n) => n.status === "mastered").length} đã thuần thục
     </span>
    </div>
   </div>

   <div className="flex-1 overflow-y-auto p-8">
    <div className="max-w-4xl mx-auto space-y-4">
     {isLoading ? (
      <div className="flex justify-center py-12">
       <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
     ) : filteredNotes.length === 0 ? (
      <div className="text-center py-24 border-2 border-dashed border-border-default rounded">
       <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
       <h3 className="text-xl font-bold text-text-primary mb-2">
        Chưa có ghi chú ngữ pháp nào
       </h3>
       <p className="text-text-secondary mb-6">
        Hãy tạo ghi chú ngữ pháp đầu tiên để lưu trữ các cấu trúc câu quan
        trọng.
       </p>
       <CreateGrammarNoteDialog />
      </div>
     ) : (
      filteredNotes.map((note) => (
       <Link href={`/notes/${note.id}`} key={note.id} className="block group">
        <div className="p-6 rounded border border-border-default bg-bg-card hover:border-accent/40 transition-all duration-200 hover:shadow-theme-sm">
         <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
           <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
            {note.title}
           </h3>
           {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-2">
             {note.tags.map((tag) => (
              <span
               key={tag}
               className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent"
              >
               {tag}
              </span>
             ))}
            </div>
           )}
          </div>

          <div
           className={`flex items-center text-xs font-medium px-2.5 py-1 rounded gap-1 ${
            statusConfig[note.status || "draft"]?.color ||
            statusConfig.draft.color
           }`}
          >
           <CheckCircle2 className="w-3 h-3" />
           <span>
            {statusConfig[note.status || "draft"]?.label ||
             statusConfig.draft.label}
           </span>
          </div>
         </div>

         <div className="flex items-center gap-4 text-sm text-text-muted font-medium mt-4">
          <div className="flex items-center gap-1.5">
           <Clock className="w-4 h-4" />
           <span>
            {format(new Date(note.updated_at), "dd MMM yyyy", { locale: vi })}
           </span>
          </div>
         </div>
        </div>
       </Link>
      ))
     )}
    </div>
   </div>
  </div>
 );
}

function CreateGrammarNoteDialog() {
 const [isOpen, setIsOpen] = useState(false);
 const router = useRouter();
 const createNoteMutation = useCreateNote();

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "Ngữ pháp",
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
     category: "grammar",
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
      console.error("Error creating grammar note:", error);
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
     Tạo Ghi Chú Ngữ Pháp
    </Button>
   </DialogTrigger>

   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>Tạo ghi chú ngữ pháp</DialogTitle>
     <DialogDescription>
      Nhập tiêu đề cho ghi chú ngữ pháp mới
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
          placeholder="VD: Cấu trúc 把 (bǎ) - Câu bị động"
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

      <form.Field name="tags">
       {(field) => (
        <div className="space-y-2 mt-4">
         <label className="text-sm font-bold text-text-primary">
          Tags (Cách nhau bằng dấu phẩy)
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
      <form.Subscribe
       selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
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
