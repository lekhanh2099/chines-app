"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { getHanyuLessonMeta } from "@/features/hanzihome/static-json/hanyu-lesson-meta";

import { BookSectionContent } from "./BookSectionContent";
import { LessonModuleFrame, LessonModuleSidebarRailItem } from "./LessonModuleFrame";
import { LessonModuleSidebarItem } from "./LessonModuleSidebarItem";
import { LessonTypographyControls } from "./LessonTypographyControls";
import { BookOpen, sectionIcons } from "./section-icons";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
 type SourceLessonOverviewProps,
} from "./types";
import { getBookSections } from "./utils";

const ALL_SECTIONS_ID = "__all_sections__";

export function SourceLessonOverview({ lessonDocument }: SourceLessonOverviewProps) {
 const sections = useMemo(() => getBookSections(lessonDocument), [lessonDocument]);
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
 const [isSectionListVisible, setIsSectionListVisible] = useState(true);
 const [globalDisplayMode, setGlobalDisplayMode] = useState<LessonDisplayMode>(
  DEFAULT_LESSON_DISPLAY_MODE,
 );
 const [sectionDisplayOverrides, setSectionDisplayOverrides] = useState<
  Record<string, Partial<LessonDisplayMode>>
 >({});
 const selectedSection =
  selectedSectionId === ALL_SECTIONS_ID
   ? null
   : (sections.find((section) => section.id === selectedSectionId) ?? sections[0] ?? null);
 const lessonMeta = getHanyuLessonMeta(lessonDocument);

 function updateGlobalDisplayMode(key: "showPinyin" | "showMeaning" | "showAnswers") {
  setGlobalDisplayMode((current) => ({ ...current, [key]: !current[key] }));
  setSectionDisplayOverrides({});
 }

 function updateGlobalTypography(
  updates: Partial<Pick<LessonDisplayMode, "hanziFont" | "hanziSize">>,
 ) {
  setGlobalDisplayMode((current) => ({ ...current, ...updates }));
  setSectionDisplayOverrides({});
 }

 if (sections.length === 0) return null;
 const activeSection = selectedSection ?? sections[0];
 const Icon = sectionIcons[activeSection.type] ?? BookOpen;
 const selectedSectionDisplayMode = {
  ...globalDisplayMode,
  ...(selectedSection ? sectionDisplayOverrides[selectedSection.id] : {}),
 };

 function updateSectionDisplayMode(key: "showPinyin" | "showMeaning" | "showAnswers") {
  setSectionDisplayOverrides((current) => ({
   ...current,
   [activeSection.id]: {
    ...current[activeSection.id],
    [key]: !selectedSectionDisplayMode[key],
   },
  }));
 }

 const readingControls = (
  <div className="flex flex-wrap items-center gap-2">
   <LessonTypographyControls displayMode={globalDisplayMode} onChange={updateGlobalTypography} />
   <Button
    type="button"
    variant={globalDisplayMode.showPinyin ? "active" : "outline"}
    size="sm"
    onClick={() => updateGlobalDisplayMode("showPinyin")}
   >
    Pinyin: {globalDisplayMode.showPinyin ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant={globalDisplayMode.showMeaning ? "active" : "outline"}
    size="sm"
    onClick={() => updateGlobalDisplayMode("showMeaning")}
   >
    Nghĩa: {globalDisplayMode.showMeaning ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant={globalDisplayMode.showAnswers ? "active" : "outline"}
    size="sm"
    onClick={() => updateGlobalDisplayMode("showAnswers")}
   >
    Đáp án: {globalDisplayMode.showAnswers ? "Bật" : "Tắt"}
   </Button>
  </div>
 );

 return (
  <>
   <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_TOOLS_MENU_TARGET_ID}>
    <section className="grid gap-2">
     <p className="px-1 text-xs font-black uppercase tracking-wide text-text-muted">Hiển thị</p>
     {readingControls}
    </section>
   </HanziHomeCommandBarPortal>
  <LessonModuleFrame
   title="Bài khóa"
   subtitle={`${lessonDocument.lesson.title.zh} · ${lessonMeta.volumeVi}`}
   sidebarLabel="Đề mục"
   sidebarSummary={`${sections.length} phần`}
   sidebarOpen={isSectionListVisible}
   onSidebarOpenChange={setIsSectionListVisible}
   sidebarSelectionKey={selectedSectionId}
   mobileNavigation={{
    label: "Đề mục",
    value: selectedSection?.id ?? ALL_SECTIONS_ID,
    items: [
     { value: ALL_SECTIONS_ID, label: "Xem toàn bộ" },
     ...sections.map((section, index) => ({
      value: section.id,
      label: `${index + 1}. ${section.title}`,
     })),
    ],
    onChange: setSelectedSectionId,
   }}
   sidebarRail={
    <>
     <LessonModuleSidebarRailItem
      icon={<BookOpen className="h-4 w-4" />}
      label={`Xem toàn bộ ${sections.length} đề mục`}
      selected={!selectedSection}
      onClick={() => setSelectedSectionId(ALL_SECTIONS_ID)}
     />
     {sections.map((section, index) => {
      const SectionIcon = sectionIcons[section.type] ?? BookOpen;
      return (
       <LessonModuleSidebarRailItem
        key={section.id}
        icon={<SectionIcon className="h-4 w-4" />}
        label={`${index + 1}. ${section.title}`}
        selected={selectedSection?.id === section.id}
        onClick={() => setSelectedSectionId(section.id)}
       />
      );
     })}
    </>
   }
   sidebar={
    <div className="grid max-h-[calc(100dvh-11rem)] content-start gap-2 overflow-y-auto pr-1">
     <LessonModuleSidebarItem
      selected={!selectedSection}
      title="Xem toàn bộ"
      subtitle={`${sections.length} đề mục`}
      icon={<BookOpen className="h-4 w-4" />}
      onClick={() => setSelectedSectionId(ALL_SECTIONS_ID)}
     />
     {sections.map((section, index) => {
      const SectionIcon = sectionIcons[section.type] ?? BookOpen;
      return (
       <LessonModuleSidebarItem
        key={section.id}
        selected={selectedSection?.id === section.id}
        title={`${index + 1}. ${section.title}`}
        subtitle={section.subtitle}
        icon={<SectionIcon className="h-4 w-4" />}
        onClick={() => setSelectedSectionId(section.id)}
       />
      );
     })}
    </div>
   }
   actions={
    <div className="hidden xl:block">{readingControls}</div>
   }
  >
   <Card padding="none" className="rounded-xl p-2.5 sm:p-4 lg:p-5">
    <section className="min-w-0 grid gap-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
        <Icon className="h-5 w-5" />
       </span>
       <div>
        <h3 className="text-lg font-black text-text-primary">
         {selectedSection?.title ?? "Toàn bộ bài khóa"}
        </h3>
        {(selectedSection?.subtitle || !selectedSection) && (
         <p className=" font-semibold text-text-muted">
          {selectedSection?.subtitle ?? `${sections.length} đề mục`}
         </p>
        )}
       </div>
      </div>
      <div className="flex max-w-full gap-2 overflow-x-auto scrollbar-none xl:flex-wrap xl:overflow-visible">
       <Button
        type="button"
        variant={selectedSectionDisplayMode.showPinyin ? "active" : "outline"}
        size="sm"
        onClick={() =>
         selectedSection
          ? updateSectionDisplayMode("showPinyin")
          : updateGlobalDisplayMode("showPinyin")
        }
       >
        Pinyin phần: {selectedSectionDisplayMode.showPinyin ? "Bật" : "Tắt"}
       </Button>
       <Button
        type="button"
        variant={selectedSectionDisplayMode.showMeaning ? "active" : "outline"}
        size="sm"
        onClick={() =>
         selectedSection
          ? updateSectionDisplayMode("showMeaning")
          : updateGlobalDisplayMode("showMeaning")
        }
       >
        Nghĩa phần: {selectedSectionDisplayMode.showMeaning ? "Bật" : "Tắt"}
       </Button>
       <Button
        type="button"
        variant={selectedSectionDisplayMode.showAnswers ? "active" : "outline"}
        size="sm"
        onClick={() =>
         selectedSection
          ? updateSectionDisplayMode("showAnswers")
          : updateGlobalDisplayMode("showAnswers")
        }
       >
        Đáp án phần: {selectedSectionDisplayMode.showAnswers ? "Bật" : "Tắt"}
       </Button>
      </div>
     </div>
     <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto pr-2">
      {selectedSection ? (
       <BookSectionContent
        section={selectedSection.section}
        displayMode={selectedSectionDisplayMode}
       />
      ) : (
       <div className="grid gap-4">
        {sections.map((section) => {
         const SectionIcon = sectionIcons[section.type] ?? BookOpen;
         return (
          <article
           key={section.id}
           className="rounded-xl border border-border-default bg-bg-subtle p-4 grid gap-3"
          >
           <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
             <SectionIcon className="h-4 w-4" />
            </span>
            <div>
             <h4 className="text-base font-black text-text-primary">{section.title}</h4>
             {section.subtitle && (
              <p className=" font-semibold text-text-muted">{section.subtitle}</p>
             )}
            </div>
           </div>
           <BookSectionContent section={section.section} displayMode={globalDisplayMode} />
          </article>
         );
        })}
       </div>
      )}
     </div>
    </section>
   </Card>
  </LessonModuleFrame>
  </>
 );
}
