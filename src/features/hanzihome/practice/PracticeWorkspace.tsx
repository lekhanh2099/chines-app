"use client";

import { useState } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/lesson-text/LessonTextInlineEditor";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { LessonDictationWorkspace } from "./LessonDictationWorkspace";
import { TranslationPracticeWorkspace } from "./TranslationPracticeWorkspace";

export function PracticeWorkspace({
 compact,
 selectedSectionId,
 onSelectSection,
}: {
 compact?: boolean;
 selectedSectionId: string;
 onSelectSection: (sectionId: string) => void;
}) {
 const runtime = useHanziHomeRuntime();
 const [translationOpen, setTranslationOpen] = useState(false);
 const [dictationOpen, setDictationOpen] = useState(false);
 const workspaceTab = dictationOpen ? "dictation" : translationOpen ? "translation" : "exercises";

 return (
  <div className="grid min-w-0">
   <Tabs
    value={workspaceTab}
    items={[
     { key: "exercises", label: "Bài tập" },
     { key: "translation", label: "Translation" },
     { key: "dictation", label: "Nghe chép" },
    ]}
    onValueChange={(value) => {
     setTranslationOpen(value === "translation");
     setDictationOpen(value === "dictation");
    }}
    aria-label="Phòng luyện tập"
   >
    <TabsContent value={workspaceTab} className="pt-3">
     {dictationOpen ? (
      <LessonDictationWorkspace sourceLesson={runtime.lesson.sourceLesson} />
     ) : translationOpen ? (
      <TranslationPracticeWorkspace />
     ) : (
      <LessonTextInlineEditor
       compact={compact}
       selectedSectionId={selectedSectionId}
       onSelectSection={onSelectSection}
       practiceOnly
      />
     )}
    </TabsContent>
   </Tabs>
  </div>
 );
}
