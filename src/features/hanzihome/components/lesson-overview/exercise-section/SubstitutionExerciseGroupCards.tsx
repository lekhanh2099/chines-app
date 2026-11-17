import { Fragment } from "react";
import { Typography } from "@/components/ui/display/typography";

import { EmptySectionState, ExerciseQuestionCard, LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { ModelBlock } from "./ModelBlock";
import { modelLineEntries, promptToString } from "./exercise-utils";

/** One `parts[]` group: title, its own model lines and its practice items. */
export function SubstitutionPartCard({
 displayMode,
 partValue,
 partIndex,
}: {
 displayMode: LessonDisplayMode;
 partValue: ReturnType<typeof arrayValue>[number];
 partIndex: number;
}) {
 const part = asRecord(partValue);
 const partModelEntries = modelLineEntries(part);
 const partItems = arrayValue(part, "items");
 const partTitle =
  stringValue(part, "title_vi") || stringValue(part, "title") || `Mẫu ${partIndex + 1}`;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <Typography as="h5" variant="cardTitle" tone="default" weight="black">
    {partTitle}
   </Typography>

   <ModelBlock
    title="Mẫu trong phần"
    values={partModelEntries.map((entry) => entry.value)}
    displayMode={displayMode}
   />

   <LooseItemGrid items={partItems} displayMode={displayMode} />
  </div>
 );
}

/** One `patterns[]` group: its model lines and the substitution prompts that follow them. */
export function SubstitutionPatternCard({
 itemId,
 displayMode,
 groupValue,
 groupIndex,
}: {
 itemId: string;
 displayMode: LessonDisplayMode;
 groupValue: ReturnType<typeof arrayValue>[number];
 groupIndex: number;
}) {
 const group = asRecord(groupValue);
 const groupModelEntries = modelLineEntries(group);
 const groupItems = arrayValue(group, "items");

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <ModelBlock
    title="Mẫu luyện"
    values={groupModelEntries.map((entry) => entry.value)}
    displayMode={displayMode}
   />

   {groupItems.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2">
     {groupItems.map((entryValue, index) => {
      const entry = asRecord(entryValue);
      const title =
       promptToString(entry.prompt) ||
       stringValue(entry, "prompt") ||
       stringValue(entry, "substitution") ||
       stringValue(entry, "text") ||
       "Câu";
      const answer =
       stringValue(entry, "sample_answer") ||
       answerToString(entry.answer) ||
       nonEmptyStrings(arrayValue(entry, "expected_dialogue")).join(" / ");

      const entityId = stringValue(entry, "id") || `${itemId}-${groupIndex}-${index}`;
      const content = (
       <ExerciseQuestionCard
        index={index + 1}
        title={title}
        answer={answer}
        showAnswer={displayMode.showAnswers}
        note={stringValue(entry, "explanation_vi")}
        displayMode={displayMode}
       />
      );

      return <Fragment key={entityId}>{content}</Fragment>;
     })}
    </div>
   ) : (
    <EmptySectionState reason="Nhóm mẫu này chưa có câu luyện." />
   )}
  </div>
 );
}
