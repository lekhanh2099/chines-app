import rawNotebookSeedData from "./notebookSeedData.json";

import {
 NotebookSeedDataSchema,
 type NotebookComparisonItem,
 type NotebookItem,
 type NotebookSectionId,
} from "@/features/notebook/types";

export const notebookSeedData = NotebookSeedDataSchema.parse(rawNotebookSeedData);

export const notebookSectionIds = NotebookSeedDataSchema.keyof().options;

export const notebookItems: NotebookItem[] = notebookSectionIds.flatMap((sectionId) =>
 notebookSeedData[sectionId].terms.map((term, index) => ({
  ...term,
  id: `${sectionId}-term-${index + 1}`,
  sectionId,
 })),
);

export const notebookComparisons: NotebookComparisonItem[] = notebookSectionIds.flatMap(
 (sectionId) =>
  notebookSeedData[sectionId].compares.map((comparison, index) => ({
   ...comparison,
   id: `${sectionId}-compare-${index + 1}`,
   sectionId,
  })),
);

export const notebookTotals = {
 items: notebookItems.length,
 groups: notebookSectionIds.reduce(
  (total, sectionId) => total + notebookSeedData[sectionId].groups.length,
  0,
 ),
 comparisons: notebookComparisons.length,
};

export function getNotebookSectionItems(sectionId: NotebookSectionId) {
 return notebookItems.filter((item) => item.sectionId === sectionId);
}

export function getNotebookSectionComparisons(sectionId: NotebookSectionId) {
 return notebookComparisons.filter((comparison) => comparison.sectionId === sectionId);
}
