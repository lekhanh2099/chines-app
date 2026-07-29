import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { Warning } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function WarningSection({ warnings }: { warnings: Warning[] }) {
 return (
  <VocabReadingSection id="vocab-notes" title="Lưu ý lỗi sai">
   <div className="grid gap-3">
    {warnings.map((warning) => (
     <div
      key={warning.id}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3"
     >
      {warning.rule_vi && (
       <StudyInstructionText tone="default" weight="black">
        {warning.rule_vi}
       </StudyInstructionText>
      )}
      {warning.explanation_vi && (
       <StudyInstructionText>{warning.explanation_vi}</StudyInstructionText>
      )}
      {warning.wrong_examples.map((example) => (
       <StudyInstructionText key={`wrong-${example.zh}`} tone="dangerStrong">
        Sai: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </StudyInstructionText>
      ))}
      {warning.correct_examples.map((example) => (
       <StudyInstructionText key={`correct-${example.zh}`} tone="successStrong">
        Đúng: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </StudyInstructionText>
      ))}
      {warning.natural_examples.map((example) => (
       <StudyInstructionText key={`natural-${example.zh}`}>
        Tự nhiên: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </StudyInstructionText>
      ))}
     </div>
    ))}
   </div>
  </VocabReadingSection>
 );
}
