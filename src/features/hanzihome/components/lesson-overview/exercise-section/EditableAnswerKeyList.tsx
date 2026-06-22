import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { AnswerKeyList } from "../CommonCards";
import { asRecord, stringValue } from "../utils";

export function EditableAnswerKeyList({
 lessonId,
 itemPath,
 itemId,
 sourcePath,
 values,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 sourcePath: EditableNodePath;
 values: unknown[];
}) {
 return (
  <AnswerKeyList
   itemId={itemId}
   values={values}
   renderAnswer={
    lessonId && itemPath
     ? (value, index, content) => {
        const answer = asRecord(value);
        const entityId =
         stringValue(answer, "id") ||
         stringValue(answer, "question_id") ||
         stringValue(answer, "blank_id") ||
         `${itemId}-${sourcePath.join("-")}-${index}`;

        return (
         <EditableNodeWrapper
          lessonId={lessonId}
          entityType="exercise_answer_key"
          entityId={entityId}
          parentEntityType="exercise"
          parentEntityId={itemId}
          path={[...itemPath, ...sourcePath, index]}
          value={value}
          label={`Đáp án ${index + 1}`}
         >
          {content}
         </EditableNodeWrapper>
        );
       }
     : undefined
   }
  />
 );
}
