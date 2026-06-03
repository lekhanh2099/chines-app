"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHanyuLessonMeta } from "@/features/hanzihome/static-json/hanyu-lesson-meta";
import { cn } from "@/lib/utils";

import { BookSectionContent } from "./BookSectionContent";
import { LessonTypographyControls } from "./LessonTypographyControls";
import { BookOpen, sectionIcons } from "./section-icons";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
 type SourceLessonOverviewProps,
} from "./types";
import { getBookSections } from "./utils";

export function SourceLessonOverview({
 lessonDocument,
}: SourceLessonOverviewProps) {
 const sections = useMemo(
  () => getBookSections(lessonDocument),
  [lessonDocument],
 );
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
  null,
 );
 const [isSectionListVisible, setIsSectionListVisible] = useState(true);
 const [globalDisplayMode, setGlobalDisplayMode] =
  useState<LessonDisplayMode>(DEFAULT_LESSON_DISPLAY_MODE);
 const [sectionDisplayOverrides, setSectionDisplayOverrides] = useState<
  Record<string, Partial<LessonDisplayMode>>
 >({});
 const selectedSection =
  sections.find((section) => section.id === selectedSectionId) ??
  sections[0] ??
  null;
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

 if (!selectedSection) return null;
 const Icon = sectionIcons[selectedSection.type] ?? BookOpen;
 const selectedSectionDisplayMode = {
  ...globalDisplayMode,
  ...sectionDisplayOverrides[selectedSection.id],
 };

 function updateSectionDisplayMode(key: "showPinyin" | "showMeaning") {
  setSectionDisplayOverrides((current) => ({
   ...current,
   [selectedSection.id]: {
    ...current[selectedSection.id],
    [key]: !selectedSectionDisplayMode[key],
   },
  }));
 }

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Bài học
      </p>
      <h2 className="text-xl font-black text-text-primary">
       {lessonDocument.lesson.title.zh}
      </h2>
      <p className="text-sm font-semibold text-text-muted">
       {lessonMeta.volumeVi}
       {globalDisplayMode.showPinyin && lessonMeta.titlePinyin
        ? ` · ${lessonMeta.titlePinyin}`
        : ""}
     </p>
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <LessonTypographyControls
       displayMode={globalDisplayMode}
       onChange={updateGlobalTypography}
      />
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={() => updateGlobalDisplayMode("showPinyin")}
      >
       Pinyin bài: {globalDisplayMode.showPinyin ? "Bật" : "Tắt"}
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={() => updateGlobalDisplayMode("showMeaning")}
      >
       Nghĩa bài: {globalDisplayMode.showMeaning ? "Bật" : "Tắt"}
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={() => setIsSectionListVisible((value) => !value)}
      >
       {isSectionListVisible ? "Ẩn danh sách" : "Hiện danh sách"}
      </Button>
      <Badge>{sections.length} phần</Badge>
     </div>
    </div>

    <div
     className={cn(
      "grid gap-3",
      isSectionListVisible && "lg:grid-cols-[18rem_minmax(0,1fr)]",
     )}
    >
     {isSectionListVisible && (
      <div className="grid max-h-[32rem] content-start gap-2 overflow-y-auto pr-1">
       {sections.map((section, index) => {
        const SectionIcon = sectionIcons[section.type] ?? BookOpen;
        return (
         <button
          key={section.id}
          type="button"
          onClick={() => setSelectedSectionId(section.id)}
          className={cn(
           "flex gap-3 rounded-xl border p-3 text-left transition-colors",
           selectedSection.id === section.id
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border-default bg-bg-primary hover:bg-bg-subtle",
          )}
         >
          <SectionIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
           <span className="line-clamp-2 text-sm font-black">
            {index + 1}. {section.title}
           </span>
           {section.subtitle && (
            <span className="mt-1 block text-xs font-bold opacity-75">
             {section.subtitle}
            </span>
           )}
          </span>
         </button>
        );
       })}
      </div>
     )}

     <section className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
       <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
         <Icon className="h-5 w-5" />
        </span>
        <div>
         <h3 className="text-lg font-black text-text-primary">
          {selectedSection.title}
         </h3>
         {selectedSection.subtitle && (
          <p className="text-sm font-semibold text-text-muted">
           {selectedSection.subtitle}
          </p>
         )}
        </div>
       </div>
      <div className="flex flex-wrap gap-2">
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => updateSectionDisplayMode("showPinyin")}
       >
        Pinyin phần: {selectedSectionDisplayMode.showPinyin ? "Bật" : "Tắt"}
       </Button>
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => updateSectionDisplayMode("showMeaning")}
       >
        Nghĩa phần: {selectedSectionDisplayMode.showMeaning ? "Bật" : "Tắt"}
       </Button>
      </div>
      </div>
      <div className="max-h-[34rem] overflow-y-auto pr-2">
       <BookSectionContent
        section={selectedSection.section}
        displayMode={selectedSectionDisplayMode}
       />
      </div>
     </section>
    </div>
   </div>
  </Card>
 );
}
