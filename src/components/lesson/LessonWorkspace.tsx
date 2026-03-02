"use client";

import { useState, useCallback } from "react";
import { ReadingFrame } from "./ReadingFrame";
import { ExerciseFrame } from "./ExerciseFrame";
import { InspectorPanel } from "./InspectorPanel";

export type WordData = {
 pinyin: string;
 meaning: string;
 components: string;
 logic: string;
 trap: string;
 example: string;
};

export type LessonData = {
 id: string;
 title: string;
 content: string;
 dictionary: Record<string, WordData>;
};

type LessonWorkspaceProps = {
 lesson: LessonData;
};

export function LessonWorkspace({ lesson }: LessonWorkspaceProps) {
 const [selectedWord, setSelectedWord] = useState<string | null>(null);

 const handleWordSelect = useCallback((word: string | null) => {
  setSelectedWord(word);
 }, []);

 return (
  <div className="grid grid-cols-[1fr_400px] gap-6 h-full">
   <div className="flex flex-col gap-6 overflow-y-auto pr-2">
    <ReadingFrame
     content={lesson.content}
     dictionary={lesson.dictionary}
     onWordSelect={handleWordSelect}
    />
    <ExerciseFrame />
   </div>

   <div className="h-full">
    <InspectorPanel
     word={selectedWord}
     data={selectedWord ? lesson.dictionary[selectedWord] : null}
     onClose={() => handleWordSelect(null)}
    />
   </div>
  </div>
 );
}
