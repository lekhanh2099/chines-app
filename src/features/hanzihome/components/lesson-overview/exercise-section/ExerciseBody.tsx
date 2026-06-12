import type { DraftPatchPath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import type { LessonDisplayMode } from "../types";
import { CommunicationExerciseBody } from "./CommunicationExerciseBody";
import { CompleteDialogueExerciseBody } from "./CompleteDialogueExerciseBody";
import { MatchingExerciseBody } from "./MatchingExerciseBody";
import { PhoneticsExerciseBody } from "./PhoneticsExerciseBody";
import { QuestionExerciseBody } from "./QuestionExerciseBody";
import { SubstitutionExerciseBody } from "./SubstitutionExerciseBody";

export function ExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: DraftPatchPath;
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 if (item.type === "matching") {
  return (
   <MatchingExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }
 if (item.type === "phonetics" || item.type === "read_aloud") {
  return <PhoneticsExerciseBody item={item} displayMode={displayMode} />;
 }

 if (item.type === "substitution" || item.type === "substitution_drill") {
  return (
   <SubstitutionExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (item.type === "complete_dialogue") {
  return (
   <CompleteDialogueExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 if (item.type === "communication_dialogue") {
  return (
   <CommunicationExerciseBody
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
  />
 );
}
