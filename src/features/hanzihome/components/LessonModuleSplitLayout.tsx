"use client";

import type { ReactNode } from "react";
import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
 ExternalLink,
 Loader2,
 PanelRightClose,
 PanelRightOpen,
 Plus,
 Save,
} from "lucide-react";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson, HanziHomeModule } from "@/features/hanzihome/types";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";

type LessonStudyModule = Exclude<HanziHomeModule, "radicals">;

type LessonModuleSplitLayoutProps = {
 lesson: HanziHomeLesson;
 module: LessonStudyModule;
 defaultOpen?: boolean;
 children: ReactNode;
};

const splitPreferenceKey = "hanzihome:lesson-module-note-split";
const splitPreferenceChangeEvent = "hanzihome:lesson-module-note-split-change";

const moduleLabels: Record<LessonStudyModule, string> = {
 overview: "Tổng quan",
 lessonText: "Bài khóa",
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 review: "Ôn tập",
};

function readSplitPreference(defaultOpen: boolean) {
 if (typeof window === "undefined") return defaultOpen;

 try {
  const stored = window.localStorage.getItem(splitPreferenceKey);
  if (stored === "open") return true;
  if (stored === "closed") return false;
 } catch {
  return defaultOpen;
 }

 return defaultOpen;
}

function writeSplitPreference(open: boolean) {
 if (typeof window === "undefined") return;

 try {
  window.localStorage.setItem(splitPreferenceKey, open ? "open" : "closed");
  window.dispatchEvent(new Event(splitPreferenceChangeEvent));
 } catch {
  // Local storage can be unavailable in private or restricted browser modes.
 }
}

function subscribeSplitPreference(onStoreChange: () => void) {
 if (typeof window === "undefined") return () => { };

 window.addEventListener("storage", onStoreChange);
 window.addEventListener(splitPreferenceChangeEvent, onStoreChange);

 return () => {
  window.removeEventListener("storage", onStoreChange);
  window.removeEventListener(splitPreferenceChangeEvent, onStoreChange);
 };
}

function useSplitPreference(defaultOpen: boolean) {
 const getSnapshot = useCallback(
  () => readSplitPreference(defaultOpen),
  [defaultOpen],
 );
 const getServerSnapshot = useCallback(() => defaultOpen, [defaultOpen]);
 const splitOpen = useSyncExternalStore(
  subscribeSplitPreference,
  getSnapshot,
  getServerSnapshot,
 );

 return [splitOpen, writeSplitPreference] as const;
}

function textNode(text: string, format = 0) {
 return {
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
 };
}

function paragraph(text: string) {
 return {
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
  textFormat: 0,
  textStyle: "",
 };
}

function heading(text: string) {
 return {
  children: [textNode(text, 1)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  tag: "h2",
  version: 1,
 };
}

function createInitialNoteContent(lesson: HanziHomeLesson) {
 return {
  root: {
   children: [
    heading(`Ghi chú: ${lesson.title}`),
    paragraph("Ghi chú riêng cho bài này. Autosave trực tiếp."),
    paragraph("Điểm cần nhớ: "),
    paragraph(""),
    paragraph("Câu tự đặt: "),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

function LessonNotePanel({ lesson }: { lesson: HanziHomeLesson }) {
 const linkedNoteQuery = useLessonLinkedNote(lesson.id, "main");
 const createNoteMutation = useCreateLessonLinkedNote();
 const linkedNote = linkedNoteQuery.data;
 const noteDetail = useNoteDetail(linkedNote?.id ?? "");

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: lesson.id,
    relationType: "main",
    title: `Ghi chú: ${lesson.title}`,
    category: "general",
    tags: ["hanzihome", lesson.id, "lesson-note"],
    content: createInitialNoteContent(lesson),
   },
   {
    onSuccess: () => {
     toast.success("Đã tạo note cho bài học");
    },
    onError: () => {
     toast.error("Không tạo được note cho bài học");
    },
   },
  );
 };

 if (linkedNoteQuery.isLoading) {
  return (
   <NotePanelShell title="Ghi chú bài học" status="Đang kiểm tra note...">
    <div className="rounded-lg border border-border-default bg-bg-subtle p-3 text-sm font-semibold text-text-muted">
     Đang kiểm tra note...
    </div>
   </NotePanelShell>
  );
 }

 if (!linkedNote) {
  return (
   <NotePanelShell
    title="Ghi chú bài học"
    status="Chưa có note"
    action={
     <Button
      type="button"
      size="sm"
      disabled={createNoteMutation.isPending}
      onClick={handleCreate}
     >
      {createNoteMutation.isPending ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
       <Plus className="h-4 w-4" />
      )}
      Tạo note
     </Button>
    }
   >
    <button
     type="button"
     disabled={createNoteMutation.isPending}
     onClick={handleCreate}
     className="rounded-lg border border-dashed border-border-default bg-bg-subtle p-3 text-left text-sm font-semibold text-text-muted transition-colors hover:border-accent-muted hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-60"
    >
     Ghi chú riêng cho bài này. Autosave trực tiếp sau khi tạo.
    </button>
   </NotePanelShell>
  );
 }

 if (noteDetail.isLoading) {
  return (
   <NotePanelShell title={linkedNote.title} status="Đang tải editor...">
    <div className="rounded-lg border border-border-default bg-bg-subtle p-3 text-sm font-semibold text-text-muted">
     Đang tải editor...
    </div>
   </NotePanelShell>
  );
 }

 const note = noteDetail.note;

 if (!note) {
  return (
   <NotePanelShell title={linkedNote.title} status="Không tìm thấy note">
    <div className="rounded-lg border border-border-default bg-bg-subtle p-3 text-sm font-semibold text-text-muted">
     Không tìm thấy note đã gắn với bài này.
    </div>
   </NotePanelShell>
  );
 }

 return (
  <NotePanelShell
   title={note.title}
   status={noteDetail.isSaving ? "Đang lưu..." : "Autosave trực tiếp"}
   action={
    <Button asChild variant="outline" size="sm">
     <Link href={`/notes/${note.id}`}>
      <ExternalLink className="h-4 w-4" />
      Mở
     </Link>
    </Button>
   }
  >
   <div className="min-h-96 overflow-hidden rounded-lg border border-border-default bg-bg-primary shadow-theme-sm">
    <Editor
     key={`lesson-module-note-${note.id}`}
     initialContent={note.content}
     onChange={noteDetail.saveContent}
     seamless
    />
   </div>
  </NotePanelShell>
 );
}

function NotePanelShell({
 title,
 status,
 action,
 children,
}: {
 title: string;
 status: string;
 action?: ReactNode;
 children: ReactNode;
}) {
 return (
  <Card
   padding="md"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <aside className="grid gap-3">
    <div className="flex items-start justify-between gap-2">
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Lesson note
      </p>
      <h2 className="truncate text-base font-black text-text-primary">
       {title}
      </h2>
      <p className="inline-flex items-center gap-1 text-xs font-bold text-text-muted">
       <Save className="h-3.5 w-3.5" />
       {status}
      </p>
     </div>
     {action}
    </div>

    {children}
   </aside>
  </Card>
 );
}

export function LessonModuleSplitLayout({
 lesson,
 module,
 defaultOpen = false,
 children,
}: LessonModuleSplitLayoutProps) {
 const [splitOpen, setSplitOpen] = useSplitPreference(defaultOpen);
 const moduleLabel = moduleLabels[module];

 const handleToggleSplit = () => {
  setSplitOpen(!splitOpen);
 };

 return (
  <section className="grid gap-2">
   <div className="flex justify-end">
    <Button
     type="button"
     variant={splitOpen ? "default" : "outline"}
     size="sm"
     onClick={handleToggleSplit}
     aria-label={`${splitOpen ? "Đóng" : "Mở"} note cho ${moduleLabel}`}
     className={splitOpen ? "shadow-theme-sm" : ""}
    >
     {splitOpen ? (
      <PanelRightClose className="h-4 w-4" />
     ) : (
      <PanelRightOpen className="h-4 w-4" />
     )}
     {splitOpen ? "Đóng note" : "Mở note"}
    </Button>
   </div>

   <div
    className={
     splitOpen
      ? "grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]"
      : "grid min-w-0 gap-3"
    }
   >
    <div className="min-w-0">{children}</div>
    {splitOpen && <LessonNotePanel lesson={lesson} />}
   </div>
  </section>
 );
}
