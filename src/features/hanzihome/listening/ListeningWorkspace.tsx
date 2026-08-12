"use client";

import { useMemo, useState } from "react";
import { Headphones } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
 ReaderHanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";

import { ListeningExerciseItems } from "./ListeningExerciseItems";
import { MandarinTtsControls } from "./MandarinTtsControls";
import { useSharedMandarinTts } from "./MandarinTtsProvider";
import { useHanziHomeListeningLesson } from "./useHanziHomeListeningLesson";
import { itemsForListeningSection } from "./listening.view-model";
import { listeningCategoryLabels } from "./listening.labels";
import { LISTENING_CATEGORIES } from "./listening.types";
import { z } from "zod";

export function ListeningWorkspace() {
 const runtime = useHanziHomeRuntime();
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const tts = useSharedMandarinTts();
 const query = useHanziHomeListeningLesson(runtime.lesson.id);
 const [selectedSectionId, setSelectedSectionId] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [showScript, setShowScript] = useState(false);
 const [hideScriptBeforeCheck, setHideScriptBeforeCheck] = useState(true);
 const [showTranslationAfterCheck, setShowTranslationAfterCheck] = useState(true);
 const bundle = query.data;
 const selectedSection =
  bundle?.sections.find((section) => section.id === selectedSectionId) ?? bundle?.sections[0];
 const selectedItems = useMemo(
  () => (bundle && selectedSection ? itemsForListeningSection(bundle, selectedSection.id) : []),
  [bundle, selectedSection],
 );
 const playAllText = useMemo(() => {
  const parts: string[] = [];
  const sectionTranscript = selectedSection?.transcript?.full.zh.trim();
  if (sectionTranscript) parts.push(sectionTranscript);

  for (const item of selectedItems) {
   const itemTranscript = item.transcript?.full.zh.trim();
   if (itemTranscript && itemTranscript !== sectionTranscript) parts.push(itemTranscript);
   if (item.promptZh?.trim()) parts.push(item.promptZh.trim());
  }

  return parts.join("\n");
 }, [selectedItems, selectedSection]);

 if (query.isPending) {
  return (
   <Card variant="default" padding="lg" className="flex min-h-64 items-center justify-center gap-2">
    <Spinner />
    <StudyInstructionText as="span" tone="muted" weight="bold">
     Đang tải bài luyện nghe…
    </StudyInstructionText>
   </Card>
  );
 }

 if (query.isError || !bundle || !selectedSection) {
  return (
   <Card
    variant="default"
    padding="lg"
    className="grid min-h-64 place-content-center gap-2 text-center"
   >
    <StudyInstructionText tone="default" weight="black">
     Không tải được bài luyện nghe
    </StudyInstructionText>
    <StudyInstructionText variant="bodySmall" tone="muted">
     {query.error?.message ?? "Bài này chưa có dữ liệu nghe."}
    </StudyInstructionText>
   </Card>
  );
 }

 const sidebar = (
  <div className="grid content-start gap-2">
   {LISTENING_CATEGORIES.map((category) => {
    const sections = bundle.sections.filter((section) => section.category === category);
    if (sections.length === 0) return null;
    return (
     <div key={category} className="grid gap-1.5">
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       scale="micro"
       className="px-1 pt-2"
      >
       {listeningCategoryLabels[category]}
      </StudyInstructionText>
      {sections.map((section, index) => (
       <LessonModuleSidebarItem
        key={section.id}
        selected={section.id === selectedSection.id}
        title={`${index + 1}. ${section.titleZh}`}
        subtitle={section.titleVi}
        icon={<Headphones />}
        onClick={() => setSelectedSectionId(section.id)}
       />
      ))}
     </div>
    );
   })}
  </div>
 );

 return (
  <LessonModuleFrame
   title="Luyện nghe"
   subtitle={`${bundle.lesson.titleZh}${bundle.lesson.titleVi ? ` · ${bundle.lesson.titleVi}` : ""}`}
   sidebarLabel="Đề mục"
   sidebarSummary={`${bundle.sections.length} nhóm`}
   sidebarOpen={sidebarOpen}
   onSidebarOpenChange={setSidebarOpen}
   sidebarSelectionKey={selectedSection.id}
   sidebar={sidebar}
   sidebarRail={
    <>
     {bundle.sections.map((section, index) => (
      <LessonModuleSidebarRailItem
       key={section.id}
       icon={
        <StudyInstructionText as="span" variant="caption" weight="black">
         {index + 1}
        </StudyInstructionText>
       }
       label={section.titleZh}
       selected={section.id === selectedSection.id}
       onClick={() => setSelectedSectionId(section.id)}
      />
     ))}
    </>
   }
   actions={<Badge variant="purple">{selectedItems.length} câu</Badge>}
  >
   <div className="grid gap-2.5">
    <MandarinTtsControls
     text={playAllText}
     tts={tts}
     hideScriptBeforeCheck={hideScriptBeforeCheck}
     onHideScriptBeforeCheckChange={setHideScriptBeforeCheck}
     showTranslationAfterCheck={showTranslationAfterCheck}
     onShowTranslationAfterCheckChange={setShowTranslationAfterCheck}
    />

    <Button
     type="button"
     variant={showScript ? "active" : "outline"}
     size="toolbar"
     className="w-fit"
     aria-pressed={showScript}
     onClick={() => setShowScript((current) => !current)}
    >
     {showScript ? "Ẩn toàn bộ script" : "Hiện toàn bộ script"}
    </Button>

    <Card variant="section" padding="md" className="grid gap-1.5">
     <Badge variant="purple" className="w-fit">
      Bài luyện nghe
     </Badge>
     <ReaderHanziText as="h2" displayMode={displayMode} size="lg" leading="relaxed">
      {selectedSection.titleZh}
     </ReaderHanziText>
     {selectedSection.titleVi ? (
      <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
       {selectedSection.titleVi}
      </StudyInstructionText>
     ) : null}
     {selectedSection.suggestionsZh.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 pt-1">
       {selectedSection.suggestionsZh.map((suggestion) => (
        <Badge key={suggestion} variant="purple">
         {suggestion}
        </Badge>
       ))}
      </div>
     ) : null}
    </Card>

    <ListeningExerciseItems
     key={selectedSection.id}
     exerciseType={selectedSection.exerciseType}
     items={selectedItems}
     sharedTranscript={selectedSection.transcript}
     showPinyin={displayMode.showPinyin}
     showMeaning={displayMode.showMeaning}
     showScript={showScript}
     hideScriptBeforeCheck={hideScriptBeforeCheck}
     showTranslationAfterCheck={showTranslationAfterCheck}
     displayMode={displayMode}
     onSpeak={tts.speak}
     onSpeakSequence={tts.speakSequence}
     lessonId={runtime.lesson.id}
    />
   </div>
  </LessonModuleFrame>
 );
}
