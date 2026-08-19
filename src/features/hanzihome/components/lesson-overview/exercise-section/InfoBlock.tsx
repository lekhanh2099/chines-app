import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function InfoBlock({ title, value }: { title: string; value: string }) {
 if (!value) return null;

 return (
  <div className="study-content-surface rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {title}
   </StudyInstructionText>
   <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed" wrapping="preWrap">
    {value}
   </StudyInstructionText>
  </div>
 );
}
