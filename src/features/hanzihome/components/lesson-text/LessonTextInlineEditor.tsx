"use client";

import { Popover } from "@base-ui/react";
import { Eye, FileText, Layers } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { TextbookSectionCard } from "@/features/hanzihome/components/lesson-text/TextbookSectionCard";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { LessonTypographyControls } from "@/features/hanzihome/components/lesson-overview/LessonTypographyControls";
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { useHanziHomeLessonSections } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";

type LessonTextInlineEditorProps = {
 compact?: boolean;
};

const allSectionsId = "__all_lesson_sections__";

export function LessonTextInlineEditor({ compact = false }: LessonTextInlineEditorProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const actions = useHanziHomeFeatureActions();
 const sectionResource = useHanziHomeLessonSections(lesson.id);
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const selectedSectionId = useHanziHomeFeatureSelector(
  (state) => state.lessonTextSelectedSectionId,
 );
 const isSectionNavOpen = useHanziHomeFeatureSelector((state) => state.lessonTextSidebarOpen);
 const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
 const sourceSections = useMemo(
  () =>
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ??
   sectionResource?.sections ??
   [],
  [lesson.sourceLesson, sectionResource],
 );
 const readingItems = useMemo(
  () => sourceSections.flatMap((section) => (section.type === "reading" ? section.items : [])),
  [sourceSections],
 );
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections = selectedSectionId === allSectionsId || !selectedSection;
 const sectionPathFor = (section: Section): EditableNodePath => {
  const sourceIndex =
   lesson.sourceLesson?.lesson.sections.findIndex(
    (sourceSection) => sourceSection.id === section.id,
   ) ?? -1;

  return ["lesson", "sections", sourceIndex >= 0 ? sourceIndex : sourceSections.indexOf(section)];
 };

 function updateDisplayMode(updates: Partial<typeof displayMode>) {
  const nextDisplayMode = { ...displayMode, ...updates };

  actions.setLessonTextDisplayMode(updates);
  runtime.updateLearningSettings({ lessonTextDisplayMode: nextDisplayMode });
 }

 function toggleDisplayMode(key: "showPinyin" | "showMeaning" | "showAnswers") {
  updateDisplayMode({ [key]: !displayMode[key] });
 }

 const readingControls = (
  <div className="flex flex-wrap items-center gap-1.5">
   <LessonTypographyControls displayMode={displayMode} onChange={updateDisplayMode} />
   <Button
    type="button"
    variant={displayMode.showPinyin ? "active" : "outline"}
    size="sm"
    className="h-8 px-2.5 text-xs"
    onClick={() => toggleDisplayMode("showPinyin")}
   >
    Pinyin: {displayMode.showPinyin ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant={displayMode.showMeaning ? "active" : "outline"}
    size="sm"
    className="h-8 px-2.5 text-xs"
    onClick={() => toggleDisplayMode("showMeaning")}
   >
    Nghĩa: {displayMode.showMeaning ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant={displayMode.showAnswers ? "active" : "outline"}
    size="sm"
    className="h-8 px-2.5 text-xs"
    onClick={() => toggleDisplayMode("showAnswers")}
   >
    Đáp án: {displayMode.showAnswers ? "Bật" : "Tắt"}
   </Button>
  </div>
 );

 const sidebar = (
  <div className="grid gap-2">
   <LessonModuleSidebarItem
    selected={showAllSections}
    title="Xem toàn bộ"
    subtitle={`${sourceSections.length} đề mục`}
    icon={<Layers className="h-4 w-4" />}
    onClick={() => actions.selectLessonTextSection(allSectionsId)}
   />

   <div className="grid max-h-[calc(100dvh-15rem)] gap-2 overflow-y-auto pr-1 scrollbar-soft">
    {sourceSections.map((section, index) => {
     const Icon = sectionIcons[section.type] ?? FileText;
     const active = !showAllSections && selectedSection?.id === section.id;

     return (
      <LessonModuleSidebarItem
       key={section.id}
       selected={active}
       title={`${index + 1}. ${sectionTitle(section)}`}
       subtitle={sectionSubtitle(section)}
       icon={<Icon className="h-4 w-4" />}
       onClick={() => actions.selectLessonTextSection(section.id)}
      />
     );
    })}
   </div>
  </div>
 );
 const sidebarRail = (
  <>
   <LessonModuleSidebarRailItem
    icon={<Layers className="h-4 w-4" />}
    label={`Xem toàn bộ ${sourceSections.length} đề mục`}
    selected={showAllSections}
    onClick={() => actions.selectLessonTextSection(allSectionsId)}
   />
   {sourceSections.map((section, index) => {
    const Icon = sectionIcons[section.type] ?? FileText;
    const active = !showAllSections && selectedSection?.id === section.id;

    return (
     <LessonModuleSidebarRailItem
      key={section.id}
      icon={<Icon className="h-4 w-4" />}
      label={`${index + 1}. ${sectionTitle(section)}`}
      selected={active}
      onClick={() => actions.selectLessonTextSection(section.id)}
     />
    );
   })}
  </>
 );

 return (
  <>
   {!compact ? (
    <Popover.Root
     open={isReadingSettingsOpen}
     onOpenChange={setIsReadingSettingsOpen}
     modal={false}
    >
     <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}>
      <Popover.Trigger
       className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-bg-card/80 px-3 text-sm font-semibold whitespace-nowrap shadow-theme-sm backdrop-blur transition-all outline-none hover:border-primary/25 hover:bg-accent-subtle hover:text-accent-text focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
       aria-label="Mở cài đặt hiển thị bài đọc"
      >
       <Eye className="h-4 w-4" />
       Hiển thị
      </Popover.Trigger>
     </HanziHomeCommandBarPortal>
     <Popover.Portal>
      <Popover.Positioner
       side="bottom"
       align="end"
       sideOffset={8}
       collisionPadding={12}
       positionMethod="fixed"
       style={{ zIndex: 80 }}
      >
       <Popover.Popup
        initialFocus={false}
        finalFocus={false}
        className="w-[min(34rem,calc(100vw-1.5rem))] rounded-2xl border border-border-default bg-bg-elevated p-3 shadow-theme-lg"
       >
        <div className="mb-3 flex items-center justify-between gap-3">
         <p className="text-sm font-black text-text-primary">Cài đặt đọc</p>
         <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setIsReadingSettingsOpen(false)}
         >
          Đóng
         </Button>
        </div>
        {readingControls}
       </Popover.Popup>
      </Popover.Positioner>
     </Popover.Portal>
    </Popover.Root>
   ) : null}
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
    onSidebarOpenChange={actions.setLessonTextSidebarOpen}
    sidebar={sidebar}
    sidebarRail={sidebarRail}
    sidebarSelectionKey={selectedSectionId}
    compact={compact}
    actions={
     compact ? (
      <Popover.Root
       open={isReadingSettingsOpen}
       onOpenChange={setIsReadingSettingsOpen}
       modal={false}
      >
       <Popover.Trigger className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-bg-card/80 px-2.5 text-xs font-semibold whitespace-nowrap shadow-theme-sm transition-all outline-none hover:bg-accent-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
        <Eye className="h-4 w-4" />
        Cài đặt đọc
       </Popover.Trigger>
       <Popover.Portal>
        <Popover.Positioner
         side="bottom"
         align="end"
         sideOffset={8}
         collisionPadding={12}
         positionMethod="fixed"
         style={{ zIndex: 80 }}
        >
         <Popover.Popup
          initialFocus={false}
          finalFocus={false}
          className="w-[min(34rem,calc(100vw-1.5rem))] rounded-2xl border border-border-default bg-bg-elevated p-3 shadow-theme-lg"
         >
          {readingControls}
         </Popover.Popup>
        </Popover.Positioner>
       </Popover.Portal>
      </Popover.Root>
     ) : null
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
         readingItems={readingItems}
        />
       ))
      ) : selectedSection ? (
       <TextbookSectionCard
        lessonId={lesson.id}
        section={selectedSection}
        sectionPath={sectionPathFor(selectedSection)}
        displayMode={displayMode}
        readingItems={readingItems}
       />
      ) : null}
     </div>
    ) : (
     <Card padding="sm" className="rounded-xl sm:p-4">
      <div className="rounded-xl border border-border-default bg-bg-subtle p-3  font-semibold text-text-muted sm:p-4">
       Chưa có bài khóa trong JSON của bài này.
      </div>
     </Card>
    )}
   </LessonModuleFrame>
  </>
 );
}
