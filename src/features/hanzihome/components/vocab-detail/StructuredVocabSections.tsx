import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ReactNode } from "react";

import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { hasComparisonContent, hasWordFormationContent } from "./content-checks";
import { CollocationSection } from "./CollocationSection";
import { ComparisonSection } from "./ComparisonSection";
import { StructuredExamplesSection } from "./StructuredExamplesSection";
import type { SectionView } from "./types";
import { WordFormationDetailSection } from "./WordFormationDetailSection";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { VocabReadingSection } from "./VocabReadingSection";

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
 const details = item.detailSections ?? [];
 const detailByKey = (key: string) => details.find((section) => section.key === key);
 const wrapDetail = (section: ReturnType<typeof detailByKey>, content: ReactNode) => {
  if (!section || !lessonId || !itemPath) return content;
  const index = details.findIndex((entry) => entry.id === section.id);
  return (
   <EditableNodeWrapper
    key={section.id}
    lessonId={lessonId}
    entityType="vocab_detail_section"
    entityId={section.id}
    parentEntityType="vocab_item"
    parentEntityId={getVocabItemKey(item)}
    path={[...itemPath, "detailSections", index]}
    value={section}
    label={section.title}
    editLabel="Sửa section"
   >
    {content}
   </EditableNodeWrapper>
  );
 };
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
    <StructuredExamplesSection
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
     keyword={keyword}
    />
   )}
   {show("comparisons") &&
    hasComparisonContent(item.comparison) &&
    wrapDetail(detailByKey("comparison"), <ComparisonSection comparison={item.comparison} />)}
   {show("etymology") &&
    hasWordFormationContent(item.word_formation) &&
    wrapDetail(
     detailByKey("word_formation"),
     <WordFormationDetailSection formation={item.word_formation} />,
    )}

   {show("all") && item.collocations.length > 0 && (
    <CollocationSection
     collocations={item.collocations}
     item={item}
     itemPath={itemPath}
     lessonId={lessonId}
     section={detailByKey("collocations")}
    />
   )}
   {show("all") &&
    details
     .filter((section) => !standardKeys.has(section.key) && section.lines.length > 0)
     .map((section) =>
      wrapDetail(
       section,
       <VocabReadingSection id={`vocab-${section.id}`} title={section.title}>
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
       </VocabReadingSection>,
      ),
     )}
  </>
 );
}
