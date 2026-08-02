"use client";

import { FileText, Layers } from "lucide-react";
import { useMemo } from "react";

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
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { useHanziHomeLessonSections } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import { speechTextForSections } from "./lesson-section-speech";

type LessonTextInlineEditorProps = {
 compact?: boolean;
 practiceOnly?: boolean;
 selectedSectionId: string;
 onSelectSection: (sectionId: string) => void;
};

const allSectionsId = "__all_lesson_sections__";
const practiceSectionTypes = new Set<Section["type"]>([
 "exercises",
 "reading",
 "communication",
 "character_writing",
]);

export function LessonTextInlineEditor({
 compact = false,
 practiceOnly = false,
 selectedSectionId,
 onSelectSection,
}: LessonTextInlineEditorProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const actions = useHanziHomeFeatureActions();
 const sectionResource = useHanziHomeLessonSections(lesson.id);
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const isSectionNavOpen = useHanziHomeFeatureSelector((state) => state.lessonTextSidebarOpen);
 const sourceSections = useMemo(() => {
  const sections =
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ??
   sectionResource?.sections ??
   [];

  return sections.filter((section) =>
   practiceOnly ? practiceSectionTypes.has(section.type) : !practiceSectionTypes.has(section.type),
  );
 }, [lesson.sourceLesson, practiceOnly, sectionResource]);
 const readingItems = useMemo(
  () => sourceSections.flatMap((section) => (section.type === "reading" ? section.items : [])),
  [sourceSections],
 );
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections = selectedSectionId === allSectionsId || !selectedSection;
 const visibleSpeechText = useMemo(
  () =>
   speechTextForSections(
    showAllSections ? sourceSections : selectedSection ? [selectedSection] : [],
   ),
  [selectedSection, showAllSections, sourceSections],
 );
 const sectionPathFor = (section: Section): EditableNodePath => {
  const sourceIndex =
   lesson.sourceLesson?.lesson.sections.findIndex(
    (sourceSection) => sourceSection.id === section.id,
   ) ?? -1;

  return ["lesson", "sections", sourceIndex >= 0 ? sourceIndex : sourceSections.indexOf(section)];
 };

 const readingControls = (
  <MandarinSpeakButton text={visibleSpeechText} actionLabel={compact ? undefined : "Đọc cả đoạn"} />
 );

 const sidebar = (
  <div className="grid gap-2">
   <LessonModuleSidebarItem
    selected={showAllSections}
    title="Xem toàn bộ"
    subtitle={`${sourceSections.length} đề mục`}
    icon={<Layers className="h-4 w-4" />}
    onClick={() => onSelectSection(allSectionsId)}
   />

   <div className="grid max-h-[calc(100dvh-15rem)] gap-2 overflow-y-auto pr-1 scrollbar-soft">
    {sourceSections.map((section) => {
     const Icon = sectionIcons[section.type] ?? FileText;
     const active = !showAllSections && selectedSection?.id === section.id;

     return (
      <LessonModuleSidebarItem
       key={section.id}
       selected={active}
       title={`${section.order}. ${sectionTitle(section)}`}
       subtitle={sectionSubtitle(section)}
       icon={<Icon className="h-4 w-4" />}
       onClick={() => onSelectSection(section.id)}
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
    onClick={() => onSelectSection(allSectionsId)}
   />
   {sourceSections.map((section) => {
    const Icon = sectionIcons[section.type] ?? FileText;
    const active = !showAllSections && selectedSection?.id === section.id;

    return (
     <LessonModuleSidebarRailItem
      key={section.id}
      icon={<Icon className="h-4 w-4" />}
      label={`${section.order}. ${sectionTitle(section)}`}
      selected={active}
      onClick={() => onSelectSection(section.id)}
     />
    );
   })}
  </>
 );

 return (
  <>
   {!compact ? (
    <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}>
     {readingControls}
    </HanziHomeCommandBarPortal>
   ) : null}
   <LessonModuleFrame
    title={practiceOnly ? "Bài tập và đọc hiểu" : "Bài khóa"}
    subtitle={
     showAllSections
      ? practiceOnly
        ? "Luyện tập, đọc hiểu và thực hành"
        : "Toàn bộ nội dung bài"
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
    mobileNavigation={{
     label: "Đề mục",
     value: showAllSections ? allSectionsId : (selectedSection?.id ?? allSectionsId),
     items: [
      { value: allSectionsId, label: "Xem toàn bộ" },
      ...sourceSections.map((section) => ({
       value: section.id,
       label: `${section.order}. ${sectionTitle(section)}`,
      })),
     ],
     onChange: onSelectSection,
    }}
    compact={compact}
    actions={compact ? readingControls : null}
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
       {practiceOnly
        ? "Bài này chưa có bài tập hoặc nội dung đọc hiểu."
        : "Chưa có bài khóa trong JSON của bài này."}
      </div>
     </Card>
    )}
   </LessonModuleFrame>
  </>
 );
}
