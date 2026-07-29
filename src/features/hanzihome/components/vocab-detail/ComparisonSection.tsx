import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { Comparison } from "@/features/hanzihome/schemas/vocab.types";
import { ComparisonGroup } from "./ComparisonGroup";
import { VocabReadingSection } from "./VocabReadingSection";

export function ComparisonSection({ comparison }: { comparison: Comparison }) {
 return (
  <VocabReadingSection id="vocab-comparisons" title="So sánh / phân biệt">
   <div className="grid gap-3">
    {comparison.near_synonyms.length > 0 && (
     <ComparisonGroup
      title="Gần nghĩa"
      rows={comparison.near_synonyms.map((entry) => ({
       key: entry.word,
       title: entry.word,
       body: entry.difference_vi || entry.meaning_vi,
       example: entry.example_zh || entry.example_vi,
      }))}
     />
    )}
    {comparison.antonyms.length > 0 && (
     <ComparisonGroup
      title="Trái nghĩa"
      rows={comparison.antonyms.map((entry) => ({
       key: entry.word,
       title: entry.word,
       body: entry.difference_vi || entry.meaning_vi,
       example: entry.example_zh || entry.example_vi,
      }))}
     />
    )}
    {comparison.contrast_pairs.length > 0 && (
     <ComparisonGroup
      title="Cặp dễ nhầm"
      rows={comparison.contrast_pairs.map((entry) => ({
       key: `${entry.left}-${entry.right}`,
       title: `${entry.left} / ${entry.right}`,
       body: entry.meaning_vi || entry.note_vi,
      }))}
     />
    )}
    {comparison.usage_rules.map((rule) => (
     <StudyInstructionText key={rule}>{rule}</StudyInstructionText>
    ))}
   </div>
  </VocabReadingSection>
 );
}
