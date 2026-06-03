"use client";

import { FileText, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import { LessonTypographyControls } from "@/features/hanzihome/components/lesson-overview/LessonTypographyControls";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

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

const allSectionsId = "__all_lesson_sections__";

function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

function sectionSubtitle(section: Section) {
 if (section.type === "text") return `${section.blocks.length} phần bài khóa`;
 if (section.type === "reading") return `${section.items.length} bài đọc`;
 if (section.type === "exercises")
  return `${section.items.length} nhóm bài tập`;
 if (section.type === "communication")
  return `${section.items.length} hội thoại`;
 if (section.type === "character_writing")
  return `${section.items.length} chữ luyện viết`;
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
  <Card
   padding="sm"
   className="rounded-xl border-border-default bg-bg-primary sm:p-4"
  >
   <article className="grid gap-3">
    <div className="flex flex-wrap items-end justify-between gap-2">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       {section.type.replaceAll("_", " ")}
      </p>
      <h2 className="text-lg font-black text-text-primary sm:text-xl">
       {sectionTitle(section)}
      </h2>
      {sectionSubtitle(section) && (
       <p className="text-sm font-semibold text-text-muted">
        {sectionSubtitle(section)}
       </p>
      )}
     </div>
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
 const sourceSections = useMemo(
  () =>
   lesson.sourceLesson?.lesson.sections
    .filter((section) => lessonTextSectionTypes.has(section.type))
    .sort((a, b) => a.order - b.order) ?? [],
  [lesson.sourceLesson],
 );
 const [selectedSectionId, setSelectedSectionId] = useState<string>(
  sourceSections[0]?.id ?? allSectionsId,
 );
 const [isSectionNavOpen, setIsSectionNavOpen] = useState(false);
 const selectedSection =
  sourceSections.find((section) => section.id === selectedSectionId) ??
  sourceSections[0] ??
  null;
 const showAllSections = selectedSectionId === allSectionsId;

 function toggleDisplayMode(key: "showPinyin" | "showMeaning") {
  setDisplayMode((current) => ({ ...current, [key]: !current[key] }));
 }

 return (
  <div className="grid gap-2.5 sm:gap-3">
   <div className="sticky top-0 z-20 rounded-lg border border-border-default bg-bg-primary/95 px-2 py-1.5 shadow-theme-sm backdrop-blur sm:px-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="flex min-w-0 flex-1 items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-8 px-2 text-xs sm:px-2.5 sm:text-[0.8rem]"
       onClick={() => setIsSectionNavOpen((current) => !current)}
      >
       {isSectionNavOpen ? (
        <PanelLeftClose className="h-4 w-4" />
       ) : (
        <PanelLeftOpen className="h-4 w-4" />
       )}
       {isSectionNavOpen ? "Ẩn mục" : "Mục"}
      </Button>

      <p className="min-w-0 truncate text-sm font-bold text-text-secondary">
       {showAllSections
        ? `${sourceSections.length} đề mục`
        : selectedSection
          ? sectionTitle(selectedSection)
          : "Chưa có nội dung"}
      </p>
     </div>

     <div className="flex w-full flex-wrap items-center justify-start gap-1.5 md:w-auto md:justify-end">
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
       className="h-8 px-2.5 text-xs sm:text-[0.8rem]"
       onClick={() => toggleDisplayMode("showPinyin")}
      >
       Pinyin: {displayMode.showPinyin ? "Bật" : "Tắt"}
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-8 px-2.5 text-xs sm:text-[0.8rem]"
       onClick={() => toggleDisplayMode("showMeaning")}
      >
       Nghĩa: {displayMode.showMeaning ? "Bật" : "Tắt"}
      </Button>
     </div>
    </div>
   </div>

   {sourceSections.length > 0 ? (
    <div
     className={cn(
      "grid min-w-0 gap-2.5",
      isSectionNavOpen &&
       "lg:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)] xl:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]",
     )}
    >
     {isSectionNavOpen && (
      <Card
       padding="sm"
       className="h-fit rounded-xl border-border-default bg-bg-primary lg:sticky lg:top-24"
      >
       <div className="grid gap-2">
        <button
         type="button"
         onClick={() => setSelectedSectionId(allSectionsId)}
         className={cn(
          "flex gap-2 rounded-lg border p-2.5 text-left transition-colors",
          showAllSections
           ? "border-primary bg-primary text-primary-foreground"
           : "border-border-default bg-bg-subtle hover:bg-bg-primary",
         )}
        >
         <Layers className="mt-0.5 h-4 w-4 shrink-0" />
         <span className="min-w-0">
          <span className="block text-sm font-black">Xem toàn bộ</span>
          <span className="mt-0.5 block text-xs font-bold opacity-75">
           {sourceSections.length} đề mục
          </span>
         </span>
        </button>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:max-h-[calc(100dvh-15rem)] lg:overflow-y-auto lg:pb-0 lg:pr-1 scrollbar-soft">
         {sourceSections.map((section, index) => {
          const Icon = sectionIcons[section.type] ?? FileText;
          const active =
           !showAllSections && selectedSection?.id === section.id;

          return (
           <button
            key={section.id}
            type="button"
            onClick={() => setSelectedSectionId(section.id)}
            className={cn(
             "flex min-w-52 gap-2 rounded-lg border p-2.5 text-left transition-colors lg:min-w-0",
             active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border-default bg-bg-subtle hover:bg-bg-primary",
            )}
           >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">
             <span className="line-clamp-2 text-sm font-black">
              {index + 1}. {sectionTitle(section)}
             </span>
             {sectionSubtitle(section) && (
              <span className="mt-0.5 block truncate text-xs font-bold opacity-75">
               {sectionSubtitle(section)}
              </span>
             )}
            </span>
           </button>
          );
         })}
        </div>
       </div>
      </Card>
     )}

     <div className="grid min-w-0 gap-2.5">
      {showAllSections ? (
       sourceSections.map((section) => (
        <TextbookSectionCard
         key={section.id}
         section={section}
         displayMode={displayMode}
        />
       ))
      ) : selectedSection ? (
       <TextbookSectionCard
        section={selectedSection}
        displayMode={displayMode}
       />
      ) : null}
     </div>
    </div>
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
