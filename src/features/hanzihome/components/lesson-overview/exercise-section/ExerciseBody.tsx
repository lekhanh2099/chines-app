import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise, ReadingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import type { LessonDisplayMode } from "../types";
import { CommunicationExerciseBody } from "./CommunicationExerciseBody";
import { CompleteDialogueExerciseBody } from "./CompleteDialogueExerciseBody";
import { MatchingExerciseBody } from "./MatchingExerciseBody";
import { PhoneticsExerciseBody } from "./PhoneticsExerciseBody";
import { QuestionExerciseBody } from "./QuestionExerciseBody";
import { SubstitutionExerciseBody } from "./SubstitutionExerciseBody";
import { ExerciseReferenceBody } from "./ExerciseReferenceBody";
import { ReorderExerciseBody } from "./ReorderExerciseBody";
import { WritingExerciseBody } from "./WritingExerciseBody";
import { getExerciseRendererMeta } from "./exercise-renderer-registry";

export function ExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
 readingItems,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
}) {
 const { family } = getExerciseRendererMeta(item.type);

 if (family === "matching") {
  return (
   <MatchingExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }
 if (family === "phonetics") {
  return (
   <PhoneticsExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "substitution") {
  return (
   <SubstitutionExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "dialogue") {
  return (
   <CompleteDialogueExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "communication") {
  return (
   <CommunicationExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "reorder") {
  return (
   <ReorderExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "writing") {
  return (
   <WritingExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (family === "reference") {
  return (
   <ExerciseReferenceBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 return (
  <QuestionExerciseBody
   lessonId={lessonId}
   itemPath={itemPath}
   item={item}
   displayMode={displayMode}
   readingItems={readingItems}
  />
 );
}
