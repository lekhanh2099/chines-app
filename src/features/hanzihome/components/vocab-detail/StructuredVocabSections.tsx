import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { hasComparisonContent, hasWordFormationContent } from "./content-checks";
import { CollocationSection } from "./CollocationSection";
import { ComparisonSection } from "./ComparisonSection";
import { StructuredExamplesSection } from "./StructuredExamplesSection";
import type { SectionView } from "./types";
import { WordFormationDetailSection } from "./WordFormationDetailSection";

export function StructuredVocabSections({
 item,
 lessonId,
 itemPath,
 sectionView,
 keyword,
}: {
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: EditableNodePath;
 sectionView: SectionView;
 keyword: string;
}) {
 const show = (section: SectionView) => sectionView === "all" || sectionView === section;

 return (
  <>
   {show("examples") && item.examples.length > 0 && (
    <StructuredExamplesSection
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
     keyword={keyword}
    />
   )}
   {show("comparisons") && hasComparisonContent(item.comparison) && (
    <ComparisonSection comparison={item.comparison} />
   )}
   {show("etymology") && hasWordFormationContent(item.word_formation) && (
    <WordFormationDetailSection formation={item.word_formation} />
   )}

   {show("all") && item.collocations.length > 0 && (
    <CollocationSection
     collocations={item.collocations}
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
    />
   )}
  </>
 );
}
