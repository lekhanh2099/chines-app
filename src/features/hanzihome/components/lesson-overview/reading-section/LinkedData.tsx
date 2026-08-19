import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function LinkedData({
 exerciseRef,
 linkedReadingId,
}: {
 exerciseRef: string;
 linkedReadingId: string;
}) {
 if (!exerciseRef && !linkedReadingId) return null;

 return (
  <div className="exercise-card-surface grid gap-1 rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Liên kết trong bài
   </StudyInstructionText>
   {exerciseRef && (
    <StudyInstructionText tone="default" weight="bold">
     Bài tập liên quan: {exerciseRef}
    </StudyInstructionText>
   )}
   {linkedReadingId && (
    <StudyInstructionText tone="default" weight="bold">
     Bài đọc liên quan: {linkedReadingId}
    </StudyInstructionText>
   )}
  </div>
 );
}
