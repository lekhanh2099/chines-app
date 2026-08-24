"use client";

import { useState } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/lesson-text/LessonTextInlineEditor";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { TtsStudioWorkspace } from "@/features/hanzihome/tts/TtsStudioWorkspace";
import { ttsStudioTextFromLesson } from "./translation-practice";
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
 const [ttsStudioOpen, setTtsStudioOpen] = useState(false);
 const ttsSourceText = ttsStudioTextFromLesson(runtime.lesson.sourceLesson);
 const workspaceTab = ttsStudioOpen ? "tts" : translationOpen ? "translation" : "exercises";

 return (
  <div className="grid min-w-0">
   <Tabs
    value={workspaceTab}
    items={[
     { key: "exercises", label: "Bài tập" },
     { key: "translation", label: "Translation" },
     { key: "tts", label: "TTS Studio" },
    ]}
    onValueChange={(value) => {
     setTranslationOpen(value === "translation");
     setTtsStudioOpen(value === "tts");
    }}
    aria-label="Phòng luyện tập"
   >
    <TabsContent value={workspaceTab} className="pt-3">
     {ttsStudioOpen ? (
      <TtsStudioWorkspace key={ttsSourceText} sourceText={ttsSourceText} />
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
