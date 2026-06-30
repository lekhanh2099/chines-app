import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";
import { QuestionCard } from "./QuestionCard";
import { WordBank } from "./WordBank";

export function QuestionGroupCard({
 lessonId,
 itemPath,
 itemId,
 exerciseType,
 parentExerciseId,
 groupPath,
 groupValue,
 index,
 fallbackTitle,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 exerciseType: string;
 parentExerciseId: string;
 groupPath?: EditableNodePath;
 groupValue: unknown;
 index: number;
 fallbackTitle: string;
 displayMode: LessonDisplayMode;
}) {
 const group = asRecord(groupValue);
 const title =
  stringValue(group, "title_vi") ||
  stringValue(group, "title") ||
  stringValue(group, "label") ||
  fallbackTitle;
 const wordBank = arrayValue(group, "word_bank");
 const questions = arrayValue(group, "questions");
 const answerSourceKey = arrayValue(group, "answers").length > 0 ? "answers" : "answer_key";
 const answers = arrayValue(group, answerSourceKey);
 const sentences = arrayValue(group, "sentences");
 const partEntries = Object.entries(asRecord(group.parts)).map(([label, text]) => ({
  id: label,
  text: `${label}. ${answerToString(text)}`,
 }));
 const orderedAnswer =
  nonEmptyStrings(arrayValue(group, "answer_order")).join(" → ") ||
  stringValue(group, "sample_text") ||
  stringValue(group, "answer");
 const note = stringValue(group, "explanation_vi") || stringValue(group, "note_vi");

 return (
  <div className="exercise-card-surface grid gap-3 rounded-xl border p-3">
   <div>
    <h5 className="font-black text-text-primary">
     {index + 1}. {title}
    </h5>
    {note && <p className=" font-semibold text-text-muted">{note}</p>}
   </div>

   <WordBank values={wordBank} />

   {questions.length > 0 && (
    <div className="grid gap-2">
     {questions.map((questionValue, questionIndex) => {
      const questionId =
       stringValue(asRecord(questionValue), "id") || `${itemId}-question-${questionIndex}`;
      const content = (
       <QuestionCard
        itemId={itemId}
        exerciseType={exerciseType}
        questionValue={questionValue}
        index={questionIndex}
        displayMode={displayMode}
        answerOverride={answers[questionIndex]}
       />
      );

      return lessonId && itemPath && groupPath ? (
       <EditableNodeWrapper
        key={questionId}
        lessonId={lessonId}
        entityType="exercise_question"
        entityId={questionId}
        parentEntityType="exercise"
        parentEntityId={parentExerciseId}
        path={[...itemPath, ...groupPath, "questions", questionIndex]}
        value={questionValue}
        label={`Câu ${index + 1}.${questionIndex + 1}`}
       >
        {content}
       </EditableNodeWrapper>
      ) : (
       <div key={questionId}>{content}</div>
      );
     })}
    </div>
   )}

   {sentences.length > 0 && <LooseItemGrid items={sentences} displayMode={displayMode} />}

   {partEntries.length > 0 && <LooseItemGrid items={partEntries} displayMode={displayMode} />}

   {orderedAnswer && (
    <EditableAnswerKeyList
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={`${itemId}-ordered-answer`}
     sourcePath={groupPath ? [...groupPath, "ordered_answer"] : ["ordered_answer"]}
     values={[orderedAnswer]}
     showAnswers={displayMode.showAnswers}
    />
   )}

   {questions.length === 0 && answers.length > 0 && !orderedAnswer && (
    <EditableAnswerKeyList
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={`${itemId}-answers`}
     sourcePath={groupPath ? [...groupPath, answerSourceKey] : [answerSourceKey]}
     values={answers}
     showAnswers={displayMode.showAnswers}
    />
   )}
  </div>
 );
}
