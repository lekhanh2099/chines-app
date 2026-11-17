import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { hasComparisonContent, hasWordFormationContent } from "./content-checks";
import { CollocationSection } from "./CollocationSection";
import { ComparisonSection } from "./ComparisonSection";
import { StructuredExamplesSection } from "./StructuredExamplesSection";
import type { SectionView } from "./types";
import { WordFormationDetailSection } from "./WordFormationDetailSection";
import { VocabReadingSection } from "./VocabReadingSection";

export function StructuredVocabSections({
 item,
 sectionView,
 keyword,
}: {
 item: HanziHomeVocabItem;
 sectionView: SectionView;
 keyword: string;
}) {
 const show = (section: SectionView) => sectionView === "all" || sectionView === section;
 const details = item.detailSections ?? [];
 const standardKeys = new Set([
  "meaning",
  "word_formation",
  "comparison",
  "collocations",
  "culture",
  "warnings",
  "notes",
 ]);

 return (
  <>
   {show("examples") && item.examples.length > 0 && (
    <StructuredExamplesSection item={item} keyword={keyword} />
   )}
   {show("comparisons") && hasComparisonContent(item.comparison) && (
    <ComparisonSection comparison={item.comparison} />
   )}
   {show("etymology") && hasWordFormationContent(item.word_formation) && (
    <WordFormationDetailSection formation={item.word_formation} />
   )}

   {show("all") && item.collocations.length > 0 && (
    <CollocationSection collocations={item.collocations} />
   )}
   {show("all") &&
    details
     .filter((section) => !standardKeys.has(section.key) && section.lines.length > 0)
     .map((section) => (
      <VocabReadingSection key={section.id} id={`vocab-${section.id}`} title={section.title}>
       <div className="grid gap-2">
        {section.lines.map((line, index) => (
         <HanziAwareText
          key={`${section.id}-${index}`}
          text={line}
          tone="default"
          leading="relaxed"
         />
        ))}
       </div>
      </VocabReadingSection>
     ))}
  </>
 );
}
