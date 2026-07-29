import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function EmptySectionState({ reason }: { reason?: string }) {
 return (
  <div className="rounded-xl border border-dashed border-border-default bg-bg-primary p-4">
   <StudyInstructionText tone="default" weight="black">
    Không có dữ liệu cho phần này.
   </StudyInstructionText>
   {reason && (
    <StudyInstructionText tone="muted" weight="semibold">
     {reason}
    </StudyInstructionText>
   )}
  </div>
 );
}
