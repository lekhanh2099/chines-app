"use client";

import { useState } from "react";
import { LibraryBig, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateCustomHanziHomeCourseMutation } from "@/features/hanzihome/courses/use-custom-courses";

export function CreateCourseDialog() {
 const [open, setOpen] = useState(false);
 const [title, setTitle] = useState("");
 const [subtitle, setSubtitle] = useState("");
 const [type, setType] = useState("custom");
 const [bookTitle, setBookTitle] = useState("");
 const [bookShortTitle, setBookShortTitle] = useState("");

 const createMutation = useCreateCustomHanziHomeCourseMutation();

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const result = await createMutation.mutateAsync({
   title: title.trim(),
   subtitle: subtitle.trim() || undefined,
   type,
   initialBookTitle: bookTitle.trim(),
   initialBookShortTitle: bookShortTitle.trim() || undefined,
  });

  toast.success(`Đã tạo course: ${result.course.title}`);
  setTitle("");
  setSubtitle("");
  setType("custom");
  setBookTitle("");
  setBookShortTitle("");
  setOpen(false);
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button type="button" variant="outline">
     <Plus className="h-4 w-4" />
     Tạo course
    </Button>
   </DialogTrigger>

   <DialogContent className="max-w-2xl">
    <DialogHeader>
     <DialogTitle>Tạo course mới</DialogTitle>
     <DialogDescription>
      Tạo bộ học liệu mới như HSK, Nghe hiểu hoặc giáo trình riêng.
     </DialogDescription>
    </DialogHeader>

    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
     <label className="grid gap-2">
      <span className="text-sm font-bold text-text-primary">Tên course</span>
      <input
       className="h-10 rounded-xl border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none"
       value={title}
       onChange={(event) => setTitle(event.target.value)}
       placeholder="Ví dụ: HSK 4"
       required
       disabled={createMutation.isPending}
      />
     </label>

     <label className="grid gap-2">
      <span className="text-sm font-bold text-text-primary">Mô tả ngắn</span>
      <input
       className="h-10 rounded-xl border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none"
       value={subtitle}
       onChange={(event) => setSubtitle(event.target.value)}
       placeholder="Ví dụ: Từ vựng và ngữ pháp HSK 4"
       disabled={createMutation.isPending}
      />
     </label>

     <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">
       <span className="text-sm font-bold text-text-primary">Loại course</span>
       <input
        className="h-10 rounded-xl border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none"
        value={type}
        onChange={(event) => setType(event.target.value)}
        placeholder="Ví dụ: HSK, Nghe hiểu, Khẩu ngữ, TOCFL"
        required
        disabled={createMutation.isPending}
        list="hanzihome-course-type-suggestions"
       />
       <datalist id="hanzihome-course-type-suggestions">
        <option value="custom" />
        <option value="hanyu" />
        <option value="hsk" />
        <option value="listening" />
        <option value="speaking" />
        <option value="translation" />
        <option value="tocfl" />
       </datalist>
      </label>

      <label className="grid gap-2">
       <span className="text-sm font-bold text-text-primary">
        Tên quyển/sách đầu tiên
       </span>
       <input
        className="h-10 rounded-xl border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none"
        value={bookTitle}
        onChange={(event) => setBookTitle(event.target.value)}
        placeholder="Ví dụ: HSK 4 - Bài học chính"
        required
        disabled={createMutation.isPending}
       />
      </label>
     </div>

     <label className="grid gap-2">
      <span className="text-sm font-bold text-text-primary">
       Tên ngắn của quyển
      </span>
      <input
       className="h-10 rounded-xl border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none"
       value={bookShortTitle}
       onChange={(event) => setBookShortTitle(event.target.value)}
       placeholder="Ví dụ: HSK 4"
       disabled={createMutation.isPending}
      />
     </label>

     {createMutation.error && (
      <p role="alert" className="text-sm font-bold text-destructive">
       {createMutation.error.message}
      </p>
     )}

     <Button
      type="submit"
      disabled={createMutation.isPending}
      className="w-fit"
     >
      {createMutation.isPending ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
       <LibraryBig className="h-4 w-4" />
      )}
      Tạo course
     </Button>
    </form>
   </DialogContent>
  </Dialog>
 );
}
