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
import { moduleMeta } from "@/features/hanzihome/components/layout/moduleMeta";
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
import type { StudyModule } from "@/features/hanzihome/context/types";
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
 readerToolsMenuContent?: ReactNode;
 readerToolsSheetContent?: ReactNode;
};

export function LessonTextInlineEditor({
 compact = false,
 practiceOnly = false,
 selectedSectionId,
 onSelectSection,
 readerToolsMenuContent,
 readerToolsSheetContent,
}: LessonTextInlineEditorProps) {
 const { lesson } = useHanziHomeRuntime();
 const sectionResource = useHanziHomeLessonSections(lesson.id);
 const sourceSections = useMemo(() => {
  const sections =
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ??
   sectionResource?.sections ??
   [];
  return sections.filter((section) =>
   practiceOnly ? practiceSectionTypes.has(section.type) : section.type === "text",
  );
 }, [lesson.sourceLesson, practiceOnly, sectionResource]);

 return (
  <LessonTextWorkspace
   module={practiceOnly ? "practice" : "lessonText"}
   compact={compact}
   practiceOnly={practiceOnly}
   selectedSectionId={selectedSectionId}
   onSelectSection={onSelectSection}
   sourceSections={sourceSections}
   editable
   readerToolsMenuContent={readerToolsMenuContent}
   readerToolsSheetContent={readerToolsSheetContent}
  />
 );
}

export function ReadOnlyLessonTextWorkspace({
 module,
 compact = false,
 selectedSectionId,
 onSelectSection,
}: LessonTextInlineEditorProps & { module: StudyModule }) {
 const { lesson } = useHanziHomeRuntime();
 const sourceSections = useMemo(() => {
  const sections =
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ?? [];
  return sections.filter((section) => {
   const title = `${section.title} ${section.title_vi}`.toLocaleUpperCase("vi");

   switch (module) {
    case "overview":
     return section.order <= 2;
    case "lessonText":
     return section.type === "text";
    case "notes":
     return section.type === "notes";
    case "vocab":
     return section.type === "vocabulary";
    case "grammar":
     return section.type === "grammar" || title.includes("NGỮ PHÁP");
    case "review":
     return (
      title.includes("TÓM TẮT") || title.includes("BÀI ĐỌC THÊM") || title.includes("THẢO LUẬN")
     );
    case "practice":
     return practiceSectionTypes.has(section.type);
    case "listening":
    case "dictation":
    case "script":
     return false;
   }
  });
 }, [lesson.sourceLesson, module]);

 return (
  <LessonTextWorkspace
   module={module}
   compact={compact}
   practiceOnly={module === "practice"}
   selectedSectionId={selectedSectionId}
   onSelectSection={onSelectSection}
   sourceSections={sourceSections}
   editable={false}
  />
 );
}

function LessonTextWorkspace({
 module,
 compact,
 practiceOnly,
 selectedSectionId,
 onSelectSection,
 sourceSections,
 editable,
 readerToolsMenuContent,
 readerToolsSheetContent,
}: LessonTextInlineEditorProps & {
 module: StudyModule;
 sourceSections: readonly Section[];
 editable: boolean;
}) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const actions = useHanziHomeFeatureActions();
 const displayMode =
  runtime.learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const isSectionNavOpen = useHanziHomeFeatureSelector((state) => state.lessonTextSidebarOpen);
 const readingItems = useMemo(
  () => sourceSections.flatMap((section) => (section.type === "reading" ? section.items : [])),
  [sourceSections],
 );
 const readingSections = useMemo(
  () => sourceSections.filter((section) => section.type === "reading"),
  [sourceSections],
 );
 const showSectionNavigation = module !== "lessonText";
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections =
  !showSectionNavigation || selectedSectionId === allSectionsId || !selectedSection;

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

 const wrapBinding = useCallback(
  (binding: LessonReaderEditBinding | undefined, content: ReactNode) => {
   if (!editable || !binding) return content;
   return <EditableNodeWrapper {...binding}>{content}</EditableNodeWrapper>;
  },
  [editable],
 );
 const renderReaderSegment = useCallback<ReaderSurfaceRenderSegment>(
  ({ segment, content }) => wrapBinding(lessonReader.segmentBindings.get(segment.id), content),
  [lessonReader.segmentBindings, wrapBinding],
 );
 const renderReaderSection = useCallback<ReaderSurfaceRenderSection>(
  ({ section, content }) => wrapBinding(lessonReader.sectionBindings.get(section.id), content),
  [lessonReader.sectionBindings, wrapBinding],
 );

 const sidebar = showSectionNavigation ? (
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
 ) : null;
 const sidebarRail = showSectionNavigation ? (
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
 ) : null;

 const renderTextReader = () =>
  lessonReader.document.segments.length > 0 ? (
   <ReaderSurface
    document={lessonReader.document}
    toolsMenuContent={readerToolsMenuContent}
    toolsSheetContent={readerToolsSheetContent}
    lessonId={editable ? lesson.id : undefined}
    compact={compact}
    displayMode={editable ? undefined : displayMode}
    renderSegment={editable ? renderReaderSegment : undefined}
    renderSection={editable ? renderReaderSection : undefined}
   />
  ) : null;
 const firstTextSectionId = visibleTextSections[0]?.id;

 return (
  <LessonModuleFrame
   title={moduleMeta[module].label}
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
   mobileNavigation={
    showSectionNavigation
     ? {
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
       }
     : undefined
   }
   compact={compact || !showSectionNavigation}
   showMobileHeader={showSectionNavigation}
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
          lessonId={editable ? lesson.id : undefined}
          section={section}
          sectionPath={editable ? sectionPathFor(section) : undefined}
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
         lessonId={editable ? lesson.id : undefined}
         section={section}
         sectionPath={editable ? sectionPathFor(section) : undefined}
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
       lessonId={editable ? lesson.id : undefined}
       section={selectedSection}
       sectionPath={editable ? sectionPathFor(selectedSection) : undefined}
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
