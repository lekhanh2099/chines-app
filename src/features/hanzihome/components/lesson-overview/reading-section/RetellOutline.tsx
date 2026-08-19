import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { answerToString } from "../utils";

export function RetellOutline({ itemId, values }: { itemId: string; values: JsonValue[] }) {
 const outline = values.map(answerToString).filter(Boolean);

 if (outline.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Dàn ý kể lại
   </StudyInstructionText>
   <div className="grid gap-2">
    {outline.map((line, index) => (
     <StudyInstructionText
      key={`${itemId}-retell-${index}`}
      tone="default"
      weight="bold"
      className="rounded-lg bg-bg-primary px-3 py-2"
      lang="zh-CN"
     >
      {index + 1}. {line}
     </StudyInstructionText>
    ))}
   </div>
  </div>
 );
}
