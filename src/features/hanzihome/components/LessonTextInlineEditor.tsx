"use client";

import { FileText, Layers, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonTypographyControls } from "@/features/hanzihome/components/lesson-overview/LessonTypographyControls";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { useHanziHomeLessonSections } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type { DraftPatchPath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

type LessonTextInlineEditorProps = {
 lesson: HanziHomeLesson;
 compact?: boolean;
};

const allSectionsId = "__all_lesson_sections__";

function TextbookSectionCard({
 lessonId,
 section,
 sectionPath,
 displayMode,
}: {
 lessonId: string;
 section: Section;
 sectionPath: DraftPatchPath;
 displayMode: LessonDisplayMode;
}) {
 return (
  <Card padding="sm" className="rounded-xl border-border-default bg-bg-primary sm:p-4">
   <article className="grid gap-3">
    <div className="flex flex-wrap items-end justify-between gap-2">
     <div>
      <p className="text-[0.7rem] font-black uppercase tracking-wide text-text-muted">
       {section.type.replaceAll("_", " ")}
      </p>
      <h2 className="text-lg font-black text-text-primary sm:text-xl">{sectionTitle(section)}</h2>
      {sectionSubtitle(section) && (
       <p className="text-sm font-semibold text-text-muted">{sectionSubtitle(section)}</p>
      )}
     </div>
    </div>

    <BookSectionContent
     lessonId={lessonId}
     section={section}
     sectionPath={sectionPath}
     displayMode={displayMode}
    />
   </article>
  </Card>
 );
}

export function LessonTextInlineEditor({ lesson, compact = false }: LessonTextInlineEditorProps) {
 const sectionResource = useHanziHomeLessonSections(lesson.id);
 const [displayMode, setDisplayMode] = useState<LessonDisplayMode>(DEFAULT_LESSON_DISPLAY_MODE);
 const sourceSections = useMemo(
  () =>
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ??
   sectionResource?.sections ??
   [],
  [lesson.sourceLesson, sectionResource],
 );
 const [selectedSectionId, setSelectedSectionId] = useState<string>(allSectionsId);
 const [isSectionNavOpen, setIsSectionNavOpen] = useState(true);
 const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections = selectedSectionId === allSectionsId || !selectedSection;
 const sectionPathFor = (section: Section): DraftPatchPath => {
  const sourceIndex =
   lesson.sourceLesson?.lesson.sections.findIndex(
    (sourceSection) => sourceSection.id === section.id,
   ) ?? -1;

  return ["lesson", "sections", sourceIndex >= 0 ? sourceIndex : sourceSections.indexOf(section)];
 };

 function toggleDisplayMode(key: "showPinyin" | "showMeaning") {
  setDisplayMode((current) => ({ ...current, [key]: !current[key] }));
 }

 const readingControls = (
  <div className="flex flex-wrap items-center gap-1.5">
   <LessonTypographyControls
    displayMode={displayMode}
    onChange={(updates) => setDisplayMode((current) => ({ ...current, ...updates }))}
   />
   <Button
    type="button"
    variant="outline"
    size="sm"
    className="h-8 px-2.5 text-xs"
    onClick={() => toggleDisplayMode("showPinyin")}
   >
    Pinyin: {displayMode.showPinyin ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant="outline"
    size="sm"
    className="h-8 px-2.5 text-xs"
    onClick={() => toggleDisplayMode("showMeaning")}
   >
    Nghĩa: {displayMode.showMeaning ? "Bật" : "Tắt"}
   </Button>
  </div>
 );

 const sidebar = (
  <div className="grid gap-2">
   <button
    type="button"
    onClick={() => setSelectedSectionId(allSectionsId)}
    className={cn(
     "flex gap-2 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
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

   <div className="grid max-h-[calc(100dvh-15rem)] gap-2 overflow-y-auto pr-1 scrollbar-soft">
    {sourceSections.map((section, index) => {
     const Icon = sectionIcons[section.type] ?? FileText;
     const active = !showAllSections && selectedSection?.id === section.id;

     return (
      <button
       key={section.id}
       type="button"
       onClick={() => setSelectedSectionId(section.id)}
       className={cn(
        "flex gap-2 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
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
         <span className="mt-0.5 block line-clamp-2 text-xs font-bold opacity-75">
          {sectionSubtitle(section)}
         </span>
        )}
       </span>
      </button>
     );
    })}
   </div>
  </div>
 );

 return (
  <LessonModuleFrame
   title="Bài khóa"
   subtitle={
    showAllSections
     ? "Toàn bộ nội dung bài"
     : selectedSection
       ? sectionTitle(selectedSection)
       : "Chưa có nội dung"
   }
   sidebarLabel="Đề mục"
   sidebarSummary={`${sourceSections.length} mục`}
   sidebarOpen={isSectionNavOpen}
   onSidebarOpenChange={setIsSectionNavOpen}
   sidebar={sidebar}
   sidebarSelectionKey={selectedSectionId}
   compact={compact}
   actions={
    <>
     <div className={cn("hidden", !compact && "xl:block")}>{readingControls}</div>
     <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 px-2.5 text-xs", !compact && "xl:hidden")}
      onClick={() => setIsReadingSettingsOpen(true)}
     >
      <Settings2 className="h-4 w-4" />
      Cài đặt đọc
     </Button>
    </>
   }
  >
   {sourceSections.length > 0 ? (
    <div className="grid min-w-0 gap-2.5">
     {showAllSections ? (
      sourceSections.map((section) => (
       <TextbookSectionCard
        key={section.id}
        lessonId={lesson.id}
        section={section}
        sectionPath={sectionPathFor(section)}
        displayMode={displayMode}
       />
      ))
     ) : selectedSection ? (
      <TextbookSectionCard
       lessonId={lesson.id}
       section={selectedSection}
       sectionPath={sectionPathFor(selectedSection)}
       displayMode={displayMode}
      />
     ) : null}
    </div>
   ) : (
    <Card padding="sm" className="rounded-xl sm:p-4">
     <div className="rounded-xl border border-border-default bg-bg-subtle p-3 text-sm font-semibold text-text-muted sm:p-4">
      Chưa có bài khóa trong JSON của bài này.
     </div>
    </Card>
   )}
   <Sheet
    open={isReadingSettingsOpen}
    onOpenChange={setIsReadingSettingsOpen}
    side="bottom"
    className="p-4"
   >
    <SheetHeader title="Cài đặt đọc" onClose={() => setIsReadingSettingsOpen(false)} />
    {readingControls}
   </Sheet>
  </LessonModuleFrame>
 );
}
