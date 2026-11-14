import type { ReactNode } from "react";
import { containsHanziText, ReaderHanziText, StudyInstructionText } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";

export function ExercisePill({
 children,
 displayMode,
}: {
 children: ReactNode;
 displayMode?: LessonDisplayMode;
}) {
 const hanzi = typeof children === "string" && containsHanziText(children);

 if (hanzi && displayMode && typeof children === "string") {
  return (
   <ReaderHanziText
    displayMode={displayMode}
    weight="bold"
    leading="learner"
    className="study-content-surface rounded-lg border px-3 py-2"
   >
    {children}
   </ReaderHanziText>
  );
 }

 return (
  <StudyInstructionText
   weight="bold"
   leading="learner"
   className="study-content-surface rounded-lg border px-3 py-2"
  >
   {children}
  </StudyInstructionText>
 );
}
