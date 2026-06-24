"use client";

import { useMemo, useState } from "react";

import { NotebookContent } from "@/features/notebook/components/NotebookContent";
import { NotebookHero } from "@/features/notebook/components/NotebookHero";
import { NotebookSectionGuide } from "@/features/notebook/components/NotebookSectionGuide";
import { NotebookToolbar } from "@/features/notebook/components/NotebookToolbar";
import {
 getNotebookSectionComparisons,
 getNotebookSectionItems,
 notebookSectionIds,
 notebookSeedData,
 notebookTotals,
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
   <NotebookHero
    itemCount={notebookTotals.items}
    groupCount={notebookTotals.groups}
    comparisonCount={notebookTotals.comparisons}
   />
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
      <h2 className="text-2xl font-black text-text-primary">
       {section.label} · <span lang="zh-CN">{section.zh}</span>
      </h2>
      <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-text-muted">{section.desc}</p>
     </div>
     <span className="rounded-xl bg-[#20233a] px-3 py-2 text-xs font-black text-white">
      {section.terms.length} mục · {section.groups.length} nhóm · {section.compares.length} cặp
     </span>
    </div>
    <NotebookSectionGuide section={section} />
    <NotebookContent items={visibleItems} comparisons={visibleComparisons} viewMode={viewMode} />
   </section>
  </div>
 );
}
