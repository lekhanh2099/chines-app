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
      {warning.rule_vi && <p className="font-black text-text-primary">{warning.rule_vi}</p>}
      {warning.explanation_vi && <p>{warning.explanation_vi}</p>}
      {warning.wrong_examples.map((example) => (
       <p key={`wrong-${example.zh}`} className="text-danger">
        Sai: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
      {warning.correct_examples.map((example) => (
       <p key={`correct-${example.zh}`} className="text-success">
        Đúng: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
      {warning.natural_examples.map((example) => (
       <p key={`natural-${example.zh}`}>
        Tự nhiên: {example.zh} {example.vi ? `- ${example.vi}` : ""}
       </p>
      ))}
     </div>
    ))}
   </div>
  </VocabReadingSection>
 );
}
