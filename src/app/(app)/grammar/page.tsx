"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
 BookOpenCheck,
 CheckCircle2,
 Clock,
 FileText,
 GraduationCap,
 Loader2,
 Plus,
 Search,
 Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import type { NoteListItem } from "@/services/notes.service";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
 draft: { label: "Đang học", className: "border-yellow-300 bg-yellow-50 text-orange-600" },
 reviewed: { label: "Đã ôn", className: "border-blue-300 bg-blue-50 text-blue-600" },
 mastered: { label: "Thành thạo", className: "border-emerald-300 bg-emerald-50 text-emerald-600" },
};

export default function GrammarPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
 const { data: notes = [], isLoading } = useNotesList("grammar");

 const filteredNotes = useMemo(
  () =>
   notes.filter((note) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
     note.title.toLowerCase().includes(query) ||
     note.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
   }),
  [notes, searchQuery],
 );
 const activeNote = filteredNotes.find((note) => note.id === activeNoteId) || filteredNotes[0];
 const mastered = notes.filter((note) => note.status === "mastered").length;
 const reviewed = notes.filter((note) => note.status === "reviewed").length;
 const draft = notes.length - mastered - reviewed;

 return (
  <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-7 lg:px-8">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
     <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      ← Quay lại
     </Link>
     <h1 className="mt-5 text-4xl font-black tracking-normal text-stone-900">
      Ngữ pháp
     </h1>
     <p className="mt-2 text-base font-bold text-stone-500">
      Biến ghi chú ngữ pháp thành danh sách chủ đề để ôn theo nhịp học.
     </p>
    </div>

    <div className="flex flex-wrap gap-3">
     <Metric value={draft} label="Đang học" tone="yellow" />
     <Metric value={reviewed} label="Đã ôn" tone="blue" />
     <Metric value={mastered} label="Thành thạo" tone="green" />
     <CreateGrammarNoteDialog />
    </div>
   </div>

   <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
    <aside className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto">
     <div className="mb-4 flex items-center justify-between">
      <p className="text-lg font-black uppercase tracking-wide text-stone-900">Chủ đề</p>
      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
       {notes.length}
      </span>
     </div>

     <div className="relative mb-4">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
      <Input
       value={searchQuery}
       onChange={(event) => setSearchQuery(event.target.value)}
       placeholder="Tìm ngữ pháp..."
       className="h-12 rounded-2xl border-2 border-stone-200 bg-white pl-12 text-base font-bold"
      />
     </div>

     {isLoading ? (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-stone-500">
       <Loader2 className="h-5 w-5 animate-spin" />
       Đang tải...
      </div>
     ) : filteredNotes.length === 0 ? (
      <div className="rounded-3xl border-2 border-dashed border-stone-200 p-5 text-center">
       <GraduationCap className="mx-auto h-10 w-10 text-stone-300" />
       <p className="mt-3 text-sm font-black text-stone-700">Chưa có chủ đề phù hợp</p>
      </div>
     ) : (
      <div className="flex flex-col gap-3">
       {filteredNotes.map((note, index) => (
        <GrammarTopicButton
         key={note.id}
         note={note}
         index={index + 1}
         active={activeNote?.id === note.id}
         onClick={() => setActiveNoteId(note.id)}
        />
       ))}
      </div>
     )}
    </aside>

    <main className="min-h-[620px] rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-8">
     {activeNote ? (
      <GrammarLearningPanel note={activeNote} />
     ) : (
      <EmptyGrammarPanel />
     )}
    </main>
   </div>
  </div>
 );
}

function GrammarTopicButton({ note, index, active, onClick }: { note: NoteListItem; index: number; active: boolean; onClick: () => void }) {
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "flex min-h-20 items-center gap-3 rounded-3xl border-2 p-4 text-left shadow-theme-sm transition",
    active ? "border-purple-700 bg-purple-500 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
   )}
  >
   <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black", active ? "border-white/50 bg-white/20" : "border-stone-200 bg-purple-50 text-purple-600")}>
    {index}
   </div>
   <div className="min-w-0 flex-1">
    <p className="truncate text-base font-black">{note.title}</p>
    <p className={cn("mt-1 truncate text-sm font-bold", active ? "text-white/90" : "text-stone-500")}>
     {note.tags?.join(", ") || "Ngữ pháp"}
    </p>
   </div>
  </button>
 );
}

function GrammarLearningPanel({ note }: { note: NoteListItem }) {
 const status = statusConfig[note.status || "draft"] || statusConfig.draft;

 return (
  <div className="flex min-h-[560px] flex-col">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-purple-500">Chủ đề ngữ pháp</p>
     <h2 className="mt-1 text-3xl font-black text-stone-900">{note.title}</h2>
     <div className="mt-3 flex flex-wrap items-center gap-2">
      {(note.tags || ["Ngữ pháp"]).map((tag) => (
       <span key={tag} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
        {tag}
       </span>
      ))}
      <span className={cn("inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-black", status.className)}>
       <CheckCircle2 className="h-3.5 w-3.5" />
       {status.label}
      </span>
     </div>
    </div>
    <div className="rounded-2xl border-2 border-stone-200 px-4 py-3 text-sm font-black text-stone-500 shadow-theme-sm">
     <Clock className="mr-2 inline h-4 w-4" />
     {format(new Date(note.updated_at), "dd MMM yyyy", { locale: vi })}
    </div>
   </div>

   <div className="mt-8 flex flex-1 flex-col items-center justify-center rounded-[24px] bg-stone-50 p-6 text-center">
    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-100 shadow-theme-sm">
     <GraduationCap className="h-12 w-12 text-purple-600" />
    </div>
    <h3 className="mt-6 text-3xl font-black text-stone-900">Sẵn sàng ôn cấu trúc</h3>
    <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-stone-500">
     Giai đoạn này dùng ghi chú làm nguồn học chính. Mở ghi chú để xem đầy đủ ví dụ, giải thích và chỉnh nội dung.
    </p>
   </div>

   <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr]">
    <Link
     href={`/notes/${note.id}`}
     className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white text-base font-black uppercase tracking-wide text-stone-800 shadow-theme-sm hover:bg-stone-50"
    >
     <FileText className="h-5 w-5" />
     Xem ghi chú
    </Link>
    <button
     type="button"
     className="h-14 rounded-2xl bg-purple-500 text-base font-black uppercase tracking-wide text-white shadow-theme-md hover:bg-purple-600"
    >
     Luyện chủ đề này
    </button>
   </div>
  </div>
 );
}

function EmptyGrammarPanel() {
 return (
  <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
   <Sparkles className="h-16 w-16 text-stone-300" />
   <h2 className="mt-5 text-3xl font-black text-stone-900">Chưa có ngữ pháp</h2>
   <p className="mt-3 max-w-md text-base font-bold leading-7 text-stone-500">
    Tạo ghi chú ngữ pháp đầu tiên để gom cấu trúc câu quan trọng.
   </p>
   <div className="mt-6">
    <CreateGrammarNoteDialog />
   </div>
  </div>
 );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: "yellow" | "blue" | "green" }) {
 const toneClass = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return (
  <div className={cn("min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm", toneClass)}>
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
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
    .map((tag) => tag.trim())
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
    <Button className="h-12 rounded-2xl bg-purple-500 px-5 font-black text-white shadow-theme-sm hover:bg-purple-600">
     <Plus className="h-4 w-4" />
     Tạo ngữ pháp
    </Button>
   </DialogTrigger>

   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>Tạo ghi chú ngữ pháp</DialogTitle>
     <DialogDescription>Nhập tiêu đề cho ghi chú ngữ pháp mới</DialogDescription>
    </DialogHeader>

    <form
     onSubmit={(event) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
     }}
    >
     <DialogBody>
      <form.Field
       name="title"
       validators={{
        onChange: ({ value }) => (!value ? "Tiêu đề không được để trống" : undefined),
       }}
      >
       {(field) => (
        <div className="space-y-2">
         <label className="text-sm font-bold text-text-primary">Tiêu đề ghi chú</label>
         <Input
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder="VD: Cấu trúc 把 (bǎ)"
          className="border-border-default focus-visible:ring-accent"
         />
         {field.state.meta.errors ? (
          <p className="text-xs font-medium text-danger">{field.state.meta.errors}</p>
         ) : null}
        </div>
       )}
      </form.Field>

      <form.Field name="tags">
       {(field) => (
        <div className="mt-4 space-y-2">
         <label className="text-sm font-bold text-text-primary">Tags</label>
         <Input
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder="VD: Ngữ pháp, HSK 2"
          className="border-border-default focus-visible:ring-accent"
         />
        </div>
       )}
      </form.Field>
     </DialogBody>

     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
       Hủy
      </Button>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
       {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting} className="bg-purple-500 hover:bg-purple-600">
         Tạo ghi chú
        </Button>
       )}
      </form.Subscribe>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
