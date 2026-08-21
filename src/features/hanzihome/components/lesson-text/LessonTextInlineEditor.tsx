"use client";

import { FileText, Layers } from "lucide-react";
import { useCallback, useMemo, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
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
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import {
 lessonTextToReaderDocument,
 type LessonReaderEditBinding,
} from "@/features/hanzihome/reader/adapters/lesson-text.adapter";
import {
 ReaderSurface,
 type ReaderSurfaceRenderSection,
 type ReaderSurfaceRenderSegment,
} from "@/features/hanzihome/reader/components/ReaderSurface";

const allSectionsId = "__all_lesson_sections__";
const practiceSectionTypes = new Set<Section["type"]>([
 "exercises",
 "reading",
 "communication",
 "character_writing",
]);

type TextSection = Extract<Section, { type: "text" }>;

type LessonTextInlineEditorProps = {
 compact?: boolean;
 practiceOnly?: boolean;
 selectedSectionId: string;
 onSelectSection: (sectionId: string) => void;
};

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
 const displayMode =
  runtime.learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
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
 const readingSections = useMemo(
  () => sourceSections.filter((section) => section.type === "reading"),
  [sourceSections],
 );
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections = selectedSectionId === allSectionsId || !selectedSection;

 const sectionPathFor = useCallback(
  (section: Section): EditableNodePath => {
   const sourceIndex =
    lesson.sourceLesson?.lesson.sections.findIndex(
     (sourceSection) => sourceSection.id === section.id,
    ) ?? -1;
   return ["lesson", "sections", sourceIndex >= 0 ? sourceIndex : sourceSections.indexOf(section)];
  },
  [lesson.sourceLesson, sourceSections],
 );

 const visibleTextSections = useMemo(
  () =>
   (showAllSections ? sourceSections : selectedSection ? [selectedSection] : []).filter(
    (section): section is TextSection => section.type === "text",
   ),
  [selectedSection, showAllSections, sourceSections],
 );
 const lessonReader = useMemo(
  () =>
   lessonTextToReaderDocument({
    documentId: `${lesson.id}:text:${visibleTextSections.map((section) => section.id).join(",")}`,
    lessonId: lesson.id,
    titleZh: lesson.titleZh,
    titlePinyin: lesson.titlePinyin,
    titleVi: lesson.title,
    sections: visibleTextSections,
    sectionPathFor,
   }),
  [
   lesson.id,
   lesson.title,
   lesson.titlePinyin,
   lesson.titleZh,
   sectionPathFor,
   visibleTextSections,
  ],
 );

 const wrapBinding = (binding: LessonReaderEditBinding | undefined, content: ReactNode) => {
  if (!binding) return content;
  return <EditableNodeWrapper {...binding}>{content}</EditableNodeWrapper>;
 };
 const renderReaderSegment = useCallback<ReaderSurfaceRenderSegment>(
  ({ segment, content }) => wrapBinding(lessonReader.segmentBindings.get(segment.id), content),
  [lessonReader.segmentBindings],
 );
 const renderReaderSection = useCallback<ReaderSurfaceRenderSection>(
  ({ section, content }) => wrapBinding(lessonReader.sectionBindings.get(section.id), content),
  [lessonReader.sectionBindings],
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
     return (
      <LessonModuleSidebarItem
       key={section.id}
       selected={!showAllSections && selectedSection?.id === section.id}
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
    return (
     <LessonModuleSidebarRailItem
      key={section.id}
      icon={<Icon className="h-4 w-4" />}
      label={`${section.order}. ${sectionTitle(section)}`}
      selected={!showAllSections && selectedSection?.id === section.id}
      onClick={() => onSelectSection(section.id)}
     />
    );
   })}
  </>
 );

 const renderTextReader = () =>
  lessonReader.document.segments.length > 0 ? (
   <ReaderSurface
    document={lessonReader.document}
    lessonId={lesson.id}
    compact={compact}
    renderSegment={renderReaderSegment}
    renderSection={renderReaderSection}
   />
  ) : null;
 const firstTextSectionId = visibleTextSections[0]?.id;

 return (
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
  >
   {sourceSections.length > 0 ? (
    <div className="grid min-w-0 gap-2.5">
     {showAllSections ? (
      sourceSections.map((section) => {
       if (section.type === "text") {
        if (section.id !== firstTextSectionId) return null;
        return lessonReader.document.segments.length > 0 ? (
         <div key={section.id}>{renderTextReader()}</div>
        ) : (
         <TextbookSectionCard
          key={section.id}
          lessonId={lesson.id}
          section={section}
          sectionPath={sectionPathFor(section)}
          displayMode={displayMode}
          readingItems={readingItems}
          readingSections={readingSections}
          interactiveReading={!practiceOnly}
          readingMode={false}
         />
        );
       }
       return (
        <TextbookSectionCard
         key={section.id}
         lessonId={lesson.id}
         section={section}
         sectionPath={sectionPathFor(section)}
         displayMode={displayMode}
         readingItems={readingItems}
         readingSections={readingSections}
         interactiveReading={!practiceOnly}
         readingMode={false}
        />
       );
      })
     ) : selectedSection?.type === "text" && lessonReader.document.segments.length > 0 ? (
      renderTextReader()
     ) : selectedSection ? (
      <TextbookSectionCard
       lessonId={lesson.id}
       section={selectedSection}
       sectionPath={sectionPathFor(selectedSection)}
       displayMode={displayMode}
       readingItems={readingItems}
       readingSections={readingSections}
       interactiveReading={!practiceOnly}
       readingMode={false}
      />
     ) : null}
    </div>
   ) : (
    <Card variant="subtle" padding="md">
     <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
      {practiceOnly
       ? "Bài này chưa có bài tập hoặc nội dung đọc hiểu."
       : "Chưa có bài khóa trong JSON của bài này."}
     </Typography>
    </Card>
   )}
  </LessonModuleFrame>
 );
}
