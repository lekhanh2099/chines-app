"use client";

import { FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

type LessonTextInlineEditorProps = {
 lesson: HanziHomeLesson;
};

const lessonTextSectionTypes = new Set<Section["type"]>([
 "text",
 "reading",
 "exercises",
 "communication",
 "character_writing",
]);

function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

function sectionSubtitle(section: Section) {
 if (section.type === "text") return `${section.blocks.length} phần bài khóa`;
 if (section.type === "reading") return `${section.items.length} bài đọc`;
 if (section.type === "exercises") return `${section.items.length} nhóm bài tập`;
 if (section.type === "communication") return `${section.items.length} hội thoại`;
 if (section.type === "character_writing") return `${section.items.length} chữ luyện viết`;
 return "";
}

function TextbookSectionCard({ section }: { section: Section }) {
 return (
  <Card padding="lg" className="rounded-xl">
   <article className="grid gap-4">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      {section.type.replaceAll("_", " ")}
     </p>
     <h2 className="text-xl font-black text-text-primary">{sectionTitle(section)}</h2>
     {sectionSubtitle(section) && (
      <p className="text-sm font-semibold text-text-muted">{sectionSubtitle(section)}</p>
     )}
    </div>

    <BookSectionContent section={section} />
   </article>
  </Card>
 );
}

export function LessonTextInlineEditor({ lesson }: LessonTextInlineEditorProps) {
 const sourceSections = lesson.sourceLesson?.lesson.sections
  .filter((section) => lessonTextSectionTypes.has(section.type))
  .sort((a, b) => a.order - b.order) ?? [];

 return (
  <div className="grid gap-3">
   <Card
    padding="lg"
    className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <div className="flex min-w-0 items-start gap-3">
     <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
      <FileText className="h-5 w-5" />
     </span>

     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Bài khóa
      </p>
      <h2 className="text-xl font-black text-text-primary">Nội dung bài học</h2>
      <p className="text-sm font-semibold text-text-muted">
       Render trực tiếp từ JSON bài học, giữ cấu trúc như sách.
      </p>
     </div>
    </div>
   </Card>

   {sourceSections.length > 0 ? (
    sourceSections.map((section) => (
     <TextbookSectionCard key={section.id} section={section} />
    ))
   ) : (
    <Card padding="lg" className="rounded-xl">
     <div className="rounded-xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Chưa có bài khóa trong JSON của bài này.
     </div>
    </Card>
   )}
  </div>
 );
}
