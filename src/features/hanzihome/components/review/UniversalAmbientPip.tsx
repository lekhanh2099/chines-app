"use client";

import { useMemo, useState } from "react";
import { NativeSelect } from "@/components/ui/forms/native-select";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { PipGrammarPoint } from "./pip-grammar-adapter";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { AmbientPipFlashcard } from "./AmbientPipFlashcard";
import { AmbientPipGrammarCard } from "./AmbientPipGrammarCard";
import { AmbientPipExerciseRunner } from "./AmbientPipExerciseRunner";

export type UniversalPipMode = "vocab" | "grammar" | "practice";

export type UniversalAmbientPipProps = {
 readonly initialMode?: UniversalPipMode;
 readonly lessonTitle?: string;
 readonly vocabItems?: readonly HanziHomeVocabItem[];
 readonly grammarItems?: readonly PipGrammarPoint[];
 readonly practiceItems?: readonly UniversalExerciseItem[];
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
};

export function UniversalAmbientPip({
 initialMode = "vocab",
 lessonTitle = "Ôn tập bài học",
 vocabItems = [],
 grammarItems = [],
 practiceItems = [],
 onClose,
 isFloatingInApp = false,
}: UniversalAmbientPipProps) {
 const availableModes = useMemo(() => {
  const modes: { mode: UniversalPipMode; label: string; count: number }[] = [];
  if (vocabItems.length > 0) {
   modes.push({
    mode: "vocab",
    label: "Từ vựng",
    count: vocabItems.length,
   });
  }
  if (grammarItems.length > 0) {
   modes.push({
    mode: "grammar",
    label: "Ngữ pháp",
    count: grammarItems.length,
   });
  }
  if (practiceItems.length > 0) {
   modes.push({
    mode: "practice",
    label: "Bài tập",
    count: practiceItems.length,
   });
  }
  return modes;
 }, [vocabItems.length, grammarItems.length, practiceItems.length]);

 const [userSelectedMode, setUserSelectedMode] = useState<UniversalPipMode | null>(null);

 const activeMode = useMemo<UniversalPipMode>(() => {
  if (userSelectedMode && availableModes.some((m) => m.mode === userSelectedMode)) {
   return userSelectedMode;
  }
  const isInitialAvailable = availableModes.some((m) => m.mode === initialMode);
  if (isInitialAvailable) return initialMode;
  return availableModes[0]?.mode ?? "vocab";
 }, [availableModes, initialMode, userSelectedMode]);

 const modeSwitcher =
  availableModes.length > 1 ? (
   <NativeSelect
    aria-label="Chọn phần học"
    value={activeMode}
    onChange={(e) => {
     const val = e.target.value;
     if (val === "vocab" || val === "grammar" || val === "practice") {
      setUserSelectedMode(val);
     }
    }}
    density="compact"
    className="max-w-[125px] font-semibold"
   >
    {availableModes.map(({ mode, label, count }) => (
     <option key={mode} value={mode}>
      {`${label} (${count})`}
     </option>
    ))}
   </NativeSelect>
  ) : null;

 if (activeMode === "grammar" && grammarItems.length > 0) {
  return (
   <AmbientPipGrammarCard
    items={grammarItems}
    lessonTitle={lessonTitle}
    onClose={onClose}
    isFloatingInApp={isFloatingInApp}
    extraHeaderActions={modeSwitcher}
   />
  );
 }

 if (activeMode === "practice" && practiceItems.length > 0) {
  return (
   <AmbientPipExerciseRunner
    items={practiceItems}
    lessonTitle={lessonTitle}
    onClose={onClose}
    isFloatingInApp={isFloatingInApp}
    extraHeaderActions={modeSwitcher}
   />
  );
 }

 return (
  <AmbientPipFlashcard
   items={vocabItems}
   lessonTitle={lessonTitle}
   onClose={onClose}
   isFloatingInApp={isFloatingInApp}
   extraHeaderActions={modeSwitcher}
  />
 );
}
