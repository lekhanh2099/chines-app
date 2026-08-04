import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonFieldValue } from "@/types/json";
import {
 EditableNodeWrapper,
 NestedEditControls,
 type EditableNodePath,
} from "@/features/hanzihome/editing";
import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

import {
 EmptySectionState,
 ExerciseQuestionCard,
 LooseItemGrid,
 hasRenderableValue,
} from "../CommonCards";
import { PassageCard } from "../PassageCard";
import { ReadingQuestionCard } from "../reading-section/ReadingQuestionCard";
import type { LessonDisplayMode } from "../types";
import {
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 hasClozeAnswerValue,
 stringValue,
} from "../utils";
import { EditableAnswerKeyList } from "./EditableAnswerKeyList";
import { ExerciseRenderIssues } from "./ExerciseRenderIssues";
import { ExtraPayloadBlock } from "./ExtraPayloadBlock";
import { InfoBlock } from "./InfoBlock";
import { MatchingColumn } from "./MatchingColumn";
import { QuestionCard } from "./QuestionCard";
import { QuestionGroupCard } from "./QuestionGroupCard";
import { SupplementaryPills } from "./SupplementaryPills";
import { WordBank } from "./WordBank";
import {
 firstArrayByKeys,
 firstArraySource,
 formatAnswer,
 hasExercisePassagePayload,
} from "./exercise-utils";
import { getExerciseRendererMeta } from "./exercise-renderer-registry";

type QuestionExerciseBodyProps = {
 lessonId?: string;
 itemPath?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
};

function questionHasInlineAnswer(value: JsonFieldValue) {
 if (Array.isArray(value)) return value.length > 1;

 const question = asRecord(value);
 const answerRecord = asRecord(question.answer);

 return Boolean(
  stringValue(question, "answer") ||
  stringValue(question, "answer_zh") ||
  stringValue(question, "sample_answer") ||
  stringValue(question, "sample_answer_zh") ||
  stringValue(question, "suggested_answer") ||
  stringValue(question, "suggested_answer_zh") ||
  stringValue(question, "correct") ||
  stringValue(question, "correct_sentence") ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  arrayValue(question, "acceptable_answers").length > 0,
 );
}

function readingReferenceOrder(value: string) {
 const match = /^reading[_-](\d+)(?:[_-][a-z0-9]+)*$/i.exec(value);
 if (!match) return null;

 const order = Number.parseInt(match[1], 10);
 return Number.isFinite(order) ? order : null;
}

function readingSectionReferenceOrder(value: string) {
 const match = /^section_(\d+)_reading$/i.exec(value);
 if (!match) return null;

 const order = Number.parseInt(match[1], 10);
 return Number.isFinite(order) ? order : null;
}

function resolveReferencedReadingItem(
 readingItems: QuestionExerciseBodyProps["readingItems"],
 readingSections: QuestionExerciseBodyProps["readingSections"],
 readingReference: string,
) {
 if (!readingReference) return undefined;

 const exactMatch = readingItems?.find((readingItem) => readingItem.id === readingReference);
 if (exactMatch) return exactMatch;

 const referencedOrder = readingReferenceOrder(readingReference);
 if (referencedOrder !== null) {
  const matchingItems =
   readingItems?.filter((readingItem) => readingItem.order === referencedOrder) ?? [];

  return matchingItems.length === 1 ? matchingItems[0] : undefined;
 }

 const sectionOrder = readingSectionReferenceOrder(readingReference);
 if (sectionOrder === null) return undefined;

 // Imported section references retain their source order after runtime section IDs are normalized.
 const matchingItems =
  readingSections
   ?.filter((section) => section.type === "reading" && section.order === sectionOrder)
   .flatMap((section) => (section.type === "reading" ? section.items : [])) ?? [];

 return matchingItems.length === 1 ? matchingItems[0] : undefined;
}
export function QuestionExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
 readingItems,
 readingSections,
}: QuestionExerciseBodyProps) {
 const record = asRecord(item);

 const questions = arrayValue(record, "questions");
 const items = arrayValue(record, "items");
 const groups = arrayValue(record, "groups");
 const parts = arrayValue(record, "parts");

 const leftSource = firstArraySource(record, [
  "left_items",
  "left",
  "column_a",
  "a_items",
  "prompts",
 ]);
 const leftItems = leftSource?.values ?? [];

 const rightSource = firstArraySource(record, [
  "right_items",
  "right",
  "column_b",
  "b_items",
  "responses",
 ]);
 const rightItems = rightSource?.values ?? [];

 const answerKey =
  arrayValue(record, "blanks").length > 0
   ? arrayValue(record, "blanks")
   : arrayValue(record, "answer_key").length > 0
     ? arrayValue(record, "answer_key")
     : arrayValue(record, "answers");
 const answerKeySource =
  arrayValue(record, "blanks").length > 0
   ? "blanks"
   : arrayValue(record, "answer_key").length > 0
     ? "answer_key"
     : "answers";

 const wordBank = arrayValue(record, "word_bank");
 const readingReference =
  stringValue(record, "reading_ref") ||
  stringValue(record, "reading_id") ||
  stringValue(record, "json_item_id") ||
  stringValue(record, "linked_reading_id") ||
  stringValue(record, "linked_section_id");
 const referencedReading = resolveReferencedReadingItem(
  readingItems,
  readingSections,
  readingReference,
 );
 const referencedReadingRecord = asRecord(referencedReading);

 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 const pattern = stringValue(record, "pattern");
 const model = asRecord(record.model);
 const hasPassagePayload = hasExercisePassagePayload(record);
 const directClozeAnswers = getClozeAnswerValues(record);
 const referencedClozeAnswers = getClozeAnswerValues(referencedReadingRecord);
 const passage =
  (hasPassagePayload ? getPassageLikeValue(record, { includeText: true }) : undefined) ??
  getPassageLikeValue(referencedReadingRecord, { includeText: true });
 const passageRecord = asRecord(passage);
 const passageTitle = stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");
 const showPassageTitle =
  Boolean(passageTitle) && passageTitle !== item.title && passageTitle !== item.title_vi;
 const passageClozeAnswers = getClozeAnswerValues(asRecord(passage));
 const clozeAnswers =
  directClozeAnswers.length > 0
   ? directClozeAnswers
   : referencedClozeAnswers.length > 0
     ? referencedClozeAnswers
     : passageClozeAnswers;
 const clozeAnswerCount = clozeAnswers.filter(hasClozeAnswerValue).length;
 const directPassage = asRecord(record.passage);
 const passageSegmentsPath: EditableNodePath = ["passage", "segments"];
 const segmentsPath: EditableNodePath = ["segments"];
 const passageSegments =
  arrayValue(directPassage, "segments").length > 0
   ? {
      path: passageSegmentsPath,
      values: arrayValue(directPassage, "segments"),
     }
   : arrayValue(record, "segments").length > 0
     ? {
        path: segmentsPath,
        values: arrayValue(record, "segments"),
       }
     : null;
 const clozeAnswerSource = firstArraySource(
  record,
  ["blanks", "answers", "answer_key", "cloze_answers", "suggested_answers"],
  hasClozeAnswerValue,
 );
 const rendering = asRecord(record.rendering);
 const renderer = stringValue(rendering, "renderer");
 const variant = stringValue(record, "variant");
 const isReadingCloze =
  Boolean(passage) &&
  clozeAnswerCount > 0 &&
  (item.type === "reading_fill_blank" ||
   item.type === "reading_cloze" ||
   variant.includes("cloze") ||
   renderer.includes("cloze"));
 const questionsOnlyProvideClozeAnswers =
  isReadingCloze &&
  questions.length > 0 &&
  questions.every((questionValue) => {
   const question = asRecord(questionValue);

   return (
    hasClozeAnswerValue(questionValue) &&
    !stringValue(question, "prompt") &&
    !stringValue(question, "question") &&
    !stringValue(question, "text") &&
    !stringValue(asRecord(question.statement), "zh") &&
    !stringValue(asRecord(question.statement), "vi")
   );
  });
 const hasStructuredQuestionGroups = parts.length > 0 || groups.length > 0;
 const isReadingExercise = getExerciseRendererMeta(item.type).family === "reading";
 const questionAnswersAreInline =
  questions.length > 0 &&
  questions.every((questionValue, index) => {
   return questionHasInlineAnswer(questionValue) || Boolean(formatAnswer(answerKey[index]));
  });
 const shouldRenderAggregateAnswerKey = !isReadingCloze && !questionAnswersAreInline;

 const scenarioText =
  stringValue(record, "scenario_vi") ||
  stringValue(record, "scenario") ||
  stringValue(record, "situation_vi");

 const functionText = stringValue(record, "function_vi") || stringValue(record, "function");

 const extraPayloads = [
  {
   title: "Bảng",
   value: record.table,
  },
  {
   title: "Cặp luyện",
   value: firstArrayByKeys(record, ["pairs", "minimal_pairs"]),
  },
  {
   title: "Cụm luyện",
   value: firstArrayByKeys(record, ["phrases"]),
  },
  {
   title: "Drills",
   value: firstArrayByKeys(record, ["drills"]),
  },
  {
   title: "Câu đúng",
   value: firstArrayByKeys(record, ["correct_examples", "correct_sentences"]),
  },
  {
   title: "Câu sai",
   value: firstArrayByKeys(record, ["wrong_examples", "wrong_sentences"]),
  },
  {
   title: "Gợi ý kể lại",
   value: arrayValue(record, "retell_prompts"),
  },
  {
   title: "Bài đọc liên quan",
   value: readingReference,
  },
  {
   title: "Luyện viết chữ liên quan",
   value: stringValue(record, "character_writing_ref"),
  },
 ];

 const hasStructuredPayload =
  items.length > 0 ||
  parts.length > 0 ||
  groups.length > 0 ||
  leftItems.length > 0 ||
  rightItems.length > 0 ||
  questions.length > 0 ||
  Boolean(passage) ||
  extraPayloads.some((payload) => hasRenderableValue(payload.value));

 return (
  <div className="grid gap-3">
   <SupplementaryPills itemId={item.id} values={supplementaryWords} displayMode={displayMode} />

   {lessonId && itemPath && wordBank.length > 0 ? (
    <EditableNodeWrapper
     lessonId={lessonId}
     entityType="exercise_word_bank"
     entityId={`${item.id}-word-bank`}
     parentEntityType="exercise"
     parentEntityId={item.id}
     path={[...itemPath, "word_bank"]}
     value={wordBank}
     label="Từ cho sẵn"
    >
     <WordBank values={wordBank} displayMode={displayMode} />
    </EditableNodeWrapper>
   ) : (
    <WordBank values={wordBank} displayMode={displayMode} />
   )}

   <InfoBlock title="Tình huống" value={scenarioText} />
   <InfoBlock title="Chức năng giao tiếp" value={functionText} />

   {pattern && (
    <StudyInstructionText
     tone="accent"
     weight="black"
     className="exercise-answer-surface rounded-xl border p-3"
    >
     {pattern}
    </StudyInstructionText>
   )}

   {(stringValue(model, "prompt") || stringValue(model, "answer")) && (
    <ExerciseQuestionCard
     index={0}
     title={stringValue(model, "prompt") || "Mẫu"}
     answer={stringValue(model, "answer")}
     showAnswer={displayMode.showAnswers}
     displayMode={displayMode}
    />
   )}

   {lessonId && itemPath && passageSegments ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="exercise"
     parentEntityId={item.id}
     title="Cloze segments"
     nodes={passageSegments.values.map((segment, index) => {
      const segmentRecord = asRecord(segment);
      return {
       entityType: "exercise_cloze_segment",
       entityId: stringValue(segmentRecord, "id") || `${item.id}-segment-${index}`,
       path: [...itemPath, ...passageSegments.path, index],
       value: segment,
       label: `Segment ${index + 1}`,
      };
     })}
    />
   ) : null}

   {lessonId && itemPath && clozeAnswerSource ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="exercise"
     parentEntityId={item.id}
     title="Đáp án cloze"
     nodes={clozeAnswerSource.values.map((answer, index) => {
      const answerRecord = asRecord(answer);
      return {
       entityType: "exercise_cloze_answer",
       entityId:
        stringValue(answerRecord, "id") ||
        stringValue(answerRecord, "blank_id") ||
        `${item.id}-cloze-answer-${index}`,
       path: [...itemPath, clozeAnswerSource.key, index],
       value: answer,
       label: `Đáp án ${index + 1}`,
      };
     })}
    />
   ) : null}

   {passage ? (
    <PassageCard
     itemId={item.id}
     passage={passage}
     answers={clozeAnswers}
     displayMode={displayMode}
     showTitle={showPassageTitle}
    />
   ) : null}

   <ExerciseRenderIssues
    item={item}
    passage={passage}
    answers={clozeAnswers}
    hasStructuredQuestionGroups={hasStructuredQuestionGroups}
   />

   {items.length > 0 &&
    (lessonId && itemPath ? (
     <div className="grid gap-2">
      {items.map((entryValue, index) => {
       const entry = asRecord(entryValue);
       const entityId = stringValue(entry, "id") || `${item.id}-item-${index}`;

       return (
        <EditableNodeWrapper
         key={entityId}
         lessonId={lessonId}
         entityType="exercise_question"
         entityId={entityId}
         parentEntityType="exercise"
         parentEntityId={item.id}
         path={[...itemPath, "items", index]}
         value={entryValue}
         label={`Mục ${index + 1}`}
        >
         <LooseItemGrid items={[entryValue]} displayMode={displayMode} />
        </EditableNodeWrapper>
       );
      })}
     </div>
    ) : (
     <LooseItemGrid items={items} displayMode={displayMode} />
    ))}

   {parts.length > 0 && (
    <div className="grid gap-3">
     {parts.map((partValue, partIndex) => (
      <QuestionGroupCard
       key={stringValue(asRecord(partValue), "id") || `${item.id}-part-${partIndex}`}
       lessonId={lessonId}
       itemPath={itemPath}
       itemId={`${item.id}-part-${partIndex}`}
       exerciseType={item.type}
       parentExerciseId={item.id}
       groupPath={["parts", partIndex]}
       groupValue={partValue}
       index={partIndex}
       fallbackTitle={`Phần ${partIndex + 1}`}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(leftItems.length > 0 || rightItems.length > 0) && (
    <div className="grid gap-2 md:grid-cols-2">
     <MatchingColumn
      lessonId={lessonId}
      itemPath={itemPath}
      itemId={item.id}
      title="Cột A"
      values={leftItems}
      sourceKey={leftSource?.key ?? "left_items"}
      labelMode="number"
      displayMode={displayMode}
     />

     <MatchingColumn
      lessonId={lessonId}
      itemPath={itemPath}
      itemId={item.id}
      title="Cột B"
      values={rightItems}
      sourceKey={rightSource?.key ?? "right_items"}
      labelMode="letter"
      displayMode={displayMode}
     />
    </div>
   )}

   {extraPayloads.map((payload) => (
    <ExtraPayloadBlock
     key={payload.title}
     title={payload.title}
     value={payload.value}
     displayMode={displayMode}
    />
   ))}

   {groups.length > 0 && (
    <div className="grid gap-2">
     {groups.map((groupValue, index) => (
      <QuestionGroupCard
       key={stringValue(asRecord(groupValue), "id") || `${item.id}-group-${index}`}
       lessonId={lessonId}
       itemPath={itemPath}
       itemId={`${item.id}-group-${index}`}
       exerciseType={item.type}
       parentExerciseId={item.id}
       groupPath={["groups", index]}
       groupValue={groupValue}
       index={index}
       fallbackTitle="Nhóm câu"
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {questions.length > 0 && (!isReadingCloze || !questionsOnlyProvideClozeAnswers) ? (
    <div className="grid gap-2">
     {questions.map((questionValue, index) => {
      const questionId = stringValue(asRecord(questionValue), "id") || `${item.id}-${index}`;
      const questionCard = isReadingExercise ? (
       <ReadingQuestionCard
        itemId={item.id}
        readingType={item.type}
        questionValue={questionValue}
        index={index}
        showAnswers={displayMode.showAnswers}
        displayMode={displayMode}
        answerOverride={answerKey[index]}
       />
      ) : (
       <QuestionCard
        itemId={item.id}
        exerciseType={item.type}
        questionValue={questionValue}
        index={index}
        displayMode={displayMode}
        answerOverride={answerKey[index]}
       />
      );

      return lessonId && itemPath ? (
       <EditableNodeWrapper
        key={questionId}
        lessonId={lessonId}
        entityType="exercise_question"
        entityId={questionId}
        parentEntityType="exercise"
        parentEntityId={item.id}
        path={[...itemPath, "questions", index]}
        value={questionValue}
        label={`Câu ${index + 1}`}
       >
        {questionCard}
       </EditableNodeWrapper>
      ) : (
       <div key={questionId}>{questionCard}</div>
      );
     })}
    </div>
   ) : !hasStructuredPayload ? (
    <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
   ) : null}

   {shouldRenderAggregateAnswerKey && (
    <EditableAnswerKeyList
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={item.id}
     sourcePath={[answerKeySource]}
     values={answerKey}
     showAnswers={displayMode.showAnswers}
    />
   )}
  </div>
 );
}
