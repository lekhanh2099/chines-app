"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
 Loader2,
 Search,
 Plus,
 FileText,
 CheckCircle2,
 Clock,
} from "lucide-react";
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

type Note = {
 id: string;
 title: string;
 tags: string[];
 updated_at: string;
};

export default function NotesListPage() {
 const [notes, setNotes] = useState<Note[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const router = useRouter();

 useEffect(() => {
  fetchNotes();
 }, []);

 const fetchNotes = async () => {
  try {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) return;

   const { data, error } = await supabase
    .from("notes")
    .select("id, title, tags, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

   if (error) throw error;
   setNotes(data || []);
  } catch (error) {
   console.error("Error fetching notes:", error);
  } finally {
   setIsLoading(false);
  }
 };

 const filteredNotes = notes.filter((note) =>
  note.title.toLowerCase().includes(searchQuery.toLowerCase()),
 );

 return (
  <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
   <div className="px-8 py-6 border-b border-border-default shrink-0">
    <div className="flex items-center justify-between mb-6">
     <div className="flex items-center gap-4 text-sm text-text-muted font-medium">
      <span>Ghi chú</span>
      <span className="text-text-primary">/</span>
      <span className="text-text-primary">Tất cả ghi chú</span>
     </div>

     <div className="flex items-center gap-4">
      <div className="relative w-64">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
       <Input
        placeholder="Tìm kiếm ghi chú..."
        className="pl-9 bg-bg-card border-none ring-1 ring-border-default focus-visible:ring-accent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>

      <QuickNoteButton variant="outline" />
      <CreateNoteDialog />
     </div>
    </div>

    <Tabs.Root defaultValue="all" className="flex items-center gap-2">
     <Tabs.List className="flex items-center gap-2">
      <Tabs.Tab
       value="all"
       className="px-4 py-1.5 rounded-full text-sm font-semibold bg-bg-inverse text-text-inverse data-[selected]:bg-bg-inverse data-[selected]:text-text-inverse border border-transparent"
      >
       Tất cả
      </Tabs.Tab>
      <Tabs.Tab
       value="grammar"
       className="px-4 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-bg-primary border border-border-default hover:bg-bg-card transition-colors data-[selected]:bg-bg-inverse data-[selected]:text-text-inverse data-[selected]:border-transparent"
      >
       Ngữ pháp
      </Tabs.Tab>
      <Tabs.Tab
       value="vocab"
       className="px-4 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-bg-primary border border-border-default hover:bg-bg-card transition-colors data-[selected]:bg-bg-inverse data-[selected]:text-text-inverse data-[selected]:border-transparent"
      >
       Từ vựng
      </Tabs.Tab>
      <Tabs.Tab
       value="hsk1"
       className="px-4 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-bg-primary border border-border-default hover:bg-bg-card transition-colors data-[selected]:bg-bg-inverse data-[selected]:text-text-inverse data-[selected]:border-transparent"
      >
       HSK 1
      </Tabs.Tab>
     </Tabs.List>

     <div className="ml-auto flex items-center gap-2 text-sm text-text-muted">
      <span>Sắp xếp:</span>
      <select className="bg-transparent font-medium text-text-primary focus:outline-none cursor-pointer">
       <option>Mới nhất</option>
       <option>Cũ nhất</option>
       <option>Tên A-Z</option>
      </select>
     </div>
    </Tabs.Root>
   </div>

   <div className="flex-1 overflow-y-auto p-8">
    <div className="max-w-4xl mx-auto space-y-4">
     {isLoading ? (
      <div className="flex justify-center py-12">
       <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
     ) : filteredNotes.length === 0 ? (
      <div className="text-center py-24 border-2 border-dashed border-border-default rounded-3xl">
       <FileText className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
       <h3 className="text-xl font-bold text-text-primary mb-2">
        Chưa có ghi chú nào
       </h3>
       <p className="text-text-secondary mb-6">
        Hãy tạo ghi chú đầu tiên của bạn để bắt đầu lưu trữ kiến thức.
       </p>
       <div className="flex items-center justify-center gap-3">
        <QuickNoteButton size="lg" />
        <CreateNoteDialog />
       </div>
      </div>
     ) : (
      filteredNotes.map((note) => (
       <Link href={`/notes/${note.id}`} key={note.id} className="block group">
        <div className="p-6 rounded-2xl border border-border-default bg-bg-card hover:border-accent/40 transition-all duration-200 hover:shadow-theme-sm">
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
               className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent"
              >
               {tag}
              </span>
             ))}
            </div>
           )}
          </div>

          <div className="flex items-center text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full gap-1">
           <CheckCircle2 className="w-3 h-3" />
           <span>Đã lưu</span>
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

function CreateNoteDialog() {
 const [isOpen, setIsOpen] = useState(false);
 const supabase = createClient();
 const router = useRouter();

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "Ngữ pháp",
  },
  onSubmit: async ({ value }) => {
   try {
    const {
     data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const tagsArray = value.tags
     .split(",")
     .map((t) => t.trim())
     .filter(Boolean);

    const { data, error } = await supabase
     .from("notes")
     .insert({
      user_id: user.id,
      title: value.title,
      tags: tagsArray,
      content: {
       type: "doc",
       content: [{ type: "paragraph" }],
      },
     })
     .select()
     .single();

    if (error) throw error;

    setIsOpen(false);
    router.push(`/notes/${data.id}`);
   } catch (error) {
    console.error("Error creating note:", error);
   }
  },
 });

 return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
   <DialogTrigger asChild>
    <Button className="bg-accent hover:bg-accent-hover text-white px-5 rounded-full h-10 shadow-sm font-semibold gap-2">
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
       children={(field) => (
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
      />

      <form.Field
       name="tags"
       children={(field) => (
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
      />
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
       children={([canSubmit, isSubmitting]) => (
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
      />
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
