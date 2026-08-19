import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonObject } from "@/types/json";
import { asRecord, stringValue } from "../utils";

export function GrammarBlockItemView({ item }: { item: JsonObject }) {
 const left = asRecord(item.left);
 const right = asRecord(item.right);
 const aspect = stringValue(item, "aspect");
 const wrong = stringValue(item, "wrong");
 const correct = stringValue(item, "correct");
 const explanation = stringValue(item, "explanation_vi");

 if (stringValue(left, "label") || stringValue(right, "label")) {
  return (
   <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
    {aspect && (
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      {aspect}
     </StudyInstructionText>
    )}
    <div className="grid gap-2 sm:grid-cols-2">
     {[left, right].map((side, index) => (
      <div key={`${stringValue(side, "label")}-${index}`} className="rounded-lg bg-bg-primary p-3">
       <StudyInstructionText tone="default" weight="black">
        {stringValue(side, "label")}
       </StudyInstructionText>
       <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
        {stringValue(side, "value")}
       </StudyInstructionText>
      </div>
     ))}
    </div>
   </div>
  );
 }

 if (wrong || correct) {
  return (
   <div className="grid gap-2 rounded-lg border border-danger/20 bg-danger-subtle/40 p-3">
    {wrong && (
     <StudyInstructionText tone="danger" weight="semibold">
      Sai:{" "}
      <StudyInstructionText as="span" weight="black">
       {wrong}
      </StudyInstructionText>
     </StudyInstructionText>
    )}
    {correct && (
     <StudyInstructionText tone="success" weight="semibold">
      Đúng:{" "}
      <StudyInstructionText as="span" weight="black">
       {correct}
      </StudyInstructionText>
     </StudyInstructionText>
    )}
    {explanation && (
     <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
      {explanation}
     </StudyInstructionText>
    )}
   </div>
  );
 }

 return null;
}
