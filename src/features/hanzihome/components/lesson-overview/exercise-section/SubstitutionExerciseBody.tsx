import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { AnswerKeyList, EmptySectionState } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { ModelBlock } from "./ModelBlock";
import { SubstitutionPartCard, SubstitutionPatternCard } from "./SubstitutionExerciseGroupCards";
import { SubstitutionItemEntry } from "./SubstitutionExerciseItemEntry";
import { SupplementaryPills } from "./SupplementaryPills";
import { firstArraySource } from "./exercise-utils";

export function SubstitutionExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const modelSource = firstArraySource(record, ["model"]);
 const modelsSource = firstArraySource(record, ["models"]);
 const model = modelSource?.values ?? [];
 const models = modelsSource?.values ?? [];
 const patternGroups = arrayValue(record, "patterns");
 const partGroups = arrayValue(record, "parts");
 const items = [...arrayValue(record, "items"), ...arrayValue(record, "questions")];
 const answerKey = arrayValue(record, "answer_key");
 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 return (
  <div className="grid gap-3">
   <SupplementaryPills itemId={item.id} values={supplementaryWords} displayMode={displayMode} />

   <ModelBlock values={[...model, ...models]} displayMode={displayMode} />

   {partGroups.length > 0 && (
    <div className="grid gap-3">
     {partGroups.map((partValue, partIndex) => (
      <SubstitutionPartCard
       key={stringValue(asRecord(partValue), "id") || `${item.id}-part-${partIndex}`}
       displayMode={displayMode}
       partValue={partValue}
       partIndex={partIndex}
      />
     ))}
    </div>
   )}

   {patternGroups.length > 0 && (
    <div className="grid gap-3">
     {patternGroups.map((groupValue, groupIndex) => (
      <SubstitutionPatternCard
       key={stringValue(asRecord(groupValue), "id") || `${item.id}-pattern-${groupIndex}`}
       itemId={item.id}
       displayMode={displayMode}
       groupValue={groupValue}
       groupIndex={groupIndex}
      />
     ))}
    </div>
   )}

   {items.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2">
     {items.map((entryValue, index) => {
      const entityId = stringValue(asRecord(entryValue), "id") || `${item.id}-${index}`;

      return (
       <SubstitutionItemEntry
        key={entityId}
        itemId={item.id}
        displayMode={displayMode}
        entryValue={entryValue}
        index={index}
       />
      );
     })}
    </div>
   ) : (
    patternGroups.length === 0 &&
    partGroups.length === 0 && <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
   )}

   <AnswerKeyList defaultOpen={displayMode.showAnswers} itemId={item.id} values={answerKey} />
  </div>
 );
}
