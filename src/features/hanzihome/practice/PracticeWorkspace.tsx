"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/lesson-text/LessonTextInlineEditor";

import { TtsStudioWorkspace } from "@/features/hanzihome/tts/TtsStudioWorkspace";
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
 const [translationOpen, setTranslationOpen] = useState(false);
 const [ttsStudioOpen, setTtsStudioOpen] = useState(false);

 return (
  <div className="grid min-w-0 gap-3">
   <div className="flex flex-wrap gap-2" role="tablist" aria-label="Phòng luyện tập">
    <Button
     type="button"
     variant={!translationOpen && !ttsStudioOpen ? "active" : "outline"}
     role="tab"
     aria-selected={!translationOpen && !ttsStudioOpen}
     onClick={() => {
      setTranslationOpen(false);
      setTtsStudioOpen(false);
     }}
    >
     Bài tập
    </Button>
    <Button
     type="button"
     variant={translationOpen ? "active" : "outline"}
     role="tab"
     aria-selected={translationOpen}
     onClick={() => {
      setTranslationOpen(true);
      setTtsStudioOpen(false);
     }}
    >
     Translation
    </Button>
    <Button
     type="button"
     variant={ttsStudioOpen ? "active" : "outline"}
     role="tab"
     aria-selected={ttsStudioOpen}
     onClick={() => {
      setTtsStudioOpen(true);
      setTranslationOpen(false);
     }}
    >
     TTS Studio
    </Button>
   </div>
   {ttsStudioOpen ? (
    <TtsStudioWorkspace />
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
  </div>
 );
}
