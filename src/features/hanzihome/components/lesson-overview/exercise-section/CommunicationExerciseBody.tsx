import { Fragment } from "react";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { ExerciseQuestionCard } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

export function CommunicationExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogueValue = record.dialogue;
 const dialogue = Array.isArray(dialogueValue)
  ? dialogueValue
  : arrayValue(asRecord(dialogueValue), "lines");
 const questions = arrayValue(record, "questions");
 const tasks = arrayValue(record, "practice_tasks");
 const parts = arrayValue(record, "parts");

 return (
  <div className="grid gap-3">
   {dialogue.length > 0 && (
    <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
     {dialogue.map((lineValue, index) => {
      const line = asRecord(lineValue);

      const lineCard = (
       <TextLineCard
        speaker={stringValue(line, "speaker")}
        zh={stringValue(line, "zh") || stringValue(line, "text")}
        pinyin={stringValue(line, "pinyin")}
        vi={stringValue(line, "vi")}
        displayMode={displayMode}
       />
      );
      const lineId = stringValue(line, "id") || `${stringValue(line, "speaker")}-${index}`;

      return <Fragment key={lineId}>{lineCard}</Fragment>;
     })}
    </div>
   )}

   {tasks.map((taskValue, index) => {
    const task = asRecord(taskValue);
    const sample =
     nonEmptyStrings(arrayValue(task, "sample_answer")).join(" / ") ||
     stringValue(task, "sample_answer_zh") ||
     stringValue(task, "sample_answer_vi") ||
     stringValue(task, "sample_answer");

    const taskId = stringValue(task, "id") || `${item.id}-task-${index}`;
    const content = (
     <ExerciseQuestionCard
      index={index + 1}
      title={
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       stringValue(task, "prompt") ||
       "Luyện tập"
      }
      answer={sample}
      showAnswer={displayMode.showAnswers}
      displayMode={displayMode}
      note={stringValue(task, "explanation_vi")}
     />
    );

    return <Fragment key={taskId}>{content}</Fragment>;
   })}

   {(questions.length > 0 || parts.length > 0) && (
    <QuestionExerciseBody item={item} displayMode={displayMode} />
   )}
  </div>
 );
}
