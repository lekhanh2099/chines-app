"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import { LessonTypographyControls } from "@/features/hanzihome/components/lesson-overview/LessonTypographyControls";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
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

function TextbookSectionCard({
 section,
 displayMode,
}: {
 section: Section;
 displayMode: LessonDisplayMode;
}) {
 return (
  <Card padding="sm" className="rounded-xl sm:p-4">
   <article className="grid gap-3 sm:gap-4">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      {section.type.replaceAll("_", " ")}
     </p>
     <h2 className="text-lg font-black text-text-primary sm:text-xl">
      {sectionTitle(section)}
     </h2>
     {sectionSubtitle(section) && (
      <p className="text-sm font-semibold text-text-muted">{sectionSubtitle(section)}</p>
     )}
    </div>

    <BookSectionContent section={section} displayMode={displayMode} />
   </article>
  </Card>
 );
}

export function LessonTextInlineEditor({ lesson }: LessonTextInlineEditorProps) {
 const [displayMode, setDisplayMode] = useState<LessonDisplayMode>(
  DEFAULT_LESSON_DISPLAY_MODE,
 );
 const sourceSections = lesson.sourceLesson?.lesson.sections
  .filter((section) => lessonTextSectionTypes.has(section.type))
  .sort((a, b) => a.order - b.order) ?? [];

 function toggleDisplayMode(key: "showPinyin" | "showMeaning") {
  setDisplayMode((current) => ({ ...current, [key]: !current[key] }));
 }

 return (
   <div className="grid gap-2.5 sm:gap-3">
   <Card
    padding="sm"
    className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
     <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
      <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle sm:flex">
       <FileText className="h-5 w-5" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Bài khóa
       </p>
       <h2 className="text-lg font-black text-text-primary sm:text-xl">
        Nội dung bài học
       </h2>
       <p className="hidden text-sm font-semibold text-text-muted sm:block">
        Render trực tiếp từ JSON bài học, giữ cấu trúc như sách.
       </p>
      </div>
     </div>

     <div className="flex w-full flex-wrap items-center justify-start gap-1.5 sm:w-auto sm:justify-end sm:gap-2">
      <LessonTypographyControls
       displayMode={displayMode}
       onChange={(updates) =>
        setDisplayMode((current) => ({ ...current, ...updates }))
       }
      />
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-8 px-2.5"
       onClick={() => toggleDisplayMode("showPinyin")}
      >
       Pinyin: {displayMode.showPinyin ? "Bật" : "Tắt"}
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-8 px-2.5"
       onClick={() => toggleDisplayMode("showMeaning")}
      >
       Nghĩa: {displayMode.showMeaning ? "Bật" : "Tắt"}
      </Button>
     </div>
    </div>
   </Card>

   {sourceSections.length > 0 ? (
    sourceSections.map((section) => (
     <TextbookSectionCard
      key={section.id}
      section={section}
      displayMode={displayMode}
     />
    ))
   ) : (
    <Card padding="sm" className="rounded-xl sm:p-4">
     <div className="rounded-xl border border-border-default bg-bg-subtle p-3 text-sm font-semibold text-text-muted sm:p-4">
      Chưa có bài khóa trong JSON của bài này.
     </div>
    </Card>
   )}
  </div>
 );
}
