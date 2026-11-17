import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

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
 item,
 displayMode,
 readingItems,
 readingSections,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
}) {
 const { family } = getExerciseRendererMeta(item.type);

 if (family === "matching") {
  return <MatchingExerciseBody item={item} displayMode={displayMode} />;
 }
 if (family === "phonetics") {
  return <PhoneticsExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "substitution") {
  return <SubstitutionExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "dialogue") {
  return <CompleteDialogueExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "communication") {
  return <CommunicationExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "reorder") {
  return <ReorderExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "writing") {
  return <WritingExerciseBody item={item} displayMode={displayMode} />;
 }

 if (family === "reference") {
  return <ExerciseReferenceBody item={item} displayMode={displayMode} />;
 }

 return (
  <QuestionExerciseBody
   item={item}
   displayMode={displayMode}
   readingItems={readingItems}
   readingSections={readingSections}
  />
 );
}
