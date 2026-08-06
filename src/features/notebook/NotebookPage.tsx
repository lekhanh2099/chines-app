"use client";

import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

import { NotebookContent } from "@/features/notebook/components/NotebookContent";
import { NotebookSectionGuide } from "@/features/notebook/components/NotebookSectionGuide";
import { NotebookToolbar } from "@/features/notebook/components/NotebookToolbar";
import {
 getNotebookSectionComparisons,
 getNotebookSectionItems,
 notebookSectionIds,
 notebookSeedData,
} from "@/features/notebook/data/notebookSeedData";
import type { NotebookSectionId, NotebookViewMode } from "@/features/notebook/types";
import { filterNotebookItems } from "@/features/notebook/utils/filterNotebookItems";

export function NotebookPage() {
 const [sectionId, setSectionId] = useState<NotebookSectionId>("conjunctions");
 const [groupId, setGroupId] = useState("all");
 const [query, setQuery] = useState("");
 const [viewMode, setViewMode] = useState<NotebookViewMode>("cards");
 const section = notebookSeedData[sectionId];
 const sectionItems = useMemo(() => getNotebookSectionItems(sectionId), [sectionId]);
 const visibleItems = useMemo(
  () => filterNotebookItems(sectionItems, groupId, query),
  [groupId, query, sectionItems],
 );
 const visibleComparisons = useMemo(() => {
  const comparisons = getNotebookSectionComparisons(sectionId);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");

  if (!normalizedQuery) return comparisons;

  return comparisons.filter((comparison) =>
   [
    comparison.title,
    comparison.note,
    comparison.rule,
    comparison.danger,
    ...comparison.terms,
   ].some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery)),
  );
 }, [query, sectionId]);

 const handleSectionChange = (nextSectionId: NotebookSectionId) => {
  setSectionId(nextSectionId);
  setGroupId("all");
 };

 return (
  <div className="mx-auto grid w-full max-w-full gap-4 px-3 py-4 sm:px-5 sm:py-6 lg:gap-5 lg:px-8">
   <NotebookToolbar
    data={notebookSeedData}
    sectionIds={notebookSectionIds}
    sectionId={sectionId}
    groups={section.groups}
    groupId={groupId}
    query={query}
    viewMode={viewMode}
    onSectionChange={handleSectionChange}
    onGroupChange={setGroupId}
    onQueryChange={setQuery}
    onViewModeChange={setViewMode}
   />
   <section className="grid gap-3">
    <div className="flex flex-wrap items-end justify-between gap-3 px-1">
     <div>
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
       {section.label} · <span lang="zh-CN">{section.zh}</span>
      </Typography>
      <Typography
       as="p"
       variant="bodySmall"
       tone="muted"
       weight="medium"
       leading="standard"
       className="mt-1 max-w-4xl"
      >
       {section.desc}
      </Typography>
     </div>
     <Badge variant="purple" size="md">
      {section.terms.length} mục · {section.groups.length} nhóm · {section.compares.length} cặp
     </Badge>
    </div>
    <NotebookSectionGuide section={section} />
    <NotebookContent items={visibleItems} comparisons={visibleComparisons} viewMode={viewMode} />
   </section>
  </div>
 );
}
