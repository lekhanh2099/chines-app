import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Button } from "@/components/ui/button";
import type { ClozeAnswer } from "./types";

export function AnswerList({
 answers,
 open,
 onOpenChange,
}: {
 answers: ClozeAnswer[];
 open: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 if (answers.length === 0) return null;

 return (
  <div className="exercise-answer-surface rounded-lg border">
   <Button
    type="button"
    variant="ghost"
    align="start"
    emphasis="overline"
    className="w-full cursor-pointer"
    aria-expanded={open}
    onClick={() => onOpenChange(!open)}
   >
    Xem đáp án ({answers.length})
   </Button>
   {open && (
    <div className="grid gap-1 border-t border-border-default px-3 py-2">
     {answers.map((answer) => (
      <StudyInstructionText key={answer.key} tone="accent" weight="bold">
       {answer.label}: {answer.answer}
       {answer.pinyin && ` · ${answer.pinyin}`}
       {answer.note && ` — ${answer.note}`}
      </StudyInstructionText>
     ))}
    </div>
   )}
  </div>
 );
}
