"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { getHanyuLessonMeta } from "@/features/hanzihome/static-json/hanyu-lesson-meta";

import { BookSectionContent } from "./BookSectionContent";
import { LessonModuleFrame, LessonModuleSidebarItem } from "./LessonModuleFrame";
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
 const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
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

 function updateGlobalDisplayMode(key: "showPinyin" | "showMeaning") {
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

 function updateSectionDisplayMode(key: "showPinyin" | "showMeaning") {
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
    variant="outline"
    size="sm"
    onClick={() => updateGlobalDisplayMode("showPinyin")}
   >
    Pinyin: {globalDisplayMode.showPinyin ? "Bật" : "Tắt"}
   </Button>
   <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => updateGlobalDisplayMode("showMeaning")}
   >
    Nghĩa: {globalDisplayMode.showMeaning ? "Bật" : "Tắt"}
   </Button>
  </div>
 );

 return (
  <LessonModuleFrame
   title="Bài khóa"
   subtitle={`${lessonDocument.lesson.title.zh} · ${lessonMeta.volumeVi}`}
   sidebarLabel="Đề mục"
   sidebarSummary={`${sections.length} phần`}
   sidebarOpen={isSectionListVisible}
   onSidebarOpenChange={setIsSectionListVisible}
   sidebarSelectionKey={selectedSectionId}
   sidebar={
    <div className="grid max-h-[calc(100vh-11rem)] content-start gap-2 overflow-y-auto pr-1">
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
    <>
     <div className="hidden xl:block">{readingControls}</div>
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="xl:hidden"
      onClick={() => setIsReadingSettingsOpen(true)}
     >
      <Settings2 className="h-4 w-4" />
      Cài đặt đọc
     </Button>
     <Badge>{sections.length} phần</Badge>
    </>
   }
  >
   <Card padding="lg" className="rounded-xl">
    <section className="min-w-0">
     <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
        <Icon className="h-5 w-5" />
       </span>
       <div>
        <h3 className="text-lg font-black text-text-primary">
         {selectedSection?.title ?? "Toàn bộ bài khóa"}
        </h3>
        {(selectedSection?.subtitle || !selectedSection) && (
         <p className="text-sm font-semibold text-text-muted">
          {selectedSection?.subtitle ?? `${sections.length} đề mục`}
         </p>
        )}
       </div>
      </div>
      <div className="flex flex-wrap gap-2">
       <Button
        type="button"
        variant="outline"
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
        variant="outline"
        size="sm"
        onClick={() =>
         selectedSection
          ? updateSectionDisplayMode("showMeaning")
          : updateGlobalDisplayMode("showMeaning")
        }
       >
        Nghĩa phần: {selectedSectionDisplayMode.showMeaning ? "Bật" : "Tắt"}
       </Button>
      </div>
     </div>
     <div className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
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
           className="rounded-xl border border-border-default bg-bg-subtle p-4"
          >
           <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
             <SectionIcon className="h-4 w-4" />
            </span>
            <div>
             <h4 className="text-base font-black text-text-primary">{section.title}</h4>
             {section.subtitle && (
              <p className="text-sm font-semibold text-text-muted">{section.subtitle}</p>
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
