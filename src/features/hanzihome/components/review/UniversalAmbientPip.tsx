"use client";

import { useMemo, useState } from "react";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
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

 const modeItems = useMemo<SegmentedControlItem<UniversalPipMode>[]>(
  () =>
   availableModes.map(({ mode, label, count }) => ({
    key: mode,
    label: `${label} (${count})`,
   })),
  [availableModes],
 );

 const modeSwitcher =
  availableModes.length > 1 ? (
   <SegmentedControl
    value={activeMode}
    items={modeItems}
    onChange={setUserSelectedMode}
    density="toolbar"
    surface="subtle"
   />
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
